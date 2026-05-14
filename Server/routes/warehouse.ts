import express, { Request, Response } from "express";
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

function warehouseAuth(req: Request, res: Response, next: any) {
  try {
    const sessionHeaderToken = req.headers.session?.toString().split(" ")[1];
    const cookieToken = parseCookie(req.headers.cookie?.toString()).sessionhold;
    const token = sessionHeaderToken || cookieToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!["admin", "warehouse_manager"].includes(decoded.role)) return res.status(403).json({ error: "Forbidden - Warehouse only" });
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.use(warehouseAuth);

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const [products, lowStock, pendingOrders, returns] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS count FROM products"),
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE stock <= COALESCE(low_stock_threshold, 10)"),
      client.query("SELECT COUNT(*)::int AS count FROM orders WHERE COALESCE(order_status, orderstatus) IN ('Confirmed','Prepared','Packed','Shipped')"),
      client.query("SELECT COUNT(*)::int AS count FROM returns WHERE status NOT IN ('completed','rejected')"),
    ]);
    res.json({ products: products.rows[0].count, lowStock: lowStock.rows[0].count, pendingOrders: pendingOrders.rows[0].count, returns: returns.rows[0].count });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/products", async (_req: Request, res: Response) => {
  try { const result = await client.query("SELECT productid, title, stock, low_stock_threshold, brand FROM products ORDER BY title ASC"); res.json({ data: result.rows }); }
  catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/low-stock", async (_req: Request, res: Response) => {
  try { const result = await client.query("SELECT productid, title, stock, low_stock_threshold, brand FROM products WHERE stock <= COALESCE(low_stock_threshold, 10) ORDER BY stock ASC"); res.json({ data: result.rows }); }
  catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/top-products", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT p.productid, p.title, p.stock, COALESCE(SUM(oi.quantity),0)::int AS sold_quantity FROM products p LEFT JOIN orderitems oi ON oi.productid = p.productid GROUP BY p.productid ORDER BY sold_quantity DESC, p.stock DESC LIMIT 20`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/batches", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT b.batch_id, b.product_id, p.title, b.batch_number, b.quantity, b.manufacture_date, b.expiry_date FROM product_batches b LEFT JOIN products p ON p.productid = b.product_id ORDER BY b.created_at DESC`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.post("/stock-in", async (req: Request, res: Response) => {
  const { productID, quantity, batchNumber, manufactureDate, expiryDate, note } = req.body;
  if (!productID || !quantity || Number(quantity) <= 0) return res.status(400).json({ error: "Invalid productID or quantity" });
  const createdBy = (req as any).user?.userID || (req as any).user?.userid || null;
  try {
    await client.query("BEGIN");
    await client.query("UPDATE products SET stock = stock + $1, updatedat = NOW() WHERE productid = $2", [quantity, productID]);
    await client.query(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, batch_number, notes, created_by) VALUES ($1, 'IN', $2, $3, $4, $5)`, [productID, quantity, batchNumber || null, note || null, createdBy]);
    if (batchNumber) {
      await client.query(`INSERT INTO product_batches (product_id, batch_number, quantity, manufacture_date, expiry_date) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (product_id, batch_number) DO UPDATE SET quantity = product_batches.quantity + EXCLUDED.quantity`, [productID, batchNumber, quantity, manufactureDate || null, expiryDate || null]);
    }
    await client.query("COMMIT");
    res.status(201).json({ message: "Stock in success" });
  } catch (error) { await client.query("ROLLBACK"); console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.post("/stock-out", async (req: Request, res: Response) => {
  const { productID, quantity, batchNumber, note } = req.body;
  if (!productID || !quantity || Number(quantity) <= 0) return res.status(400).json({ error: "Invalid productID or quantity" });
  const createdBy = (req as any).user?.userID || (req as any).user?.userid || null;
  try {
    await client.query("BEGIN");
    const stock = await client.query("SELECT stock FROM products WHERE productid = $1 FOR UPDATE", [productID]);
    if (!stock.rows.length || Number(stock.rows[0].stock) < Number(quantity)) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Tồn kho không đủ" }); }
    await client.query("UPDATE products SET stock = stock - $1, updatedat = NOW() WHERE productid = $2", [quantity, productID]);
    await client.query(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, batch_number, notes, created_by) VALUES ($1, 'OUT', $2, $3, $4, $5)`, [productID, quantity, batchNumber || null, note || null, createdBy]);
    if (batchNumber) await client.query("UPDATE product_batches SET quantity = GREATEST(quantity - $1, 0) WHERE product_id = $2 AND batch_number = $3", [quantity, productID, batchNumber]);
    await client.query("COMMIT");
    res.status(201).json({ message: "Stock out success" });
  } catch (error) { await client.query("ROLLBACK"); console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/returns", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT r.return_id, r.orderid, r.productid, p.title, u.username, r.quantity, r.reason, r.status FROM returns r LEFT JOIN products p ON p.productid = r.productid LEFT JOIN users u ON u.userid = r.userid ORDER BY r.created_at DESC`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.put("/returns/:returnID/status", async (req: Request, res: Response) => {
  const { status } = req.body;
  try { await client.query("UPDATE returns SET status = $1, updated_at = NOW(), handled_by = $2 WHERE return_id = $3", [status, (req as any).user?.userID || null, req.params.returnID]); res.json({ message: "Return status updated" }); }
  catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`SELECT o.orderid, u.username, u.email, o.totalamount, COALESCE(o.order_status, o.orderstatus) AS status, o.tracking_number, o.createdat, COALESCE(SUM(oi.quantity),0)::int AS item_count FROM orders o LEFT JOIN users u ON u.userid = o.userid LEFT JOIN orderitems oi ON oi.orderid = o.orderid GROUP BY o.orderid, u.username, u.email ORDER BY o.createdat DESC LIMIT 100`);
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

router.put("/orders/:orderID/status", async (req: Request, res: Response) => {
  const { status, trackingNumber } = req.body;
  const allowed = ["Prepared", "Packed", "Shipped", "Delivered"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid fulfillment status" });
  try {
    await client.query(`UPDATE orders SET orderstatus = $1, order_status = $1, delivery_status = $1, tracking_number = COALESCE($2, tracking_number), shipped_at = CASE WHEN $1 = 'Shipped' THEN NOW() ELSE shipped_at END, delivered_at = CASE WHEN $1 = 'Delivered' THEN NOW() ELSE delivered_at END, updatedat = NOW() WHERE orderid = $3`, [status, trackingNumber || null, req.params.orderID]);
    res.json({ message: "Order status updated" });
  } catch (error) { console.error(error); res.status(500).json({ error: "Server Error" }); }
});

export default router;
