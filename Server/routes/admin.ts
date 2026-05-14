import express, { Request, Response } from "express";
import { client } from "../data/DB";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

function parseCookie(cookieHeader: string | undefined) {
  return (cookieHeader || "")
    .split(";")
    .reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=").map((item) => item.trim());
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});
}

function adminAuth(req: Request, res: Response, next: any) {
  try {
    const sessionHeaderToken = req.headers.session?.toString().split(" ")[1];
    const cookieToken = parseCookie(req.headers.cookie?.toString())[
      "sessionhold"
    ];
    const token = sessionHeaderToken || cookieToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Forbidden - Admin only" });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function userExists(email: string, mobile_number: string) {
  const response = await client.query(
    `SELECT userid FROM "users" WHERE email = $1 OR mobile_number = $2`,
    [email, mobile_number],
  );
  return response.rows.length > 0;
}

async function insertUser(user: {
  userID: number;
  userName: string;
  email: string;
  password: string;
  mobile_number: string;
  dob: string;
  role: string;
  creationIP: string;
}) {
  await client.query(
    `INSERT INTO "users" (userID, userName, email, password, mobile_number, dob, creation_ip, role, update_ip, promotional)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $7, false)`,
    [
      user.userID,
      user.userName,
      user.email,
      user.password,
      user.mobile_number,
      user.dob,
      user.creationIP,
      user.role,
    ],
  );
}

router.post("/admin/bootstrap", async (req: Request, res: Response) => {
  const { userName, email, password, mobile_number, dob } = req.body;
  try {
    const adminCount = await client.query(
      `SELECT COUNT(*) FROM "users" WHERE role = 'admin'`,
    );
    if (parseInt(adminCount.rows[0].count, 10) > 0) {
      return res
        .status(403)
        .json({ error: "Admin bootstrap already completed" });
    }
    if (!userName || !email || !password || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (await userExists(email, mobile_number)) {
      return res
        .status(409)
        .json({ error: "Email or mobile number already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await insertUser({
      userID: Math.round(Math.random() * 1000000000),
      userName,
      email,
      password: hashedPassword,
      mobile_number,
      dob,
      role: "admin",
      creationIP: req.ip || "unknown",
    });
    res.status(201).json({ message: "Admin account created" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/admin/create", adminAuth, async (req: Request, res: Response) => {
  const { userName, email, password, mobile_number, dob } = req.body;
  try {
    if (!userName || !email || !password || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (await userExists(email, mobile_number)) {
      return res
        .status(409)
        .json({ error: "Email or mobile number already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await insertUser({
      userID: Math.round(Math.random() * 1000000000),
      userName,
      email,
      password: hashedPassword,
      mobile_number,
      dob,
      role: "admin",
      creationIP: req.ip || "unknown",
    });
    res.status(201).json({ message: "Admin account created" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/stats", adminAuth, async (req: Request, res: Response) => {
  try {
    const [products, orders, users, revenue] = await Promise.all([
      client.query("SELECT COUNT(*) as count FROM products"),
      client.query("SELECT COUNT(*) as count FROM orders"),
      client.query("SELECT COUNT(*) as count FROM users"),
      client.query("SELECT COALESCE(SUM(totalamount), 0) as total FROM orders"),
    ]);
    const recentOrders = await client.query(`
      SELECT o.orderid, o.totalamount, o.orderstatus, o.createdat,
        u.username, u.email
      FROM orders o
      INNER JOIN users u ON o.userid = u.userid
      ORDER BY o.createdat DESC
      LIMIT 5
    `);
    res.status(200).json({
      products: parseInt(products.rows[0].count, 10),
      orders: parseInt(orders.rows[0].count, 10),
      users: parseInt(users.rows[0].count, 10),
      revenue: parseFloat(revenue.rows[0].total),
      recentOrders: recentOrders.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/admin/users", adminAuth, async (req: Request, res: Response) => {
  try {
    const response = await client.query(
      `SELECT userid, username, email, mobile_number, dob, role
       FROM users ORDER BY userid DESC`,
    );
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(500).json({ error: "Server Error" });
  }
});

router.delete(
  "/admin/users/:userID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { userID } = req.params;
    try {
      await client.query("DELETE FROM users WHERE userid = $1", [userID]);
      res.status(200).json({ message: "User deleted" });
    } catch {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/users/:userID/role",
  adminAuth,
  async (req: Request, res: Response) => {
    const { userID } = req.params;
    const { role } = req.body;
    try {
      await client.query("UPDATE users SET role = $1 WHERE userid = $2", [
        role,
        userID,
      ]);
      res.status(200).json({ message: "Role updated" });
    } catch {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post("/admin/users", adminAuth, async (req: Request, res: Response) => {
  const { username, email, mobile_number, dob, password, role } = req.body;
  try {
    if (!username || !email || !password || !mobile_number || !dob) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (await userExists(email, mobile_number)) {
      return res.status(409).json({ error: "Email or mobile number already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
  `INSERT INTO users (userid, username, email, password, mobile_number, dob, role, creation_ip, update_ip, promotional)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9::inet, false)`,
  [
    Math.round(Math.random() * 1000000000),
    username,
    email,
    hashedPassword,
    mobile_number,
    dob,
    role || "customer",
    req.ip || "127.0.0.1",   // $8
    req.ip || "127.0.0.1",   // $9
  ],
);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error); // 👈 thêm dòng này để xem lỗi chi tiết trong terminal
    res.status(500).json({ error: "Server Error" });
  }
});

router.put(
  "/admin/users/:userID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { userID } = req.params;
    const { username, email, mobile_number, dob, role } = req.body;
    try {
      await client.query(
        `UPDATE users SET username = $1, email = $2, mobile_number = $3, dob = $4, role = $5, update_ip = $6
         WHERE userid = $7`,
        [
          username,
          email,
          mobile_number,
          dob,
          role,
          req.ip || "unknown",
          userID,
        ],
      );
      res.status(200).json({ message: "User updated" });
    } catch {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.get(
  "/admin/products",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT p.productid, p.title, p.description, c.name AS category,
               p.price, p.discount, p.stock,
               pp.stars, pp.isnew, pp.issale, pp.isdiscount
        FROM products p
        LEFT JOIN categories c ON p.categoryid = c.categoryid
        LEFT JOIN productparams pp ON p.productid = pp.productid
        ORDER BY p.productid DESC
      `);
      res.status(200).json({ data: response.rows });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/products/:productID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { productID } = req.params;
    try {
      await client.query("DELETE FROM products WHERE productid = $1", [
        productID,
      ]);
      res.status(200).json({ message: "Product deleted" });
    } catch {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/products",
  adminAuth,
  async (req: Request, res: Response) => {
    const { title, description, categoryid, price, discount, stock } = req.body;
    try {
      if (!title || !categoryid || !price) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const response = await client.query(
        `INSERT INTO products (title, description, categoryid, price, discount, stock)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING productid, title, description, price, discount, stock`,
        [
          title,
          description || null,
          categoryid,
          price,
          discount || 0,
          stock || 0,
        ],
      );
      res.status(201).json({ data: response.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/products/:productID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { productID } = req.params;
    const { title, description, categoryid, price, discount, stock } = req.body;
    try {
      await client.query(
        `UPDATE products 
         SET title = $1, description = $2, categoryid = $3, price = $4, discount = $5, stock = $6
         WHERE productid = $7`,
        [title, description, categoryid, price, discount, stock, productID],
      );
      res.status(200).json({ message: "Product updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/products/:productID/params",
  adminAuth,
  async (req: Request, res: Response) => {
    const { productID } = req.params;
    const { isnew, issale, isdiscount, stars } = req.body;
    try {
      await client.query(
        `UPDATE productparams SET isnew=$1, issale=$2, isdiscount=$3, stars=$4
       WHERE productid=$5`,
        [isnew, issale, isdiscount, stars, productID],
      );
      res.status(200).json({ message: "Product updated" });
    } catch {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.get("/admin/orders", adminAuth, async (req: Request, res: Response) => {
  try {
    const response = await client.query(`
      SELECT o.orderid, o.totalamount, o.orderstatus, o.createdat,
             u.username, u.email, u.userid
      FROM orders o
      INNER JOIN users u ON o.userid = u.userid
      ORDER BY o.createdat DESC
    `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.put(
  "/admin/orders/:orderID/status",
  adminAuth,
  async (req: Request, res: Response) => {
    const { orderID } = req.params;
    const { status } = req.body;
    try {
      await client.query(
        "UPDATE orders SET orderstatus = $1, updatedat = NOW() WHERE orderid = $2",
        [status, orderID],
      );
      res.status(200).json({ message: "Order status updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.get(
  "/admin/categories",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT c.categoryid, c.name, c.slug, c.maincategory,
               COUNT(p.productid) as products
        FROM categories c
        LEFT JOIN products p ON c.categoryid = p.categoryid
        GROUP BY c.categoryid, c.name, c.slug, c.maincategory
        ORDER BY c.categoryid
      `);
      res.status(200).json({ data: response.rows });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/categories",
  adminAuth,
  async (req: Request, res: Response) => {
    const { name, slug, maincategory } = req.body;
    try {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      const response = await client.query(
        `INSERT INTO categories (name, slug, maincategory) 
         VALUES ($1, $2, $3) RETURNING categoryid, name, slug, maincategory`,
        [
          name,
          slug || name.toLowerCase().replace(/\s+/g, "-"),
          maincategory || null,
        ],
      );
      res.status(201).json({ data: response.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/categories/:categoryID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { categoryID } = req.params;
    try {
      await client.query("DELETE FROM categories WHERE categoryid = $1", [
        categoryID,
      ]);
      res.status(200).json({ message: "Category deleted" });
    } catch {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/categories/:categoryID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { categoryID } = req.params;
    const { name, slug, maincategory } = req.body;
    try {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      await client.query(
        `UPDATE categories SET name = $1, slug = $2, maincategory = $3 WHERE categoryid = $4`,
        [
          name,
          slug || name.toLowerCase().replace(/\s+/g, "-"),
          maincategory || null,
          categoryID,
        ],
      );
      res.status(200).json({ message: "Category updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

// Promotions endpoints
router.get(
  "/admin/promotions",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT id, code, type, discount, expiration_date, is_active, created_at
        FROM promotions
        ORDER BY created_at DESC
      `);
      res.status(200).json({ data: response.rows });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/promotions",
  adminAuth,
  async (req: Request, res: Response) => {
    const { code, type, discount, expiration_date } = req.body;
    try {
      if (!code || !type || !discount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const response = await client.query(
        `INSERT INTO promotions (code, type, discount, expiration_date, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, code, type, discount, expiration_date, is_active`,
        [code.toUpperCase(), type, discount, expiration_date || null],
      );
      res.status(201).json({ data: response.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/promotions/:promotionID/toggle",
  adminAuth,
  async (req: Request, res: Response) => {
    const { promotionID } = req.params;
    try {
      const current = await client.query(
        "SELECT is_active FROM promotions WHERE id = $1",
        [promotionID],
      );
      if (current.rows.length === 0) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      const newStatus = !current.rows[0].is_active;
      await client.query("UPDATE promotions SET is_active = $1 WHERE id = $2", [
        newStatus,
        promotionID,
      ]);
      res
        .status(200)
        .json({ message: "Promotion status updated", is_active: newStatus });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/promotions/:promotionID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { promotionID } = req.params;
    try {
      await client.query("DELETE FROM promotions WHERE id = $1", [promotionID]);
      res.status(200).json({ message: "Promotion deleted" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

// Payments endpoints
router.get(
  "/admin/payments",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT id, name, type, status, config, created_at
        FROM payment_methods
        ORDER BY created_at DESC
      `);
      res.status(200).json({ data: response.rows });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/payments",
  adminAuth,
  async (req: Request, res: Response) => {
    const { name, type, status, config } = req.body;
    try {
      if (!name || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const response = await client.query(
        `INSERT INTO payment_methods (name, type, status, config)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, type, status, config`,
        [name, type, status || true, config || null],
      );
      res.status(201).json({ data: response.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/payments/:paymentID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { paymentID } = req.params;
    const { name, type, status, config } = req.body;
    try {
      await client.query(
        `UPDATE payment_methods SET name = $1, type = $2, status = $3, config = $4 WHERE id = $5`,
        [name, type, status, config, paymentID],
      );
      res.status(200).json({ message: "Payment method updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/payments/:paymentID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { paymentID } = req.params;
    try {
      await client.query("DELETE FROM payment_methods WHERE id = $1", [
        paymentID,
      ]);
      res.status(200).json({ message: "Payment method deleted" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

// Shipping endpoints
router.get(
  "/admin/shipping",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT id, zone_name, delivery_time, shipping_cost, status, created_at
        FROM shipping_zones
        ORDER BY created_at DESC
      `);
      res.status(200).json({ data: response.rows });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/shipping",
  adminAuth,
  async (req: Request, res: Response) => {
    const { zone_name, delivery_time, shipping_cost } = req.body;
    try {
      if (!zone_name || !delivery_time || shipping_cost === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const response = await client.query(
        `INSERT INTO shipping_zones (zone_name, delivery_time, shipping_cost, status)
         VALUES ($1, $2, $3, true)
         RETURNING id, zone_name, delivery_time, shipping_cost, status`,
        [zone_name, delivery_time, shipping_cost],
      );
      res.status(201).json({ data: response.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/shipping/:shippingID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { shippingID } = req.params;
    const { zone_name, delivery_time, shipping_cost, status } = req.body;
    try {
      await client.query(
        `UPDATE shipping_zones SET zone_name = $1, delivery_time = $2, shipping_cost = $3, status = $4 WHERE id = $5`,
        [zone_name, delivery_time, shipping_cost, status, shippingID],
      );
      res.status(200).json({ message: "Shipping zone updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/shipping/:shippingID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { shippingID } = req.params;
    try {
      await client.query("DELETE FROM shipping_zones WHERE id = $1", [
        shippingID,
      ]);
      res.status(200).json({ message: "Shipping zone deleted" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

// Content endpoints
router.get("/admin/content", adminAuth, async (req: Request, res: Response) => {
  try {
    const response = await client.query(`
        SELECT id, title, type, location, status, created_at
        FROM content_items
        ORDER BY created_at DESC
      `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post(
  "/admin/content",
  adminAuth,
  async (req: Request, res: Response) => {
    const { title, type, location, content_data } = req.body;
    try {
      if (!title || !type || !location) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const response = await client.query(
        `INSERT INTO content_items (title, type, location, content_data, status)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, title, type, location, status`,
        [title, type, location, content_data || null],
      );
      res.status(201).json({ data: response.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.put(
  "/admin/content/:contentID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { contentID } = req.params;
    const { title, type, location, content_data, status } = req.body;
    try {
      await client.query(
        `UPDATE content_items SET title = $1, type = $2, location = $3, content_data = $4, status = $5 WHERE id = $6`,
        [title, type, location, content_data, status, contentID],
      );
      res.status(200).json({ message: "Content updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/content/:contentID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { contentID } = req.params;
    try {
      await client.query("DELETE FROM content_items WHERE id = $1", [
        contentID,
      ]);
      res.status(200).json({ message: "Content deleted" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

// Reviews endpoints
router.get("/admin/reviews", adminAuth, async (req: Request, res: Response) => {
  try {
    const response = await client.query(`
        SELECT r.id, r.userid, r.productid, r.rating, r.comment, r.status, r.created_at,
               u.username, p.title
        FROM reviews r
        LEFT JOIN users u ON r.userid = u.userid
        LEFT JOIN products p ON r.productid = p.productid
        ORDER BY r.created_at DESC
      `);
    res.status(200).json({ data: response.rows });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.put(
  "/admin/reviews/:reviewID/status",
  adminAuth,
  async (req: Request, res: Response) => {
    const { reviewID } = req.params;
    const { status } = req.body;
    try {
      await client.query("UPDATE reviews SET status = $1 WHERE id = $2", [
        status,
        reviewID,
      ]);
      res.status(200).json({ message: "Review status updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.delete(
  "/admin/reviews/:reviewID",
  adminAuth,
  async (req: Request, res: Response) => {
    const { reviewID } = req.params;
    try {
      await client.query("DELETE FROM reviews WHERE id = $1", [reviewID]);
      res.status(200).json({ message: "Review deleted" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

// Settings endpoints
router.get(
  "/admin/settings",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT key, value FROM settings
      `);
      const settings = response.rows.reduce(
        (acc, { key, value }) => ({ ...acc, [key]: value }),
        {},
      );
      res.status(200).json({ data: settings });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/settings",
  adminAuth,
  async (req: Request, res: Response) => {
    const { settings } = req.body;
    try {
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ error: "Invalid settings format" });
      }
      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [key, JSON.stringify(value)],
        );
      }
      res.status(200).json({ message: "Settings updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);



// Settings endpoints
router.get(
  "/admin/settings",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const response = await client.query(`
        SELECT key, value FROM settings
      `);
      const settings = response.rows.reduce(
        (acc, { key, value }) => ({ ...acc, [key]: value }),
        {},
      );
      res.status(200).json({ data: settings });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/admin/settings",
  adminAuth,
  async (req: Request, res: Response) => {
    const { settings } = req.body;
    try {
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ error: "Invalid settings format" });
      }
      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [key, JSON.stringify(value)],
        );
      }
      res.status(200).json({ message: "Settings updated" });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  },
);

export default router;
