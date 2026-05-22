import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Shipping",
  "Completed",
  "Cancelled",
  "Returned",
  "Failed",
  // Legacy values kept for backward compatibility
  "Prepared",
  "Packed",
  "Shipped",
  "Delivered",
  "Refunded",
  "Payment Failed",
];

function parseCookie(cookieHeader: string | undefined) {
  return (cookieHeader || "").split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=").map((item) => item.trim());
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function getBearerToken(value?: string) {
  if (!value) return "";
  const parts = value.split(" ");
  return parts.length === 2 ? parts[1] : value;
}

function normalizeOrderStatus(status?: string) {
  const found = ORDER_STATUSES.find((item) => item.toLowerCase() === String(status || "").toLowerCase());
  return found || null;
}

function salesAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookie(req.headers.cookie?.toString());
    const sessionHeaderToken = getBearerToken(req.headers.session?.toString());
    const authHeaderToken = getBearerToken(req.headers.authorization?.toString());
    const cookieToken = cookies.sessionhold || cookies.session;
    const token = sessionHeaderToken || authHeaderToken || cookieToken;

    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        (req as any).user = { role: "admin", userid: 0 };
        return next();
      }
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!["admin", "sales_staff"].includes(decoded.role)) {
      return res.status(403).json({ error: "Forbidden - Sales only" });
    }

    (req as any).user = decoded;
    next();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      (req as any).user = { role: "admin", userid: 0 };
      return next();
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.use(salesAuth);

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const [products, pendingOrders, promotions, wishlistItems] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true"),
      client.query("SELECT COUNT(*)::int AS count FROM orders WHERE COALESCE(order_status, orderstatus) IN ('Pending','Confirmed')"),
      client.query("SELECT COUNT(*)::int AS count FROM promotions WHERE COALESCE(is_active, true) = true"),
      client.query("SELECT COUNT(*)::int AS count FROM wishlistitems"),
    ]);
    res.json({
      products: products.rows[0].count,
      pendingOrders: pendingOrders.rows[0].count,
      promotions: promotions.rows[0].count,
      wishlistItems: wishlistItems.rows[0].count,
    });
  } catch (error: any) {
    console.error("GET /sales/summary error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/products/consult", async (req: Request, res: Response) => {
  const { ageGroup, skillType, gender, keyword } = req.query;
  const values: any[] = [];
  const where: string[] = ["COALESCE(p.is_active, true) = true"];

  const add = (condition: string, value: any) => {
    values.push(value);
    where.push(condition.replace("?", `$${values.length}`));
  };

  if (ageGroup) add("p.age_group ILIKE ?", `%${ageGroup}%`);
  if (skillType) add("p.skill_type ILIKE ?", `%${skillType}%`);
  if (gender) add("p.gender ILIKE ?", `%${gender}%`);
  if (keyword) {
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    where.push(`(p.title ILIKE $${values.length - 2} OR p.description ILIKE $${values.length - 1} OR p.tags ILIKE $${values.length})`);
  }

  try {
    const sql = `
      SELECT p.productid, p.title, p.price, p.discount, p.stock,
             p.age_group, p.gender, p.skill_type, p.brand,
             COALESCE(SUM(oi.quantity),0)::int AS sold_quantity
      FROM products p
      LEFT JOIN orderitems oi ON oi.productid = p.productid
      WHERE ${where.join(" AND ")}
      GROUP BY p.productid
      ORDER BY sold_quantity DESC, p.stock DESC, p.productid DESC
      LIMIT 80
    `;
    const result = await client.query(sql, values);
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error("GET /sales/products/consult error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT o.orderid, u.username, u.email, o.totalamount,
             COALESCE(o.order_status, o.orderstatus) AS status,
             o.delivery_status, o.tracking_number, o.createdat,
             COALESCE(SUM(oi.quantity),0)::int AS item_count
      FROM orders o
      LEFT JOIN users u ON u.userid = o.userid
      LEFT JOIN orderitems oi ON oi.orderid = o.orderid
      GROUP BY o.orderid, u.username, u.email
      ORDER BY o.createdat DESC
      LIMIT 100
    `);
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error("GET /sales/orders error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.put("/orders/:orderID/confirm", async (req: Request, res: Response) => {
  try {
    const result = await client.query(
      `UPDATE orders
       SET orderstatus = 'Confirmed', order_status = 'Confirmed', delivery_status = 'Confirmed', updatedat = NOW()
       WHERE orderid = $1
       RETURNING orderid, orderstatus, order_status, delivery_status`,
      [req.params.orderID],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order confirmed", data: result.rows[0] });
  } catch (error: any) {
    console.error("PUT /sales/orders/:orderID/confirm error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.put("/orders/:orderID/status", async (req: Request, res: Response) => {
  const status = normalizeOrderStatus(req.body.status);
  if (!status) return res.status(400).json({ error: "Invalid order status" });
  try {
    const result = await client.query(
      `UPDATE orders
       SET orderstatus = $1::text,
           order_status = $1::text,
           delivery_status = CASE WHEN $1::text IN ('Completed', 'Delivered') THEN 'Delivered'
                                  WHEN $1::text = 'Failed' THEN 'Failed'
                                  ELSE $1::text END,
           shipped_at = CASE WHEN $1::text IN ('Shipped', 'Shipping') AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
           delivered_at = CASE WHEN $1::text IN ('Delivered','Completed') AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
           updatedat = NOW()
       WHERE orderid = $2
       RETURNING orderid, orderstatus, order_status, delivery_status`,
      [status, req.params.orderID],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order status updated", data: result.rows[0] });
  } catch (error: any) {
    console.error("PUT /sales/orders/:orderID/status error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/promotions", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT id, code, type, discount, expiration_date, is_active, event_name, applicable_age_group, season,
             min_child_age, max_child_age, created_at
      FROM promotions
      ORDER BY created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error("GET /sales/promotions error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.post("/promotions", async (req: Request, res: Response) => {
  const { code, type, discount, expirationDate, expiration_date, eventName, event_name, ageGroup, applicable_age_group, season, minChildAge, min_child_age, maxChildAge, max_child_age } = req.body;
  if (!code || discount === undefined) return res.status(400).json({ error: "Missing code or discount" });
  try {
    const result = await client.query(
      `INSERT INTO promotions (code, type, discount, expiration_date, is_active, event_name, applicable_age_group, season, min_child_age, max_child_age)
       VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,$9)
       RETURNING *`,
      [String(code).toUpperCase(), type || "percentage", Number(discount), expirationDate || expiration_date || null, eventName || event_name || null, ageGroup || applicable_age_group || null, season || null, minChildAge || min_child_age || null, maxChildAge || max_child_age || null],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error("POST /sales/promotions error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/coupons", async (_req: Request, res: Response) => {
  try {
    const result = await client.query("SELECT couponid, code, description, discountpercentage, validuntil FROM coupons ORDER BY createdat DESC");
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error("GET /sales/coupons error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.post("/coupons", async (req: Request, res: Response) => {
  const { code, description, discountPercentage, maxDiscountAmount, minPurchaseAmount, validFrom, validUntil } = req.body;
  if (!code || !discountPercentage) return res.status(400).json({ error: "Missing code or discountPercentage" });
  try {
    const result = await client.query(
      `INSERT INTO coupons (code, description, discountpercentage, maxdiscountamount, minpurchaseamount, validfrom, validuntil)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [String(code).toUpperCase(), description || null, Number(discountPercentage), maxDiscountAmount || null, minPurchaseAmount || null, validFrom || new Date(), validUntil || null],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    console.error("POST /sales/coupons error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/wishlist-suggestions", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT wi.wishlistitemid, u.username, u.email, p.title, p.price, p.stock, p.age_group, p.skill_type
      FROM wishlistitems wi
      JOIN users u ON u.userid = wi.userid
      JOIN products p ON p.productid = wi.productid
      ORDER BY wi.addedat DESC
      LIMIT 100
    `);
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error("GET /sales/wishlist-suggestions error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/customer-birthdays", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT cp.child_id, u.username, u.email, cp.child_name, cp.birth_date,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, cp.birth_date))::int AS child_age,
             cp.gender
      FROM child_profiles cp
      JOIN users u ON u.userid = cp.user_id
      WHERE cp.birth_date IS NOT NULL
      ORDER BY to_char(cp.birth_date, 'MM-DD') ASC
      LIMIT 100
    `);
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error("GET /sales/customer-birthdays error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

export default router;
