import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { client } from "../data/DB";

const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;

interface JwtPayload {
  userID: number;
  iat?: number;
  exp?: number;
}

function getUserIDFromToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  return Number(decoded.userID);
}

const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100);

async function calculateStarAverage(productID: number) {
  const result = await client.query(
    `SELECT rating FROM reviews WHERE productid = $1`,
    [productID],
  );

  const totalReviews = result.rows.length;
  const averageStars =
    totalReviews === 0
      ? 0
      : result.rows.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews;

  await client.query(
    `UPDATE productparams
     SET stars = $2,
         rating = $3
     WHERE productid = $1`,
    [productID, averageStars, totalReviews],
  );
}

router.put("/user/orders/:orderID/cancel", async (req: Request, res: Response) => {
  const orderID = Number(req.params.orderID);
  const userIDToken = String(req.body.userIDToken || "");

  if (!Number.isInteger(orderID) || orderID <= 0) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  if (!userIDToken) {
    return res.status(401).json({ error: "Missing user token" });
  }

  let userID = 0;
  try {
    userID = getUserIDFromToken(userIDToken);
  } catch (error) {
    return res.status(401).json({ error: "Invalid user token" });
  }

  await client.query("BEGIN");

  try {
    const orderResult = await client.query(
      `SELECT orderid, userid, orderstatus
       FROM orders
       WHERE orderid = $1 AND userid = $2
       FOR UPDATE`,
      [orderID, userID],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStatus = String(orderResult.rows[0].orderstatus || "");
    if (currentStatus !== "Pending") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Chỉ được hủy đơn hàng khi đơn còn ở trạng thái chờ xác nhận.",
      });
    }

    const itemResult = await client.query(
      `SELECT productid, quantity
       FROM orderitems
       WHERE orderid = $1`,
      [orderID],
    );

    for (const item of itemResult.rows) {
      const productID = item.productid;
      const quantity = Math.max(1, Number(item.quantity || 1));

      await client.query(
        `UPDATE products
         SET stock = COALESCE(stock, 0) + $2,
             updatedat = CURRENT_TIMESTAMP
         WHERE productid = $1`,
        [productID, quantity],
      );

      await client.query(
        `UPDATE productparams
         SET sold = GREATEST(COALESCE(sold, 0) - $2, 0)
         WHERE productid = $1`,
        [productID, quantity],
      );
    }

    await client.query(
      `UPDATE orders
       SET orderstatus = 'Cancelled',
           updatedat = CURRENT_TIMESTAMP
       WHERE orderid = $1 AND userid = $2`,
      [orderID, userID],
    );

    await client.query(
      `UPDATE payments
       SET paymentstatus = 'Cancelled'
       WHERE orderid = $1 AND COALESCE(paymentstatus, '') <> 'Paid'`,
      [orderID],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Đã hủy đơn hàng thành công.",
      orderID,
      orderstatus: "Cancelled",
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Cancel order error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});

router.post("/user/reviews/create", async (req: Request, res: Response) => {
  const userIDToken = String(req.body.userIDToken || "");
  const orderID = Number(req.body.orderID);
  const productID = Number(req.body.productID);
  const rating = Number(req.body.rating);
  const title = String(req.body.title || "").trim();
  const comment = String(req.body.comment || "").trim();

  if (!userIDToken) {
    return res.status(401).json({ error: "Missing user token" });
  }

  if (!Number.isInteger(orderID) || orderID <= 0 || !Number.isInteger(productID) || productID <= 0) {
    return res.status(400).json({ error: "Invalid order or product id" });
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  if (title.length < 2 || title.length > 50) {
    return res.status(400).json({ error: "Tiêu đề đánh giá phải từ 2 đến 50 ký tự." });
  }

  if (comment.length < 2 || comment.length > 500) {
    return res.status(400).json({ error: "Nội dung đánh giá phải từ 2 đến 500 ký tự." });
  }

  let userID = 0;
  try {
    userID = getUserIDFromToken(userIDToken);
  } catch (error) {
    return res.status(401).json({ error: "Invalid user token" });
  }

  await client.query("BEGIN");

  try {
    const orderResult = await client.query(
      `SELECT o.orderid, o.userid, o.orderstatus
       FROM orders o
       INNER JOIN orderitems oi ON oi.orderid = o.orderid
       WHERE o.orderid = $1
         AND o.userid = $2
         AND oi.productid = $3
       LIMIT 1`,
      [orderID, userID, productID],
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Không tìm thấy sản phẩm trong đơn hàng của bạn." });
    }

    const currentStatus = String(orderResult.rows[0].orderstatus || "");
    if (!["Completed", "Delivered"].includes(currentStatus)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Chỉ được đánh giá khi đơn hàng đã hoàn thành.",
      });
    }

    const existedReview = await client.query(
      `SELECT reviewid FROM reviews WHERE userid = $1 AND productid = $2 LIMIT 1`,
      [userID, productID],
    );

    if (existedReview.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Bạn đã đánh giá sản phẩm này rồi." });
    }

    const reviewID = IDGenerator();
    await client.query(
      `INSERT INTO reviews (reviewid, userid, productid, rating, title, comment, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [reviewID, userID, productID, rating, title, comment],
    );

    await calculateStarAverage(productID);

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Đã thêm đánh giá sản phẩm thành công.",
      reviewID,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Create order review error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});

export default router;
