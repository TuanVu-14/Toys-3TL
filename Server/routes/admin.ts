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

export default router;
