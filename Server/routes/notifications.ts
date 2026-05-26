
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

function getBearerToken(value?: string) {
  if (!value) return "";
  const parts = value.split(" ");
  return parts.length === 2 ? parts[1] : value;
}

function readCurrentUser(req: Request) {
  const cookies = parseCookie(req.headers.cookie?.toString());
  const token =
    getBearerToken(req.headers.authorization?.toString()) ||
    getBearerToken(req.headers.session?.toString()) ||
    cookies.sessionhold ||
    cookies.session;

  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function createUserNotification({
  userid,
  title,
  message,
  type = "system",
  related_table = null,
  related_id = null,
  action_url = null,
}: {
  userid: number | string;
  title: string;
  message: string;
  type?: string;
  related_table?: string | null;
  related_id?: number | string | null;
  action_url?: string | null;
}) {
  await client.query(
    `INSERT INTO notifications (userid, title, message, type, related_table, related_id, action_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [userid, title, message, type, related_table, related_id, action_url],
  );
}

export async function createRoleNotification({
  role,
  title,
  message,
  type = "system",
  related_table = null,
  related_id = null,
  action_url = null,
}: {
  role: string;
  title: string;
  message: string;
  type?: string;
  related_table?: string | null;
  related_id?: number | string | null;
  action_url?: string | null;
}) {
  await client.query(
    `INSERT INTO notifications (userid, target_role, title, message, type, related_table, related_id, action_url)
     SELECT userid, $1, $2, $3, $4, $5, $6, $7
     FROM users
     WHERE role = $1 AND COALESCE(is_active, true) = true`,
    [role, title, message, type, related_table, related_id, action_url],
  );
}

router.get("/notifications", async (req: Request, res: Response) => {
  const currentUser = readCurrentUser(req);
  const fallbackUserId = req.query.userid || req.query.userID;
  const userid = currentUser?.userid || currentUser?.userID || fallbackUserId;
  const role = currentUser?.role || req.query.role;

  if (!userid && !role) return res.status(401).json({ error: "Bạn cần đăng nhập để xem thông báo." });

  try {
    const result = await client.query(
      `SELECT notificationid, userid, target_role, title, message, type, related_table, related_id,
              action_url, is_read, createdat, read_at
       FROM notifications
       WHERE ($1::int IS NOT NULL AND userid = $1::int)
          OR ($2::text IS NOT NULL AND target_role = $2::text)
       ORDER BY createdat DESC
       LIMIT 50`,
      [userid || null, role || null],
    );

    const unread = result.rows.filter((item: any) => !item.is_read).length;
    return res.status(200).json({ data: result.rows, unread });
  } catch (error) {
    console.error("GET /notifications error:", error);
    return res.status(500).json({ error: "Không lấy được thông báo." });
  }
});

router.put("/notifications/:notificationID/read", async (req: Request, res: Response) => {
  const currentUser = readCurrentUser(req);
  const userid = currentUser?.userid || currentUser?.userID || req.body.userid || req.body.userID;

  try {
    await client.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE notificationid = $1 AND ($2::int IS NULL OR userid = $2::int)`,
      [req.params.notificationID, userid || null],
    );
    return res.status(200).json({ message: "Đã đánh dấu thông báo là đã đọc." });
  } catch (error) {
    console.error("PUT /notifications/:id/read error:", error);
    return res.status(500).json({ error: "Không cập nhật được thông báo." });
  }
});

router.put("/notifications/read-all", async (req: Request, res: Response) => {
  const currentUser = readCurrentUser(req);
  const userid = currentUser?.userid || currentUser?.userID || req.body.userid || req.body.userID;
  const role = currentUser?.role || req.body.role;

  if (!userid && !role) return res.status(401).json({ error: "Bạn cần đăng nhập." });

  try {
    await client.query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE ($1::int IS NOT NULL AND userid = $1::int)
          OR ($2::text IS NOT NULL AND target_role = $2::text)`,
      [userid || null, role || null],
    );
    return res.status(200).json({ message: "Đã đọc tất cả thông báo." });
  } catch (error) {
    console.error("PUT /notifications/read-all error:", error);
    return res.status(500).json({ error: "Không cập nhật được thông báo." });
  }
});

router.delete("/notifications/:notificationID", async (req: Request, res: Response) => {
  const currentUser = readCurrentUser(req);
  const userid = currentUser?.userid || currentUser?.userID || req.body.userid || req.body.userID;

  try {
    await client.query(
      `DELETE FROM notifications
       WHERE notificationid = $1 AND ($2::int IS NULL OR userid = $2::int)`,
      [req.params.notificationID, userid || null],
    );
    return res.status(200).json({ message: "Đã xóa thông báo." });
  } catch (error) {
    console.error("DELETE /notifications/:id error:", error);
    return res.status(500).json({ error: "Không xóa được thông báo." });
  }
});

export default router;
