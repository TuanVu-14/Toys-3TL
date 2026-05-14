import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

type Role = "admin" | "warehouse_manager";

function parseCookie(cookieHeader: string | undefined) {
  return (cookieHeader || "").split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=").map((item) => item.trim());
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function warehouseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionHeaderToken = req.headers.session?.toString().split(" ")[1];
    const cookieToken = parseCookie(req.headers.cookie?.toString())["sessionhold"];
    const token = sessionHeaderToken || cookieToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!["admin", "warehouse_manager"].includes(decoded.role)) {
      return res.status(403).json({ error: "Forbidden - Warehouse only" });
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

router.get("/warehouse/summary", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const [products, lowStock, pendingOrders, returns] = await Promise.all([
      client.query(`SELECT COUNT(*)::int AS count FROM products`),
      client.query(`SELECT COUNT(*)::int AS count FROM products WHERE stock <= COALESCE(low_stock_threshold, 10)`),
      client.query(`SELECT COUNT(*)::int AS count FROM orders WHERE COALESCE(order_status, orderstatus) IN ('Pending','Confirmed','Processing','Prepared','Packed')`),
      client.query(`SELECT COUNT(*)::int AS count FROM returns WHERE status IN ('pending','processing')`),
    ]);

    res.status(200).json({
      products: products.rows[0].count,
      lowStock: lowStock.rows[0].count,
      pendingOrders: pendingOrders.rows[0].count,
      returns: returns.rows[0].count,
    });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/warehouse/products", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT productid, title, stock, low_stock_threshold, price, brand
      FROM products
      ORDER BY title ASC
    `);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/warehouse/low-stock", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT productid, title, stock, low_stock_threshold, brand
      FROM products
      WHERE stock <= COALESCE(low_stock_threshold, 10)
      ORDER BY stock ASC, title ASC
    `);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/warehouse/top-products", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT p.productid, p.title, p.stock, COALESCE(SUM(oi.quantity), 0)::int AS sold_quantity
      FROM products p
      LEFT JOIN orderitems oi ON oi.productid = p.productid
      GROUP BY p.productid, p.title, p.stock
      ORDER BY sold_quantity DESC, p.stock ASC
      LIMIT 20
    `);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/warehouse/batches", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT b.batch_id, b.product_id, p.title, b.batch_number, b.quantity,
             b.manufacture_date, b.expiry_date, b.created_at
      FROM product_batches b
      LEFT JOIN products p ON p.productid = b.product_id
      ORDER BY b.created_at DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/warehouse/stock-in", warehouseAuth, async (req: Request, res: Response) => {
  const { productID, quantity, batchNumber, manufactureDate, expiryDate, supplierID, note } = req.body;
  const qty = Number(quantity);
  if (!productID || !qty || qty <= 0) return res.status(400).json({ error: "Invalid product or quantity" });

  try {
    await client.query("BEGIN");
    await client.query(`UPDATE products SET stock = stock + $1, updatedat = NOW() WHERE productid = $2`, [qty, productID]);

    if (batchNumber) {
      await client.query(
        `INSERT INTO product_batches (batch_id, product_id, batch_number, quantity, manufacture_date, expiry_date)
         VALUES (${nextId("product_batches", "batch_id")}, $1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [productID, batchNumber, qty, manufactureDate || null, expiryDate || null],
      );
      await client.query(`UPDATE product_batches SET quantity = quantity + $1 WHERE product_id = $2 AND batch_number = $3`, [qty, productID, batchNumber]);
    }

    const stockAfter = await client.query(`SELECT stock FROM products WHERE productid = $1`, [productID]);
    await client.query(
      `INSERT INTO inventory_logs (log_id, productid, change_type, quantity_change, stock_after, batch_code, supplier_id, note, created_by)
       VALUES (${nextId("inventory_logs", "log_id")}, $1, 'IN', $2, $3, $4, $5, $6, $7)`,
      [productID, qty, stockAfter.rows[0]?.stock, batchNumber || null, supplierID || null, note || null, (req as any).user?.userID || null],
    );
    await client.query(
      `INSERT INTO inventory_transactions (transaction_id, product_id, transaction_type, quantity, batch_number, notes, created_by)
       VALUES (${nextId("inventory_transactions", "transaction_id")}, $1, 'IN', $2, $3, $4, $5)`,
      [productID, qty, batchNumber || null, note || null, (req as any).user?.userID || null],
    );
    await client.query("COMMIT");
    res.status(200).json({ message: "Stock imported" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/warehouse/stock-out", warehouseAuth, async (req: Request, res: Response) => {
  const { productID, quantity, batchNumber, note } = req.body;
  const qty = Number(quantity);
  if (!productID || !qty || qty <= 0) return res.status(400).json({ error: "Invalid product or quantity" });

  try {
    await client.query("BEGIN");
    const stock = await client.query(`SELECT stock FROM products WHERE productid = $1 FOR UPDATE`, [productID]);
    if (!stock.rows[0] || Number(stock.rows[0].stock) < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough stock" });
    }

    await client.query(`UPDATE products SET stock = stock - $1, updatedat = NOW() WHERE productid = $2`, [qty, productID]);
    if (batchNumber) {
      await client.query(`UPDATE product_batches SET quantity = GREATEST(quantity - $1, 0) WHERE product_id = $2 AND batch_number = $3`, [qty, productID, batchNumber]);
    }

    const stockAfter = await client.query(`SELECT stock FROM products WHERE productid = $1`, [productID]);
    await client.query(
      `INSERT INTO inventory_logs (log_id, productid, change_type, quantity_change, stock_after, batch_code, note, created_by)
       VALUES (${nextId("inventory_logs", "log_id")}, $1, 'OUT', $2, $3, $4, $5, $6)`,
      [productID, -qty, stockAfter.rows[0]?.stock, batchNumber || null, note || null, (req as any).user?.userID || null],
    );
    await client.query(
      `INSERT INTO inventory_transactions (transaction_id, product_id, transaction_type, quantity, batch_number, notes, created_by)
       VALUES (${nextId("inventory_transactions", "transaction_id")}, $1, 'OUT', $2, $3, $4, $5)`,
      [productID, qty, batchNumber || null, note || null, (req as any).user?.userID || null],
    );
    await client.query("COMMIT");
    res.status(200).json({ message: "Stock exported" });
  } catch {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/warehouse/returns", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT r.*, p.title, u.username, u.email
      FROM returns r
      LEFT JOIN products p ON p.productid = r.productid
      LEFT JOIN users u ON u.userid = r.userid
      ORDER BY r.created_at DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/warehouse/returns/:returnID/status", warehouseAuth, async (req: Request, res: Response) => {
  const { returnID } = req.params;
  const { status } = req.body;
  try {
    await client.query(
      `UPDATE returns SET status = $1, handled_by = $2, updated_at = NOW() WHERE return_id = $3`,
      [status, (req as any).user?.userID || null, returnID],
    );
    res.status(200).json({ message: "Return updated" });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/warehouse/orders", warehouseAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT o.orderid, o.userid, o.totalamount, COALESCE(o.order_status, o.orderstatus) AS status,
             o.orderstatus, o.order_status, o.tracking_number, o.createdat, u.username, u.email,
             COUNT(oi.orderitemid)::int AS item_count
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

router.put("/warehouse/orders/:orderID/status", warehouseAuth, async (req: Request, res: Response) => {
  const { orderID } = req.params;
  const { status, trackingNumber } = req.body;
  const allowed = ["Prepared", "Packed", "Shipped", "Delivered"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    await client.query(
      `UPDATE orders
       SET orderstatus = $1,
           order_status = $1,
           delivery_status = $1,
           tracking_number = COALESCE($2, tracking_number),
           shipped_at = CASE WHEN $1 = 'Shipped' THEN NOW() ELSE shipped_at END,
           delivered_at = CASE WHEN $1 = 'Delivered' THEN NOW() ELSE delivered_at END,
           updatedat = NOW()
       WHERE orderid = $3`,
      [status, trackingNumber || null, orderID],
    );
    res.status(200).json({ message: "Order fulfillment updated" });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
