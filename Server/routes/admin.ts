import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

const VALID_ROLES = ["customer", "sales_staff", "warehouse_manager", "admin"] as const;
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Prepared",
  "Packed",
  "Shipped",
  "Delivered",
  "Completed",
  "Cancelled",
  "Returned",
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

function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionHeaderToken = req.headers.session?.toString().split(" ")[1];
    const cookieToken = parseCookie(req.headers.cookie?.toString()).sessionhold;
    const token = sessionHeaderToken || cookieToken;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ error: "Forbidden - Admin only" });

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function normalizeRole(role: unknown): string {
  if (typeof role === "string" && VALID_ROLES.includes(role as any)) {
    return role;
  }

  return "customer";
}

function normalizeOrderStatus(status?: string) {
  const found = ORDER_STATUSES.find((item) => item.toLowerCase() === String(status || "").toLowerCase());
  return found || null;
}

async function userExists(email: string, mobileNumber: string, exceptUserID?: string | number) {
  const params: any[] = [email, mobileNumber];
  const exceptSql = exceptUserID ? " AND userid <> $3" : "";
  if (exceptUserID) params.push(exceptUserID);

  const response = await client.query(
    `SELECT userid FROM users WHERE (email = $1 OR mobile_number = $2)${exceptSql}`,
    params,
  );

  return response.rows.length > 0;
}

async function insertUser(user: {
  username: string;
  email: string;
  password: string;
  mobile_number: string;
  dob: string;
  role: string;
  creationIP: string;
}) {
  const response = await client.query(
    `INSERT INTO users (username, email, password, mobile_number, dob, creation_ip, update_ip, role, promotional)
     VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, false)
     RETURNING userid, username, email, mobile_number, dob, role, createdat`,
    [
      user.username,
      user.email,
      user.password,
      user.mobile_number,
      user.dob,
      user.creationIP,
      user.creationIP === "unknown" ? "127.0.0.1" : user.creationIP,
      normalizeRole(user.role),
    ],
  );

  return response.rows[0];
}

router.post("/admin/bootstrap", async (req: Request, res: Response) => {
  const { userName, username, email, password, mobile_number, dob } = req.body;
  const finalUsername = username || userName;

  try {
    const adminCount = await client.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'");
    if (adminCount.rows[0].count > 0) return res.status(403).json({ error: "Admin bootstrap already completed" });

    if (!finalUsername || !email || !password || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (await userExists(email, mobile_number)) {
      return res.status(409).json({ error: "Email or mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const data = await insertUser({
      username: finalUsername,
      email,
      password: hashedPassword,
      mobile_number,
      dob,
      role: "admin",
      creationIP: req.ip || "127.0.0.1",
    });

    res.status(201).json({ message: "Admin account created", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/create", adminAuth, async (req: Request, res: Response) => {
  const { userName, username, email, password, mobile_number, dob } = req.body;
  const finalUsername = username || userName;

  try {
    if (!finalUsername || !email || !password || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (await userExists(email, mobile_number)) {
      return res.status(409).json({ error: "Email or mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const data = await insertUser({
      username: finalUsername,
      email,
      password: hashedPassword,
      mobile_number,
      dob,
      role: "admin",
      creationIP: req.ip || "127.0.0.1",
    });

    res.status(201).json({ message: "Admin account created", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/stats", adminAuth, async (_req: Request, res: Response) => {
  try {
    const [products, orders, users, revenue, lowStock] = await Promise.all([
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true"),
      client.query("SELECT COUNT(*)::int AS count FROM orders"),
      client.query("SELECT COUNT(*)::int AS count FROM users WHERE COALESCE(is_active, true) = true"),
      client.query("SELECT COALESCE(SUM(totalamount), 0)::numeric AS total FROM orders WHERE COALESCE(order_status, orderstatus) NOT IN ('Cancelled','Returned','Refunded','Payment Failed')"),
      client.query("SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true AND stock <= COALESCE(low_stock_threshold, 10)"),
    ]);

    const recentOrders = await client.query(`
      SELECT o.orderid, o.totalamount, COALESCE(o.order_status, o.orderstatus) AS orderstatus,
             o.createdat, u.username, u.email
      FROM orders o
      LEFT JOIN users u ON o.userid = u.userid
      ORDER BY o.createdat DESC
      LIMIT 5
    `);

    res.status(200).json({
      products: products.rows[0].count,
      orders: orders.rows[0].count,
      users: users.rows[0].count,
      revenue: Number(revenue.rows[0].total),
      lowStock: lowStock.rows[0].count,
      recentOrders: recentOrders.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/users", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT userid, username, email, mobile_number, dob, role, COALESCE(is_active, true) AS is_active, createdat
      FROM users
      ORDER BY userid DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/users", adminAuth, async (req: Request, res: Response) => {
  const { username, userName, email, mobile_number, dob, password, role } = req.body;
  const finalUsername = username || userName;

  try {
    if (!finalUsername || !email || !password || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (await userExists(email, mobile_number)) {
      return res.status(409).json({ error: "Email or mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const data = await insertUser({
      username: finalUsername,
      email,
      password: hashedPassword,
      mobile_number,
      dob,
      role: normalizeRole(role),
      creationIP: req.ip || "127.0.0.1",
    });

    res.status(201).json({ message: "User created successfully", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/users/:userID", adminAuth, async (req: Request, res: Response) => {
  const { userID } = req.params;
  const { username, userName, email, mobile_number, dob, role, is_active } = req.body;
  const finalUsername = username || userName;

  try {
    if (!finalUsername || !email || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (await userExists(email, mobile_number, userID)) {
      return res.status(409).json({ error: "Email or mobile number already exists" });
    }

    await client.query(
      `UPDATE users
       SET username = $1, email = $2, mobile_number = $3, dob = $4, role = $5,
           is_active = COALESCE($6, is_active), update_ip = $7::inet, updatedat = NOW()
       WHERE userid = $8`,
      [finalUsername, email, mobile_number, dob, normalizeRole(role), is_active, req.ip || "127.0.0.1", userID],
    );

    res.status(200).json({ message: "User updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/users/:userID/role", adminAuth, async (req: Request, res: Response) => {
  const { userID } = req.params;
  const { role } = req.body;

  try {
    const nextRole = normalizeRole(role);
    await client.query("UPDATE users SET role = $1, updatedat = NOW() WHERE userid = $2", [nextRole, userID]);
    res.status(200).json({ message: "Role updated", role: nextRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Soft delete: thực tế không nên xóa user đã có đơn hàng vì sẽ lỗi khóa ngoại và mất lịch sử bán hàng.
router.delete("/admin/users/:userID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE users SET is_active = false, updatedat = NOW() WHERE userid = $1", [req.params.userID]);
    res.status(200).json({ message: "User disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/products", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT p.productid, p.title, p.description, p.categoryid, c.name AS category,
             p.price, p.discount, p.stock, p.tags, p.imgid,
             p.age_group, p.gender, p.material, p.skill_type, p.brand,
             p.safety_certificates, p.low_stock_threshold, p.supplier_id,
             COALESCE(p.is_active, true) AS is_active,
             pp.stars, pp.isnew, pp.issale, pp.isdiscount, pp.views, pp.sold, pp.rating
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.categoryid
      LEFT JOIN productparams pp ON p.productid = pp.productid
      ORDER BY p.productid DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/products", adminAuth, async (req: Request, res: Response) => {
  const {
    title,
    description,
    categoryid,
    price,
    discount,
    stock,
    tags,
    imgid,
    age_group,
    gender,
    material,
    skill_type,
    brand,
    safety_certificates,
    low_stock_threshold,
    supplier_id,
    isnew,
    issale,
    isdiscount,
    stars,
  } = req.body;

  try {
    if (!title || !categoryid || price === undefined || Number(price) < 0) {
      return res.status(400).json({ error: "Missing or invalid title/category/price" });
    }

    await client.query("BEGIN");

    const product = await client.query(
      `INSERT INTO products
       (title, description, categoryid, price, discount, stock, tags, imgid, age_group, gender, material,
        skill_type, brand, safety_certificates, low_stock_threshold, supplier_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)
       RETURNING *`,
      [
        title,
        description || null,
        categoryid,
        Number(price),
        Number(discount || 0),
        Number(stock || 0),
        tags || null,
        imgid || null,
        age_group || null,
        gender || null,
        material || null,
        skill_type || null,
        brand || null,
        safety_certificates || null,
        low_stock_threshold || 10,
        supplier_id || null,
      ],
    );

    await client.query(
      `INSERT INTO productparams (productid, isnew, issale, isdiscount, stars)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (productid) DO UPDATE SET isnew = EXCLUDED.isnew, issale = EXCLUDED.issale,
       isdiscount = EXCLUDED.isdiscount, stars = EXCLUDED.stars`,
      [product.rows[0].productid, !!isnew, !!issale, !!isdiscount, Number(stars || 0)],
    );

    await client.query("COMMIT");
    res.status(201).json({ data: product.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/products/:productID", adminAuth, async (req: Request, res: Response) => {
  const { productID } = req.params;
  const {
    title,
    description,
    categoryid,
    price,
    discount,
    stock,
    tags,
    imgid,
    age_group,
    gender,
    material,
    skill_type,
    brand,
    safety_certificates,
    low_stock_threshold,
    supplier_id,
    is_active,
  } = req.body;

  try {
    if (!title || !categoryid || price === undefined || Number(price) < 0) {
      return res.status(400).json({ error: "Missing or invalid title/category/price" });
    }

    await client.query(
      `UPDATE products
       SET title = $1, description = $2, categoryid = $3, price = $4, discount = $5,
           stock = $6, tags = $7, imgid = $8, age_group = $9, gender = $10,
           material = $11, skill_type = $12, brand = $13, safety_certificates = $14,
           low_stock_threshold = $15, supplier_id = $16, is_active = COALESCE($17, is_active), updatedat = NOW()
       WHERE productid = $18`,
      [
        title,
        description || null,
        categoryid,
        Number(price),
        Number(discount || 0),
        Number(stock || 0),
        tags || null,
        imgid || null,
        age_group || null,
        gender || null,
        material || null,
        skill_type || null,
        brand || null,
        safety_certificates || null,
        low_stock_threshold || 10,
        supplier_id || null,
        is_active,
        productID,
      ],
    );

    res.status(200).json({ message: "Product updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/products/:productID/params", adminAuth, async (req: Request, res: Response) => {
  const { productID } = req.params;
  const { isnew, issale, isdiscount, stars } = req.body;

  try {
    await client.query(
      `INSERT INTO productparams (productid, isnew, issale, isdiscount, stars)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (productid) DO UPDATE SET
         isnew = EXCLUDED.isnew,
         issale = EXCLUDED.issale,
         isdiscount = EXCLUDED.isdiscount,
         stars = EXCLUDED.stars`,
      [productID, !!isnew, !!issale, !!isdiscount, Number(stars || 0)],
    );

    res.status(200).json({ message: "Product params updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Soft delete: không xóa cứng sản phẩm đã từng bán vì orderitems đang tham chiếu productid.
router.delete("/admin/products/:productID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE products SET is_active = false, updatedat = NOW() WHERE productid = $1", [req.params.productID]);
    res.status(200).json({ message: "Product disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/orders", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT o.orderid, o.totalamount, COALESCE(o.order_status, o.orderstatus) AS orderstatus,
             o.order_status, o.orderstatus AS legacy_orderstatus, o.delivery_status,
             o.tracking_number, o.createdat, o.updatedat, u.username, u.email, u.userid,
             COALESCE(SUM(oi.quantity),0)::int AS item_count
      FROM orders o
      LEFT JOIN users u ON o.userid = u.userid
      LEFT JOIN orderitems oi ON oi.orderid = o.orderid
      GROUP BY o.orderid, u.username, u.email, u.userid
      ORDER BY o.createdat DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/orders/:orderID/status", adminAuth, async (req: Request, res: Response) => {
  const status = normalizeOrderStatus(req.body.status);

  if (!status) return res.status(400).json({ error: "Invalid order status" });

  try {
    await client.query(
      `UPDATE orders
       SET orderstatus = $1, order_status = $1,
           delivery_status = CASE WHEN $1 IN ('Prepared','Packed','Shipped','Delivered') THEN $1 ELSE delivery_status END,
           shipped_at = CASE WHEN $1 = 'Shipped' THEN NOW() ELSE shipped_at END,
           delivered_at = CASE WHEN $1 = 'Delivered' THEN NOW() ELSE delivered_at END,
           updatedat = NOW()
       WHERE orderid = $2`,
      [status, req.params.orderID],
    );

    res.status(200).json({ message: "Order status updated", status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/categories", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT c.categoryid, c.name, c.slug, c.maincategory,
             COUNT(p.productid)::int AS products
      FROM categories c
      LEFT JOIN products p ON c.categoryid = p.categoryid AND COALESCE(p.is_active, true) = true
      GROUP BY c.categoryid, c.name, c.slug, c.maincategory
      ORDER BY c.categoryid
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/categories", adminAuth, async (req: Request, res: Response) => {
  const { name, slug, maincategory } = req.body;
  try {
    if (!name || !name.trim()) return res.status(400).json({ error: "Category name is required" });
    const response = await client.query(
      `INSERT INTO categories (name, slug, maincategory)
       VALUES ($1, $2, $3)
       RETURNING categoryid, name, slug, maincategory`,
      [name.trim(), slug || name.toLowerCase().trim().replace(/\s+/g, "-"), maincategory || null],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/categories/:categoryID", adminAuth, async (req: Request, res: Response) => {
  const { categoryID } = req.params;
  const { name, slug, maincategory } = req.body;
  try {
    if (!name || !name.trim()) return res.status(400).json({ error: "Category name is required" });
    await client.query(
      "UPDATE categories SET name = $1, slug = $2, maincategory = $3 WHERE categoryid = $4",
      [name.trim(), slug || name.toLowerCase().trim().replace(/\s+/g, "-"), maincategory || null, categoryID],
    );
    res.status(200).json({ message: "Category updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete("/admin/categories/:categoryID", adminAuth, async (req: Request, res: Response) => {
  try {
    const used = await client.query("SELECT COUNT(*)::int AS count FROM products WHERE categoryid = $1", [req.params.categoryID]);
    if (used.rows[0].count > 0) return res.status(400).json({ error: "Category is used by products" });
    await client.query("DELETE FROM categories WHERE categoryid = $1", [req.params.categoryID]);
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/promotions", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT id, code, type, discount, expiration_date, is_active, event_name,
             applicable_age_group, season, min_child_age, max_child_age, created_at
      FROM promotions
      ORDER BY created_at DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/promotions", adminAuth, async (req: Request, res: Response) => {
  const { code, type, discount, expiration_date, event_name, applicable_age_group, season, min_child_age, max_child_age } = req.body;
  try {
    if (!code || !type || discount === undefined) return res.status(400).json({ error: "Missing required fields" });
    const response = await client.query(
      `INSERT INTO promotions (code, type, discount, expiration_date, is_active, event_name, applicable_age_group, season, min_child_age, max_child_age)
       VALUES ($1,$2,$3,$4,true,$5,$6,$7,$8,$9)
       RETURNING *`,
      [String(code).toUpperCase(), type, discount, expiration_date || null, event_name || null, applicable_age_group || null, season || null, min_child_age || null, max_child_age || null],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/promotions/:promotionID/toggle", adminAuth, async (req: Request, res: Response) => {
  try {
    const current = await client.query("SELECT is_active FROM promotions WHERE id = $1", [req.params.promotionID]);
    if (current.rows.length === 0) return res.status(404).json({ error: "Promotion not found" });
    const newStatus = !current.rows[0].is_active;
    await client.query("UPDATE promotions SET is_active = $1 WHERE id = $2", [newStatus, req.params.promotionID]);
    res.status(200).json({ message: "Promotion status updated", is_active: newStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete("/admin/promotions/:promotionID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE promotions SET is_active = false WHERE id = $1", [req.params.promotionID]);
    res.status(200).json({ message: "Promotion disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/payments", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT id, name, type, status, config, created_at FROM payment_methods ORDER BY created_at DESC");
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/payments", adminAuth, async (req: Request, res: Response) => {
  const { name, type, status, config } = req.body;
  try {
    if (!name || !type) return res.status(400).json({ error: "Missing required fields" });
    const response = await client.query(
      "INSERT INTO payment_methods (name, type, status, config) VALUES ($1, $2, $3, $4) RETURNING id, name, type, status, config",
      [name, type, status ?? true, config || null],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/payments/:paymentID", adminAuth, async (req: Request, res: Response) => {
  const { name, type, status, config } = req.body;
  try {
    await client.query("UPDATE payment_methods SET name = $1, type = $2, status = $3, config = $4 WHERE id = $5", [name, type, status, config || null, req.params.paymentID]);
    res.status(200).json({ message: "Payment method updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete("/admin/payments/:paymentID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE payment_methods SET status = false WHERE id = $1", [req.params.paymentID]);
    res.status(200).json({ message: "Payment method disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/shipping", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT id, zone_name, delivery_time, shipping_cost, status, created_at FROM shipping_zones ORDER BY created_at DESC");
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/shipping", adminAuth, async (req: Request, res: Response) => {
  const { zone_name, delivery_time, shipping_cost } = req.body;
  try {
    if (!zone_name || !delivery_time || shipping_cost === undefined) return res.status(400).json({ error: "Missing required fields" });
    const response = await client.query(
      "INSERT INTO shipping_zones (zone_name, delivery_time, shipping_cost, status) VALUES ($1, $2, $3, true) RETURNING id, zone_name, delivery_time, shipping_cost, status",
      [zone_name, delivery_time, shipping_cost],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/shipping/:shippingID", adminAuth, async (req: Request, res: Response) => {
  const { zone_name, delivery_time, shipping_cost, status } = req.body;
  try {
    await client.query("UPDATE shipping_zones SET zone_name = $1, delivery_time = $2, shipping_cost = $3, status = $4 WHERE id = $5", [zone_name, delivery_time, shipping_cost, status, req.params.shippingID]);
    res.status(200).json({ message: "Shipping zone updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete("/admin/shipping/:shippingID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE shipping_zones SET status = false WHERE id = $1", [req.params.shippingID]);
    res.status(200).json({ message: "Shipping zone disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/content", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT id, title, type, location, status, content_data, created_at FROM content_items ORDER BY created_at DESC");
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/content", adminAuth, async (req: Request, res: Response) => {
  const { title, type, location, content_data } = req.body;
  try {
    if (!title || !type || !location) return res.status(400).json({ error: "Missing required fields" });
    const response = await client.query(
      "INSERT INTO content_items (title, type, location, content_data, status) VALUES ($1, $2, $3, $4, true) RETURNING id, title, type, location, status",
      [title, type, location, content_data || null],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/content/:contentID", adminAuth, async (req: Request, res: Response) => {
  const { title, type, location, content_data, status } = req.body;
  try {
    await client.query("UPDATE content_items SET title = $1, type = $2, location = $3, content_data = $4, status = $5 WHERE id = $6", [title, type, location, content_data || null, status, req.params.contentID]);
    res.status(200).json({ message: "Content updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete("/admin/content/:contentID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE content_items SET status = false WHERE id = $1", [req.params.contentID]);
    res.status(200).json({ message: "Content disabled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/reviews", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT r.reviewid AS id, r.reviewid, r.userid, r.productid, r.rating, r.title,
             r.comment, r.status, r.createdat AS created_at, r.durability_rating,
             r.safety_rating, r.child_enjoyment_rating, r.age_at_review,
             u.username, p.title AS product_title
      FROM reviews r
      LEFT JOIN users u ON r.userid = u.userid
      LEFT JOIN products p ON r.productid = p.productid
      ORDER BY r.createdat DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put("/admin/reviews/:reviewID/status", adminAuth, async (req: Request, res: Response) => {
  const { status } = req.body;
  try {
    await client.query("UPDATE reviews SET status = $1, updatedat = NOW() WHERE reviewid = $2", [status, req.params.reviewID]);
    res.status(200).json({ message: "Review status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete("/admin/reviews/:reviewID", adminAuth, async (req: Request, res: Response) => {
  try {
    await client.query("UPDATE reviews SET status = 'hidden', updatedat = NOW() WHERE reviewid = $1", [req.params.reviewID]);
    res.status(200).json({ message: "Review hidden" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/settings", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT key, value FROM settings ORDER BY key ASC");
    const settings = response.rows.reduce<Record<string, any>>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.status(200).json({ data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/settings", adminAuth, async (req: Request, res: Response) => {
  const { settings } = req.body;

  try {
    if (!settings || typeof settings !== "object") return res.status(400).json({ error: "Invalid settings format" });

    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, JSON.stringify(value)],
      );
    }

    res.status(200).json({ message: "Settings updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
