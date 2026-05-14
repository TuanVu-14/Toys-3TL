import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

type Role = "admin" | "sales_staff";

function parseCookie(cookieHeader: string | undefined) {
  return (cookieHeader || "").split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=").map((item) => item.trim());
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function salesAuth(req: Request, res: Response, next: any) {
  try {
    const sessionHeaderToken = req.headers.session?.toString().split(" ")[1];
    const cookieToken = parseCookie(req.headers.cookie?.toString()).sessionhold;
    const token = sessionHeaderToken || cookieToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!["admin", "sales_staff"].includes(decoded.role)) return res.status(403).json({ error: "Forbidden - Sales only" });
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.use(salesAuth);

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const [products, pendingOrders, promotions, wishlistItems] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS count FROM products"),
      client.query("SELECT COUNT(*)::int AS count FROM orders WHERE COALESCE(order_status, orderstatus) IN ('Pending','pending','Confirmed','confirmed')"),
      client.query("SELECT COUNT(*)::int AS count FROM promotions"),
      client.query("SELECT COUNT(*)::int AS count FROM wishlistitems"),
    ]);
    res.json({ products: products.rows[0].count, pendingOrders: pendingOrders.rows[0].count, promotions: promotions.rows[0].count, wishlistItems: wishlistItems.rows[0].count });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/products/consult", async (req: Request, res: Response) => {
  const { ageGroup, skillType, gender, keyword } = req.query;
  const values: any[] = [];
  const where: string[] = [];
  const add = (condition: string, value: any) => { values.push(value); where.push(condition.replace("?", `$${values.length}`)); };
  if (ageGroup) add("p.age_group ILIKE ?", `%${ageGroup}%`);
  if (skillType) add("p.skill_type ILIKE ?", `%${skillType}%`);
  if (gender) add("p.gender ILIKE ?", `%${gender}%`);
  if (keyword) add("(p.title ILIKE ? OR p.description ILIKE ? OR p.tags ILIKE ?)", `%${keyword}%`), values.push(`%${keyword}%`, `%${keyword}%`), where[where.length - 1] = `(p.title ILIKE $${values.length - 2} OR p.description ILIKE $${values.length - 1} OR p.tags ILIKE $${values.length})`;
  try {
    const sql = `SELECT p.productid, p.title, p.price, p.discount, p.stock, p.age_group, p.gender, p.skill_type, p.brand, COALESCE(SUM(oi.quantity),0)::int AS sold_quantity FROM products p LEFT JOIN orderitems oi ON oi.productid = p.productid ${where.length ? `WHERE ${where.join(" AND ")}` : ""} GROUP BY p.productid ORDER BY sold_quantity DESC, p.stock DESC LIMIT 80`;
    const result = await client.query(sql, values);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT o.orderid, u.username, u.email, o.totalamount, COALESCE(o.order_status, o.orderstatus) AS status, o.createdat, COALESCE(SUM(oi.quantity),0)::int AS item_count FROM orders o LEFT JOIN users u ON u.userid = o.userid LEFT JOIN orderitems oi ON oi.orderid = o.orderid GROUP BY o.orderid, u.username, u.email ORDER BY o.createdat DESC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.put("/orders/:orderID/confirm", async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE orders SET orderstatus = 'Confirmed', order_status = 'Confirmed', updatedat = NOW() WHERE orderid = $1", [req.params.orderID]);
    res.json({ message: "Order confirmed" });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/promotions", async (_req: Request, res: Response) => {
  try { const result = await client.query("SELECT id, code, type, discount, expiration_date, is_active, event_name, season FROM promotions ORDER BY created_at DESC"); res.json({ data: result.rows }); }
  catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.post("/promotions", async (req: Request, res: Response) => {
  const { code, type, discount, expirationDate, eventName, ageGroup, season, minChildAge, maxChildAge } = req.body;
  if (!code || !discount) return res.status(400).json({ error: "Missing code or discount" });
  try {
    const result = await client.query(`INSERT INTO promotions (code, type, discount, expiration_date, is_active, event_name, applicable_age_group, season, min_child_age, max_child_age) VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,$9) RETURNING *`, [String(code).toUpperCase(), type || "percent", discount, expirationDate || null, eventName || null, ageGroup || null, season || null, minChildAge || null, maxChildAge || null]);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/coupons", async (_req: Request, res: Response) => {
  try { const result = await client.query("SELECT couponid, code, description, discountpercentage, validuntil FROM coupons ORDER BY createdat DESC"); res.json({ data: result.rows }); }
  catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.post("/coupons", async (req: Request, res: Response) => {
  const { code, description, discountPercentage, maxDiscountAmount, minPurchaseAmount, validFrom, validUntil } = req.body;
  if (!code || !discountPercentage) return res.status(400).json({ error: "Missing code or discountPercentage" });
  try {
    const result = await client.query(`INSERT INTO coupons (code, description, discountpercentage, maxdiscountamount, minpurchaseamount, validfrom, validuntil) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [String(code).toUpperCase(), description || null, discountPercentage, maxDiscountAmount || null, minPurchaseAmount || null, validFrom || new Date(), validUntil || null]);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/wishlist-suggestions", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT wi.wishlistitemid, u.username, u.email, p.title, p.price, p.stock, p.age_group, p.skill_type FROM wishlistitems wi JOIN users u ON u.userid = wi.userid JOIN products p ON p.productid = wi.productid ORDER BY wi.addedat DESC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/customer-birthdays", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT userid, username, email, dob, CASE WHEN dob ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob::date))::int ELSE NULL END AS age FROM users WHERE role = 'customer' AND dob IS NOT NULL ORDER BY RIGHT(dob,5) ASC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

export default router;
