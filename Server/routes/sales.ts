import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

function parseCookie(cookieHeader: string | undefined) {
  return (cookieHeader || "").split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=").map((item) => item.trim());
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function salesAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionHeaderToken = req.headers.session?.toString().split(" ")[1];
    const cookieToken = parseCookie(req.headers.cookie?.toString())["sessionhold"];
    const token = sessionHeaderToken || cookieToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!["admin", "sales_staff"].includes(decoded.role)) {
      return res.status(403).json({ error: "Forbidden - Sales only" });
    }

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function nextId(table: string, column: string) {
  return `(SELECT COALESCE(MAX(${column}), 0) + 1 FROM ${table})`;
}

router.get("/sales/summary", salesAuth, async (_req: Request, res: Response) => {
  try {
    const [pendingOrders, promotions, coupons, birthdays] = await Promise.all([
      client.query(`SELECT COUNT(*)::int AS count FROM orders WHERE COALESCE(order_status, orderstatus) IN ('Pending','Confirmed')`),
      client.query(`SELECT COUNT(*)::int AS count FROM promotions WHERE is_active = true`),
      client.query(`SELECT COUNT(*)::int AS count FROM coupons WHERE validuntil IS NULL OR validuntil >= NOW()`),
      client.query(`SELECT COUNT(*)::int AS count FROM child_profiles WHERE TO_CHAR(birth_date, 'MM-DD') BETWEEN TO_CHAR(CURRENT_DATE, 'MM-DD') AND TO_CHAR(CURRENT_DATE + INTERVAL '30 days', 'MM-DD')`),
    ]);

    res.status(200).json({
      pendingOrders: pendingOrders.rows[0].count,
      activePromotions: promotions.rows[0].count,
      activeCoupons: coupons.rows[0].count,
      upcomingBirthdays: birthdays.rows[0].count,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/sales/products/consult", salesAuth, async (req: Request, res: Response) => {
  try {
    const { ageGroup, skillType, gender, keyword } = req.query;
    const params: any[] = [];
    const where: string[] = [];

    if (ageGroup) { params.push(ageGroup); where.push(`p.age_group = $${params.length}`); }
    if (skillType) { params.push(`%${skillType}%`); where.push(`p.skill_type ILIKE $${params.length}`); }
    if (gender) { params.push(gender); where.push(`p.gender = $${params.length}`); }
    if (keyword) { params.push(`%${keyword}%`); where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`); }

    const response = await client.query(
      `SELECT p.productid, p.title, p.price, p.discount, p.stock, p.age_group, p.gender, p.skill_type, p.brand,
              COALESCE(SUM(oi.quantity), 0)::int AS sold_quantity
       FROM products p
       LEFT JOIN orderitems oi ON oi.productid = p.productid
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       GROUP BY p.productid
       ORDER BY sold_quantity DESC, p.stock DESC, p.title ASC
       LIMIT 50`,
      params,
    );
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/sales/orders", salesAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT o.orderid, o.userid, o.totalamount, COALESCE(o.order_status, o.orderstatus) AS status,
             o.createdat, u.username, u.email, COUNT(oi.orderitemid)::int AS item_count
      FROM orders o
      LEFT JOIN users u ON u.userid = o.userid
      LEFT JOIN orderitems oi ON oi.orderid = o.orderid
      GROUP BY o.orderid, u.username, u.email
      ORDER BY o.createdat DESC
      LIMIT 100
    `);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/sales/orders/:orderID/confirm", salesAuth, async (req: Request, res: Response) => {
  try {
    await client.query(
      `UPDATE orders SET orderstatus = 'Confirmed', order_status = 'Confirmed', updatedat = NOW() WHERE orderid = $1`,
      [req.params.orderID],
    );
    res.status(200).json({ message: "Order confirmed" });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/sales/orders", salesAuth, async (req: Request, res: Response) => {
  const { userID, items, isGift, giftMessage } = req.body;
  if (!userID || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Invalid order" });

  try {
    await client.query("BEGIN");
    const productIDs = items.map((item: any) => Number(item.productID));
    const products = await client.query(`SELECT productid, price, stock FROM products WHERE productid = ANY($1::int[])`, [productIDs]);
    const priceMap = new Map(products.rows.map((p) => [Number(p.productid), Number(p.price)]));

    let total = 0;
    for (const item of items) total += (priceMap.get(Number(item.productID)) || 0) * Number(item.quantity || 1);

    const order = await client.query(
      `INSERT INTO orders (orderid, userid, totalamount, orderstatus, order_status, is_gift, gift_message, order_code)
       VALUES (${nextId("orders", "orderid")}, $1, $2, 'Confirmed', 'Confirmed', $3, $4, LPAD((FLOOR(RANDOM()*10000))::text, 4, '0'))
       RETURNING orderid`,
      [userID, total, Boolean(isGift), giftMessage || null],
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO orderitems (orderitemid, orderid, productid, quantity)
         VALUES (${nextId("orderitems", "orderitemid")}, $1, $2, $3)`,
        [order.rows[0].orderid, item.productID, Number(item.quantity || 1)],
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ message: "Order created", orderID: order.rows[0].orderid });
  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/sales/promotions", salesAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`SELECT * FROM promotions ORDER BY created_at DESC`);
    res.status(200).json({ data: response.rows });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

router.post("/sales/promotions", salesAuth, async (req: Request, res: Response) => {
  const { code, type, discount, expirationDate, eventName, ageGroup, season, minChildAge, maxChildAge } = req.body;
  if (!code || !type || !discount) return res.status(400).json({ error: "Missing promotion data" });
  try {
    await client.query(
      `INSERT INTO promotions (id, code, type, discount, expiration_date, is_active, event_name, applicable_age_group, season, min_child_age, max_child_age)
       VALUES (${nextId("promotions", "id")}, $1, $2, $3, $4, true, $5, $6, $7, $8, $9)`,
      [code, type, discount, expirationDate || null, eventName || null, ageGroup || null, season || null, minChildAge || null, maxChildAge || null],
    );
    res.status(201).json({ message: "Promotion created" });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

router.get("/sales/coupons", salesAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`SELECT * FROM coupons ORDER BY createdat DESC`);
    res.status(200).json({ data: response.rows });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

router.post("/sales/coupons", salesAuth, async (req: Request, res: Response) => {
  const { code, description, discountPercentage, maxDiscountAmount, minPurchaseAmount, validFrom, validUntil } = req.body;
  if (!code) return res.status(400).json({ error: "Missing coupon code" });
  try {
    await client.query(
      `INSERT INTO coupons (couponid, code, description, discountpercentage, maxdiscountamount, minpurchaseamount, validfrom, validuntil)
       VALUES (${nextId("coupons", "couponid")}, $1, $2, $3, $4, $5, $6, $7)`,
      [code, description || null, discountPercentage || 0, maxDiscountAmount || null, minPurchaseAmount || null, validFrom || null, validUntil || null],
    );
    res.status(201).json({ message: "Coupon created" });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

router.get("/sales/wishlist-suggestions", salesAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT w.wishlistitemid, w.userid, u.username, u.email, p.productid, p.title, p.price, p.stock, p.age_group, p.skill_type, w.addedat
      FROM wishlistitems w
      JOIN users u ON u.userid = w.userid
      JOIN products p ON p.productid = w.productid
      ORDER BY w.addedat DESC
      LIMIT 100
    `);
    res.status(200).json({ data: response.rows });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

router.get("/sales/customer-birthdays", salesAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT c.child_id, c.user_id, c.child_name, c.birth_date, c.gender, u.username, u.email,
             (CURRENT_DATE - c.birth_date)::int / 365 AS child_age
      FROM child_profiles c
      JOIN users u ON u.userid = c.user_id
      ORDER BY TO_CHAR(c.birth_date, 'MM-DD') ASC
      LIMIT 100
    `);
    res.status(200).json({ data: response.rows });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

router.post("/sales/staff-notes", salesAuth, async (req: Request, res: Response) => {
  const { customerID, note } = req.body;
  if (!customerID || !note) return res.status(400).json({ error: "Missing note" });
  try {
    await client.query(
      `INSERT INTO staff_notes (note_id, staff_id, customer_id, note)
       VALUES (${nextId("staff_notes", "note_id")}, $1, $2, $3)`,
      [(req as any).user?.userID || null, customerID, note],
    );
    res.status(201).json({ message: "Note saved" });
  } catch { res.status(500).json({ error: "Server Error" }); }
});

export default router;
