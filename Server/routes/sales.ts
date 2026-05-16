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
    const cookieToken = parseCookie(req.headers.cookie?.toString()).sessionhold;
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

router.use(salesAuth);

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const [products, pendingOrders, promotions, coupons, wishlistItems, birthdays] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true"),
      client.query("SELECT COUNT(*)::int AS count FROM orders WHERE COALESCE(order_status, orderstatus) IN ('Pending','pending','Confirmed','confirmed')"),
      client.query("SELECT COUNT(*)::int AS count FROM promotions WHERE is_active = true"),
      client.query("SELECT COUNT(*)::int AS count FROM coupons WHERE validuntil IS NULL OR validuntil >= NOW()"),
      client.query("SELECT COUNT(*)::int AS count FROM wishlistitems"),
      client.query(`
        SELECT COUNT(*)::int AS count
        FROM child_profiles
        WHERE birth_date IS NOT NULL
          AND TO_CHAR(birth_date, 'MM-DD') BETWEEN TO_CHAR(CURRENT_DATE, 'MM-DD') AND TO_CHAR(CURRENT_DATE + INTERVAL '30 days', 'MM-DD')
      `),
    ]);

    res.json({
      products: products.rows[0].count,
      pendingOrders: pendingOrders.rows[0].count,
      promotions: promotions.rows[0].count,
      coupons: coupons.rows[0].count,
      wishlistItems: wishlistItems.rows[0].count,
      upcomingChildBirthdays: birthdays.rows[0].count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/products/consult", async (req: Request, res: Response) => {
  const { ageGroup, skillType, gender, keyword } = req.query;
  const values: any[] = [];
  const where: string[] = ["COALESCE(p.is_active, true) = true", "p.stock > 0"];

  const add = (condition: string, value: any) => {
    values.push(value);
    where.push(condition.replace("?", `$${values.length}`));
  };

  if (ageGroup) add("p.age_group ILIKE ?", `%${ageGroup}%`);
  if (skillType) add("p.skill_type ILIKE ?", `%${skillType}%`);
  if (gender) add("(p.gender ILIKE ? OR p.gender ILIKE '%Unisex%')", `%${gender}%`);
  if (keyword) {
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    const base = values.length - 3;
    where.push(`(p.title ILIKE $${base} OR p.description ILIKE $${base + 1} OR p.tags ILIKE $${base + 2} OR p.brand ILIKE $${base + 3})`);
  }

  try {
    const sql = `
      SELECT p.productid, p.title, p.description, p.price, p.discount, p.stock,
             p.age_group, p.gender, p.skill_type, p.material, p.brand, p.safety_certificates,
             COALESCE(SUM(oi.quantity),0)::int AS sold_quantity,
             COALESCE(pp.stars,0) AS stars
      FROM products p
      LEFT JOIN productparams pp ON pp.productid = p.productid
      LEFT JOIN orderitems oi ON oi.productid = p.productid
      WHERE ${where.join(" AND ")}
      GROUP BY p.productid, pp.stars
      ORDER BY sold_quantity DESC, COALESCE(pp.stars,0) DESC, p.stock DESC
      LIMIT 80
    `;

    const result = await client.query(sql, values);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT o.orderid, u.username, u.email, o.totalamount,
             COALESCE(o.order_status, o.orderstatus) AS status,
             o.createdat, o.updatedat, o.is_gift, o.gift_wrapping_type,
             COALESCE(SUM(oi.quantity),0)::int AS item_count
      FROM orders o
      LEFT JOIN users u ON u.userid = o.userid
      LEFT JOIN orderitems oi ON oi.orderid = o.orderid
      GROUP BY o.orderid, u.username, u.email
      ORDER BY o.createdat DESC
      LIMIT 100
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/orders/:orderID/confirm", async (req: Request, res: Response) => {
  try {
    const order = await client.query(
      "SELECT orderid, COALESCE(order_status, orderstatus) AS status FROM orders WHERE orderid = $1",
      [req.params.orderID],
    );

    if (!order.rows.length) return res.status(404).json({ error: "Order not found" });
    if (!["Pending", "pending"].includes(order.rows[0].status)) {
      return res.status(400).json({ error: "Only pending orders can be confirmed" });
    }

    await client.query(
      "UPDATE orders SET orderstatus = 'Confirmed', order_status = 'Confirmed', delivery_status = 'Confirmed', updatedat = NOW() WHERE orderid = $1",
      [req.params.orderID],
    );

    res.json({ message: "Order confirmed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/promotions", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT id, code, type, discount, expiration_date, is_active, event_name,
             applicable_age_group, season, min_child_age, max_child_age, created_at
      FROM promotions
      ORDER BY created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/promotions", async (req: Request, res: Response) => {
  const { code, type, discount, expirationDate, eventName, ageGroup, season, minChildAge, maxChildAge } = req.body;

  if (!code || discount === undefined) return res.status(400).json({ error: "Missing code or discount" });

  try {
    const result = await client.query(
      `INSERT INTO promotions
       (code, type, discount, expiration_date, is_active, event_name, applicable_age_group, season, min_child_age, max_child_age)
       VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,$9)
       RETURNING *`,
      [String(code).toUpperCase(), type || "percent", discount, expirationDate || null, eventName || null, ageGroup || null, season || null, minChildAge || null, maxChildAge || null],
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/promotions/:promotionID/toggle", async (req: Request, res: Response) => {
  try {
    const current = await client.query("SELECT is_active FROM promotions WHERE id = $1", [req.params.promotionID]);
    if (!current.rows.length) return res.status(404).json({ error: "Promotion not found" });
    const newStatus = !current.rows[0].is_active;
    await client.query("UPDATE promotions SET is_active = $1 WHERE id = $2", [newStatus, req.params.promotionID]);
    res.json({ message: "Promotion status updated", is_active: newStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/coupons", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT couponid, code, description, discountpercentage, maxdiscountamount,
             minpurchaseamount, validfrom, validuntil, createdat
      FROM coupons
      ORDER BY createdat DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/coupons", async (req: Request, res: Response) => {
  const { code, description, discountPercentage, maxDiscountAmount, minPurchaseAmount, validFrom, validUntil } = req.body;

  if (!code || discountPercentage === undefined) return res.status(400).json({ error: "Missing code or discountPercentage" });

  try {
    const result = await client.query(
      `INSERT INTO coupons (code, description, discountpercentage, maxdiscountamount, minpurchaseamount, validfrom, validuntil)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [String(code).toUpperCase(), description || null, discountPercentage, maxDiscountAmount || null, minPurchaseAmount || null, validFrom || new Date(), validUntil || null],
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/wishlist-suggestions", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT wi.wishlistitemid, wi.userid, u.username, u.email,
             p.productid, p.title, p.price, p.discount, p.stock, p.age_group, p.skill_type, p.brand,
             CASE WHEN p.stock > 0 THEN 'Còn hàng - có thể tư vấn mua ngay'
                  ELSE 'Hết hàng - nên tư vấn sản phẩm thay thế cùng độ tuổi/kỹ năng'
             END AS suggestion_note
      FROM wishlistitems wi
      JOIN users u ON u.userid = wi.userid
      JOIN products p ON p.productid = wi.productid
      ORDER BY wi.addedat DESC
      LIMIT 100
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Với shop đồ chơi, sinh nhật trẻ em quan trọng hơn DOB của tài khoản mua hàng.
router.get("/customer-birthdays", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT cp.child_id, cp.user_id AS userid, cp.child_name, cp.birth_date,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, cp.birth_date))::int AS child_age,
             cp.gender, u.username AS parent_name, u.email,
             TO_CHAR(cp.birth_date, 'MM-DD') AS birthday_mmdd
      FROM child_profiles cp
      JOIN users u ON u.userid = cp.user_id
      WHERE cp.birth_date IS NOT NULL
      ORDER BY
        CASE
          WHEN TO_CHAR(cp.birth_date, 'MM-DD') >= TO_CHAR(CURRENT_DATE, 'MM-DD') THEN 0
          ELSE 1
        END,
        TO_CHAR(cp.birth_date, 'MM-DD') ASC
      LIMIT 100
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
