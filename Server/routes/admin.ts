import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;
const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100);

const VALID_ROLES = ["customer", "sales_staff", "warehouse_manager", "admin"] as const;
type UserRole = (typeof VALID_ROLES)[number];
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

function getBearerToken(value?: string) {
  if (!value) return "";
  const parts = value.split(" ");
  return parts.length === 2 ? parts[1] : value;
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
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
    if (decoded.role !== "admin") return res.status(403).json({ error: "Forbidden - Admin only" });

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

function normalizeRole(role: unknown): UserRole {
  if (typeof role === "string" && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  return "customer";
}

function normalizeOrderStatus(status?: string) {
  const found = ORDER_STATUSES.find((item) => item.toLowerCase() === String(status || "").toLowerCase());
  return found || null;
}

async function upsertPrimaryProductImage(productID: number | string, imageUrl?: string, imageAlt?: string) {
  const safeUrl = String(imageUrl || "").trim();
  if (!safeUrl) return;

  const existing = await client.query(
    "SELECT imageid FROM productimages WHERE productid = $1 AND COALESCE(isprimary, false) = true LIMIT 1",
    [productID],
  );

  if (existing.rows.length) {
    await client.query(
      "UPDATE productimages SET imglink = $1, imgalt = COALESCE($2, imgalt), isprimary = true WHERE imageid = $3",
      [safeUrl, imageAlt || null, existing.rows[0].imageid],
    );
    return;
  }

  await client.query(
    "INSERT INTO productimages (imageid, productid, imglink, imgalt, isprimary) VALUES ($1, $2, $3, $4, true)",
    [IDGenerator(), productID, safeUrl, imageAlt || null],
  );
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
  role: UserRole;
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
             pi.imglink AS image_url, pi.imgalt AS image_alt,
             p.age_group, p.gender, p.material, p.skill_type, p.brand,
             p.safety_certificates, p.low_stock_threshold, p.supplier_id,
             COALESCE(p.is_active, true) AS is_active,
             pp.stars, pp.isnew, pp.issale, pp.isdiscount, pp.views, pp.sold, pp.rating
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.categoryid
      LEFT JOIN productparams pp ON p.productid = pp.productid
      LEFT JOIN productimages pi ON pi.productid = p.productid AND COALESCE(pi.isprimary, false) = true
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
    image_url,
    imglink,
    image_alt,
    imgalt,
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

    await upsertPrimaryProductImage(product.rows[0].productid, image_url || imglink || imgid, image_alt || imgalt || title);

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
    image_url,
    imglink,
    image_alt,
    imgalt,
    age_group,
    gender,
    material,
    skill_type,
    brand,
    safety_certificates,
    low_stock_threshold,
    supplier_id,
    is_active,
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

    await upsertPrimaryProductImage(productID, image_url || imglink || imgid, image_alt || imgalt || title);

    await client.query("COMMIT");

    res.status(200).json({ message: "Product updated" });
  } catch (error) {
    await client.query("ROLLBACK");
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

function buildOrderDeliveryStatus(status: string) {
  if (status === "Completed") return "Delivered";
  if (["Confirmed", "Prepared", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"].includes(status)) return status;
  return null;
}

async function updateOrderStatusHandler(req: Request, res: Response) {
  const status = normalizeOrderStatus(
    req.body.status || req.body.order_status || req.body.orderstatus
  );

  if (!status) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  try {
    const deliveryStatus = buildOrderDeliveryStatus(status);

    const response = await client.query(
      `UPDATE orders
       SET orderstatus = $1::varchar,
           order_status = $1::varchar,
           delivery_status = COALESCE($3::varchar, delivery_status),
           tracking_number = COALESCE(NULLIF($4::varchar, ''), tracking_number),
           shipped_at = CASE
             WHEN $1::varchar = 'Shipped' AND shipped_at IS NULL THEN NOW()
             ELSE shipped_at
           END,
           delivered_at = CASE
             WHEN $1::varchar IN ('Delivered','Completed') AND delivered_at IS NULL THEN NOW()
             ELSE delivered_at
           END,
           updatedat = NOW()
       WHERE orderid = $2::int
       RETURNING orderid, orderstatus, order_status, delivery_status, tracking_number, shipped_at, delivered_at`,
      [
        status,
        Number(req.params.orderID),
        deliveryStatus,
        req.body.tracking_number || "",
      ],
    );

    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated",
      data: response.rows[0],
      status,
    });
  } catch (error: any) {
    console.error("UPDATE /admin/orders/:orderID/status error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
}
router.get("/admin/orders/:orderID", adminAuth, async (req: Request, res: Response) => {
  const { orderID } = req.params;

  try {
    const orderResult = await client.query(
      `
      SELECT
        o.orderid,
        o.userid,
        o.totalamount,
        o.orderstatus,
        o.order_status,
        o.delivery_status,
        o.tracking_number,
        o.createdat,
        o.updatedat,
        o.is_gift,
        o.gift_message,
        o.gift_wrapping_type,

        u.username AS customer_name,
        u.email AS customer_email,
        u.mobile_number AS customer_phone,

        a.username AS receiver_name,
        a.contactnumber AS receiver_phone,
        a.addressline1,
        a.addressline2,
        a.city,
        a.state,
        a.country,
        a.postalcode,

        p.paymentid,
        p.paymentmethod,
        p.paymentstatus,
        p.amount AS paid_amount,
        p.transactionid,

        s.shippingid,
        s.shippingmethod,
        COALESCE(s.shippingcost, 0) AS shippingcost,
        s.trackingnumber,
        s.shippedat,
        s.deliveredat,
        s.shipped_at,
        s.delivered_at
      FROM orders o
      LEFT JOIN users u ON u.userid = o.userid
      LEFT JOIN LATERAL (
        SELECT *
        FROM shipping s1
        WHERE s1.orderid = o.orderid
        ORDER BY s1.shippingid DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN addresses a ON a.addressid = s.addressid
      LEFT JOIN LATERAL (
        SELECT *
        FROM payments p1
        WHERE p1.orderid = o.orderid
        ORDER BY p1.paymentid DESC
        LIMIT 1
      ) p ON true
      WHERE o.orderid = $1
      LIMIT 1
      `,
      [orderID],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    const itemsResult = await client.query(
      `
      SELECT
        oi.orderitemid,
        oi.orderid,
        oi.productid,
        oi.quantity,
        oi.colorid,
        oi.sizeid,
        oi.gift_wrapping,
        oi.gift_wrap_style,
        oi.gift_message,

        pr.title,
        pr.price,
        COALESCE(pr.discount, 0) AS discount,
        pr.brand,
        pr.age_group,
        pr.skill_type,
        pi.imglink AS image_url,
        pi.imgalt AS image_alt,

        pc.colorname,
        ps.sizename,

        ROUND((pr.price * oi.quantity), 2) AS raw_total,
        ROUND((pr.price * oi.quantity) * COALESCE(pr.discount, 0) / 100.0, 2) AS discount_amount,
        ROUND((pr.price * oi.quantity) * (1 - COALESCE(pr.discount, 0) / 100.0), 2) AS line_total
      FROM orderitems oi
      LEFT JOIN products pr ON pr.productid = oi.productid
      LEFT JOIN productimages pi ON pi.productid = oi.productid AND COALESCE(pi.isprimary, false) = true
      LEFT JOIN productcolors pc ON pc.colorid = oi.colorid
      LEFT JOIN productsizes ps ON ps.sizeid = oi.sizeid
      WHERE oi.orderid = $1
      ORDER BY oi.orderitemid ASC
      `,
      [orderID],
    );

    const items = itemsResult.rows;
    const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0);
    const shippingCost = Number(orderResult.rows[0].shippingcost || 0);

    return res.status(200).json({
      data: {
        ...orderResult.rows[0],
        items,
        subtotal,
        shippingcost: shippingCost,
        grand_total: Number(orderResult.rows[0].totalamount || subtotal + shippingCost),
      },
    });
  } catch (error) {
    console.error("GET /admin/orders/:orderID error:", error);
    return res.status(500).json({ error: "Server Error" });
  }
});


router.put("/admin/orders/:orderID/status", adminAuth, updateOrderStatusHandler);
router.patch("/admin/orders/:orderID/status", adminAuth, updateOrderStatusHandler);

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


router.get("/admin/brands", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT b.brand_id AS brandid, b.brand_id, b.name, b.slug, b.manufacturer,
             b.manufacturer AS manufacturer_info,
             b.country, b.description, b.safety_certificates,
             b.safety_certificates AS certification_details,
             b.website, b.logo_url, COALESCE(b.is_active, true) AS is_active,
             b.created_at, b.updated_at,
             COUNT(p.productid)::int AS product_count
      FROM brands b
      LEFT JOIN products p ON p.brand = b.name AND COALESCE(p.is_active, true) = true
      GROUP BY b.brand_id
      ORDER BY b.name ASC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error: any) {
    console.error("GET /admin/brands error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.post("/admin/brands", adminAuth, async (req: Request, res: Response) => {
  const { name, slug, manufacturer, manufacturer_info, country, description, safety_certificates, certification_details, website, logo_url } = req.body;
  try {
    if (!name || !String(name).trim()) return res.status(400).json({ error: "Brand name is required" });
    const safeSlug = slug || String(name).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const response = await client.query(
      `INSERT INTO brands (name, slug, manufacturer, country, description, safety_certificates, website, logo_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
       RETURNING brand_id AS brandid, brand_id, name, slug, manufacturer, manufacturer AS manufacturer_info,
                 country, description, safety_certificates, safety_certificates AS certification_details,
                 website, logo_url, is_active, created_at, updated_at`,
      [String(name).trim(), safeSlug, manufacturer || manufacturer_info || null, country || null, description || null, safety_certificates || certification_details || null, website || null, logo_url || null],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error: any) {
    console.error("POST /admin/brands error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.put("/admin/brands/:brandID", adminAuth, async (req: Request, res: Response) => {
  const { name, slug, manufacturer, manufacturer_info, country, description, safety_certificates, certification_details, website, logo_url, is_active } = req.body;
  try {
    const response = await client.query(
      `UPDATE brands
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           manufacturer = COALESCE($3, manufacturer),
           country = COALESCE($4, country),
           description = COALESCE($5, description),
           safety_certificates = COALESCE($6, safety_certificates),
           website = COALESCE($7, website),
           logo_url = COALESCE($8, logo_url),
           is_active = COALESCE($9, is_active),
           updated_at = NOW()
       WHERE brand_id = $10
       RETURNING brand_id AS brandid, brand_id, name, slug, manufacturer, manufacturer AS manufacturer_info,
                 country, description, safety_certificates, safety_certificates AS certification_details,
                 website, logo_url, is_active, created_at, updated_at`,
      [name || null, slug || null, manufacturer || manufacturer_info || null, country || null, description || null, safety_certificates || certification_details || null, website || null, logo_url || null, is_active, req.params.brandID],
    );
    if (response.rows.length === 0) return res.status(404).json({ error: "Brand not found" });
    res.status(200).json({ data: response.rows[0] });
  } catch (error: any) {
    console.error("PUT /admin/brands error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.delete("/admin/brands/:brandID", adminAuth, async (req: Request, res: Response) => {
  try {
    const response = await client.query(
      "UPDATE brands SET is_active = false, updated_at = NOW() WHERE brand_id = $1 RETURNING brand_id AS brandid",
      [req.params.brandID],
    );
    if (response.rows.length === 0) return res.status(404).json({ error: "Brand not found" });
    res.status(200).json({ message: "Brand disabled", data: response.rows[0] });
  } catch (error: any) {
    console.error("DELETE /admin/brands error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.get("/admin/collections", adminAuth, async (_req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT c.collection_id AS collectionid, c.collection_id, c.name, c.slug, c.description,
             c.imglink, c.imglink AS banner_url, c.imglink AS icon_url,
             c.display_order AS sort_order, COALESCE(c.is_active, true) AS is_active,
             c.created_at,
             COUNT(cp.productid)::int AS product_count
      FROM collections c
      LEFT JOIN collection_products cp ON cp.collection_id = c.collection_id
      GROUP BY c.collection_id
      ORDER BY c.display_order ASC, c.name ASC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error: any) {
    console.error("GET /admin/collections error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.post("/admin/collections", adminAuth, async (req: Request, res: Response) => {
  const { name, slug, description, imglink, banner_url, icon_url, sort_order, display_order, is_active } = req.body;
  try {
    if (!name || !String(name).trim()) return res.status(400).json({ error: "Collection name is required" });
    const safeSlug = slug || String(name).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const response = await client.query(
      `INSERT INTO collections (name, slug, description, imglink, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING collection_id AS collectionid, collection_id, name, slug, description,
                 imglink, imglink AS banner_url, imglink AS icon_url, display_order AS sort_order,
                 is_active, created_at`,
      [String(name).trim(), safeSlug, description || null, imglink || banner_url || icon_url || null, Number(sort_order ?? display_order ?? 0), is_active !== false],
    );
    res.status(201).json({ data: response.rows[0] });
  } catch (error: any) {
    console.error("POST /admin/collections error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.put("/admin/collections/:collectionID", adminAuth, async (req: Request, res: Response) => {
  const { name, slug, description, imglink, banner_url, icon_url, sort_order, display_order, is_active } = req.body;
  try {
    const response = await client.query(
      `UPDATE collections
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           imglink = COALESCE($4, imglink),
           display_order = COALESCE($5, display_order),
           is_active = COALESCE($6, is_active)
       WHERE collection_id = $7
       RETURNING collection_id AS collectionid, collection_id, name, slug, description,
                 imglink, imglink AS banner_url, imglink AS icon_url, display_order AS sort_order,
                 is_active, created_at`,
      [name || null, slug || null, description || null, imglink || banner_url || icon_url || null, sort_order ?? display_order ?? null, is_active, req.params.collectionID],
    );
    if (response.rows.length === 0) return res.status(404).json({ error: "Collection not found" });
    res.status(200).json({ data: response.rows[0] });
  } catch (error: any) {
    console.error("PUT /admin/collections error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
  }
});

router.delete("/admin/collections/:collectionID", adminAuth, async (req: Request, res: Response) => {
  try {
    const response = await client.query(
      "UPDATE collections SET is_active = false WHERE collection_id = $1 RETURNING collection_id AS collectionid",
      [req.params.collectionID],
    );
    if (response.rows.length === 0) return res.status(404).json({ error: "Collection not found" });
    res.status(200).json({ message: "Collection disabled", data: response.rows[0] });
  } catch (error: any) {
    console.error("DELETE /admin/collections error:", error);
    res.status(500).json({ error: error?.message || "Server Error" });
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

router.get("/admin/reports", adminAuth, async (req: Request, res: Response) => {
  try {
    const finishedStatus = ["Delivered", "Completed"];
    const [summary, topProducts, paymentBreakdown, revenueByDay] = await Promise.all([
      client.query(
        `
        SELECT
          COALESCE(SUM(CASE WHEN o.orderstatus = ANY($1) OR o.delivery_status = ANY($1) THEN o.totalamount ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(CASE WHEN (o.orderstatus = ANY($1) OR o.delivery_status = ANY($1)) AND o.createdat >= NOW() - INTERVAL '7 days' THEN o.totalamount ELSE 0 END), 0) AS weekly_revenue,
          COUNT(*) FILTER (WHERE o.orderstatus = ANY($1) OR o.delivery_status = ANY($1)) AS completed_orders,
          (SELECT COUNT(*) FROM users WHERE createdat >= NOW() - INTERVAL '30 days') AS new_customers
        FROM orders o
        `,
        [finishedStatus],
      ),
      client.query(
        `
        SELECT
          pr.title,
          COALESCE(SUM(oi.quantity), 0)::int AS sold_quantity,
          COALESCE(SUM((pr.price * oi.quantity) * (1 - COALESCE(pr.discount, 0) / 100.0)), 0) AS revenue
        FROM orderitems oi
        INNER JOIN products pr ON pr.productid = oi.productid
        INNER JOIN orders o ON o.orderid = oi.orderid
        WHERE o.orderstatus = ANY($1) OR o.delivery_status = ANY($1)
        GROUP BY pr.productid, pr.title
        ORDER BY sold_quantity DESC, revenue DESC
        LIMIT 10
        `,
        [finishedStatus],
      ),
      client.query(
        `
        SELECT
          COALESCE(p.paymentmethod, 'Không rõ') AS paymentmethod,
          COUNT(DISTINCT o.orderid)::int AS orders,
          COALESCE(SUM(o.totalamount), 0) AS total
        FROM orders o
        LEFT JOIN payments p ON p.orderid = o.orderid
        WHERE o.orderstatus = ANY($1) OR o.delivery_status = ANY($1)
        GROUP BY COALESCE(p.paymentmethod, 'Không rõ')
        ORDER BY total DESC
        `,
        [finishedStatus],
      ),
      client.query(
        `
        SELECT
          DATE_TRUNC('day', createdat)::date AS day,
          COUNT(*)::int AS orders,
          COALESCE(SUM(totalamount), 0) AS revenue
        FROM orders
        WHERE (orderstatus = ANY($1) OR delivery_status = ANY($1))
          AND createdat >= NOW() - INTERVAL '14 days'
        GROUP BY DATE_TRUNC('day', createdat)::date
        ORDER BY day ASC
        `,
        [finishedStatus],
      ),
    ]);

    const row = summary.rows[0] || {};
    const totalOrders = Number(row.completed_orders || 0);
    const newCustomers = Number(row.new_customers || 0);

    res.status(200).json({
      data: {
        revenue: Number(row.revenue || 0),
        weeklyRevenue: Number(row.weekly_revenue || 0),
        completedOrders: totalOrders,
        newCustomers,
        conversionRate: newCustomers ? Number(((totalOrders / newCustomers) * 100).toFixed(2)) : 0,
        bestSeller: topProducts.rows[0]?.title || null,
        topProducts: topProducts.rows,
        paymentBreakdown: paymentBreakdown.rows,
        revenueByDay: revenueByDay.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
