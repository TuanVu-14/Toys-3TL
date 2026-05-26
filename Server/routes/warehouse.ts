import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

const FULFILLMENT_STATUSES = ["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

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
    const cookieToken = parseCookie(req.headers.cookie?.toString()).sessionhold;
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

function currentUserID(req: Request) {
  return (req as any).user?.userID || (req as any).user?.userid || null;
}

router.use(warehouseAuth);

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const [products, lowStock, pendingOrders, returns, batches] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true"),
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true AND stock <= COALESCE(low_stock_threshold, 10)"),
      client.query("SELECT COUNT(*)::int AS count FROM orders WHERE orderstatus IN ('Confirmed','Prepared','Packed','Shipped')"),
      client.query("SELECT COUNT(*)::int AS count FROM returns WHERE status NOT IN ('completed','rejected')"),
      client.query("SELECT COUNT(*)::int AS count FROM product_batches"),
    ]);

    res.json({
      products: products.rows[0].count,
      lowStock: lowStock.rows[0].count,
      pendingOrders: pendingOrders.rows[0].count,
      returns: returns.rows[0].count,
      batches: batches.rows[0].count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/products", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT productid, title, stock, low_stock_threshold, brand, supplier_id,
             COALESCE(is_active, true) AS is_active
      FROM products
      WHERE COALESCE(is_active, true) = true
      ORDER BY title ASC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/low-stock", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT productid, title, stock, low_stock_threshold, brand, supplier_id
      FROM products
      WHERE COALESCE(is_active, true) = true AND stock <= COALESCE(low_stock_threshold, 10)
      ORDER BY stock ASC, title ASC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/top-products", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT p.productid, p.title, p.stock, p.low_stock_threshold,
             COALESCE(SUM(oi.quantity),0)::int AS sold_quantity
      FROM products p
      LEFT JOIN orderitems oi ON oi.productid = p.productid
      WHERE COALESCE(p.is_active, true) = true
      GROUP BY p.productid
      ORDER BY sold_quantity DESC, p.stock DESC
      LIMIT 20
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/batches", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT b.batch_id, b.product_id, p.title, b.batch_number, b.quantity,
             b.manufacture_date, b.expiry_date, b.created_at
      FROM product_batches b
      LEFT JOIN products p ON p.productid = b.product_id
      ORDER BY b.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Quan trọng: không UPDATE products.stock trực tiếp ở đây.
// lego7.sql đã có trigger trg_inventory_transactions_apply tự cộng/trừ tồn kho sau khi insert inventory_transactions.
router.post("/stock-in", async (req: Request, res: Response) => {
  const { productID, quantity, batchNumber, manufactureDate, expiryDate, note } = req.body;
  const qty = Number(quantity);

  if (!productID || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Invalid productID or quantity" });
  }

  try {
    await client.query("BEGIN");

    const product = await client.query("SELECT productid FROM products WHERE productid = $1 AND COALESCE(is_active, true) = true FOR UPDATE", [productID]);
    if (!product.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found or disabled" });
    }

    await client.query(
      `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, batch_number, notes, created_by)
       VALUES ($1, 'IN', $2, $3, $4, $5)`,
      [productID, qty, batchNumber || null, note || null, currentUserID(req)],
    );

    if (batchNumber) {
      await client.query(
        `INSERT INTO product_batches (product_id, batch_number, quantity, manufacture_date, expiry_date)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (product_id, batch_number)
         DO UPDATE SET quantity = product_batches.quantity + EXCLUDED.quantity,
                       manufacture_date = COALESCE(EXCLUDED.manufacture_date, product_batches.manufacture_date),
                       expiry_date = COALESCE(EXCLUDED.expiry_date, product_batches.expiry_date)`,
        [productID, batchNumber, qty, manufactureDate || null, expiryDate || null],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Stock in success" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/stock-out", async (req: Request, res: Response) => {
  const { productID, quantity, batchNumber, note } = req.body;
  const qty = Number(quantity);

  if (!productID || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Invalid productID or quantity" });
  }

  try {
    await client.query("BEGIN");

    const stock = await client.query(
      "SELECT productid, stock FROM products WHERE productid = $1 AND COALESCE(is_active, true) = true FOR UPDATE",
      [productID],
    );

    if (!stock.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found or disabled" });
    }

    if (Number(stock.rows[0].stock) < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Tồn kho tổng không đủ" });
    }

    if (batchNumber) {
      const batch = await client.query(
        "SELECT quantity FROM product_batches WHERE product_id = $1 AND batch_number = $2 FOR UPDATE",
        [productID, batchNumber],
      );

      if (!batch.rows.length || Number(batch.rows[0].quantity) < qty) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Tồn kho của lô hàng không đủ" });
      }

      await client.query(
        "UPDATE product_batches SET quantity = quantity - $1 WHERE product_id = $2 AND batch_number = $3",
        [qty, productID, batchNumber],
      );
    }

    await client.query(
      `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, batch_number, notes, created_by)
       VALUES ($1, 'OUT', $2, $3, $4, $5)`,
      [productID, qty, batchNumber || null, note || null, currentUserID(req)],
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Stock out success" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/transactions", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT it.transaction_id, it.product_id, p.title, it.transaction_type, it.quantity,
             it.batch_number, it.notes, it.created_by, u.username AS created_by_name, it.created_at
      FROM inventory_transactions it
      LEFT JOIN products p ON p.productid = it.product_id
      LEFT JOIN users u ON u.userid = it.created_by
      ORDER BY it.created_at DESC
      LIMIT 200
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/returns", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT r.return_id, r.orderid, r.productid, p.title, u.username, r.quantity,
             r.reason, r.description, r.status, r.refund_amount, r.created_at, r.updated_at
      FROM returns r
      LEFT JOIN products p ON p.productid = r.productid
      LEFT JOIN users u ON u.userid = r.userid
      ORDER BY r.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/returns/:returnID/status", async (req: Request, res: Response) => {
  const { status, restock, note } = req.body;
  const allowed = ["processing", "pending", "approved", "received", "completed", "rejected"];

  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid return status" });

  try {
    await client.query("BEGIN");

    const current = await client.query("SELECT productid, quantity, status FROM returns WHERE return_id = $1 FOR UPDATE", [req.params.returnID]);
    if (!current.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Return not found" });
    }

    await client.query(
      "UPDATE returns SET status = $1, updated_at = NOW(), handled_by = $2 WHERE return_id = $3",
      [status, currentUserID(req), req.params.returnID],
    );

    if (restock && ["received", "completed"].includes(status) && !["received", "completed"].includes(current.rows[0].status)) {
      await client.query(
        `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, notes, created_by)
         VALUES ($1, 'IN', $2, $3, $4)`,
        [current.rows[0].productid, current.rows[0].quantity, note || `Restock from return #${req.params.returnID}`, currentUserID(req)],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Return status updated" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(`
      SELECT o.orderid, u.username, u.email, o.totalamount,
             o.orderstatus AS status,
             o.tracking_number, o.createdat,
             COALESCE(SUM(oi.quantity),0)::int AS item_count
      FROM orders o
      LEFT JOIN users u ON u.userid = o.userid
      LEFT JOIN orderitems oi ON oi.orderid = o.orderid
      WHERE o.orderstatus IN ('Confirmed','Preparing','Shipping','Prepared','Packed','Shipped','Delivered','Failed')
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

router.put("/orders/:orderID/status", async (req: Request, res: Response) => {
  const { status, trackingNumber } = req.body;

  if (!FULFILLMENT_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid fulfillment status" });
  }

  try {
    await client.query(
      `UPDATE orders
       SET orderstatus = $1::varchar,
           tracking_number = COALESCE($2, tracking_number),
           shipped_at = CASE WHEN $1::varchar IN ('Shipped', 'Shipping') THEN NOW() ELSE shipped_at END,
           delivered_at = CASE WHEN $1::varchar IN ('Delivered', 'Completed') THEN NOW() ELSE delivered_at END,
           updatedat = NOW()
       WHERE orderid = $3`,
      [status, trackingNumber || null, req.params.orderID],
    );

    res.json({ message: "Order status updated", status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
