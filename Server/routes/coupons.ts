import express, { Request, Response } from "express";
import { client } from "../data/DB";

const router = express.Router();
const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100);

function generateBirthdayCouponCode(childName: string) {
  const safeName = (childName || "KID")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return `BDAY-${safeName}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function normalizeCode(code: unknown) {
  return String(code || "").trim().toUpperCase();
}

function calculateDiscount(amount: number, percent: number, maxDiscount?: number | null) {
  const rawDiscount = Math.round((amount * percent) / 100);
  const maxValue = Number(maxDiscount || 0);
  if (maxValue > 0) return Math.min(rawDiscount, maxValue);
  return rawDiscount;
}

router.post("/apply", async (req: Request, res: Response) => {
  try {
    const code = normalizeCode(req.body.code);
    const userID = Number(req.body.userID || req.body.userid || 0);
    const amount = Number(req.body.amount || 0);

    if (!code) return res.status(400).json({ valid: false, error: "Vui lòng nhập mã giảm giá" });
    if (!userID) return res.status(400).json({ valid: false, error: "Bạn cần đăng nhập để dùng mã" });
    if (amount <= 0) return res.status(400).json({ valid: false, error: "Tổng tiền không hợp lệ" });

    const coupon = await client.query(
      `
        SELECT couponid, code, description, discountpercentage, maxdiscountamount,
               minpurchaseamount, validfrom, validuntil
        FROM coupons
        WHERE UPPER(code) = $1
        LIMIT 1
      `,
      [code],
    );

    if (coupon.rows.length > 0) {
      const row = coupon.rows[0];
      const minPurchase = Number(row.minpurchaseamount || 0);
      const validFrom = row.validfrom ? new Date(row.validfrom) : null;
      const validUntil = row.validuntil ? new Date(row.validuntil) : null;
      const now = new Date();

      if (validFrom && validFrom > now) {
        return res.status(400).json({ valid: false, error: "Mã giảm giá chưa đến ngày sử dụng" });
      }

      if (validUntil && validUntil < now) {
        return res.status(400).json({ valid: false, error: "Mã giảm giá đã hết hạn" });
      }

      if (amount < minPurchase) {
        return res.status(400).json({
          valid: false,
          error: `Đơn hàng cần tối thiểu ${minPurchase.toLocaleString("vi-VN")}đ để dùng mã này`,
        });
      }

      const discountPercent = Number(row.discountpercentage || 0);
      const discountAmount = calculateDiscount(amount, discountPercent, row.maxdiscountamount);

      return res.status(200).json({
        valid: true,
        source: "coupons",
        couponID: row.couponid,
        code: row.code,
        description: row.description,
        discountPercent,
        discountAmount,
        message: `Đã áp dụng mã ${row.code}, giảm ${discountAmount.toLocaleString("vi-VN")}đ`,
      });
    }

    const birthdayCoupon = await client.query(
      `
        SELECT coupon_id, code, discount_percent, expires_at
        FROM birthday_coupons
        WHERE UPPER(code) = $1 AND user_id = $2
        LIMIT 1
      `,
      [code, userID],
    );

    if (birthdayCoupon.rows.length > 0) {
      const row = birthdayCoupon.rows[0];
      const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
      if (expiresAt && expiresAt < new Date()) {
        return res.status(400).json({ valid: false, error: "Mã sinh nhật đã hết hạn" });
      }

      const discountPercent = Number(row.discount_percent || 0);
      const discountAmount = calculateDiscount(amount, discountPercent, null);

      return res.status(200).json({
        valid: true,
        source: "birthday_coupons",
        couponID: row.coupon_id,
        code: row.code,
        discountPercent,
        discountAmount,
        message: `Đã áp dụng mã sinh nhật ${row.code}, giảm ${discountAmount.toLocaleString("vi-VN")}đ`,
      });
    }

    return res.status(404).json({ valid: false, error: "Mã giảm giá không tồn tại hoặc không thuộc tài khoản này" });
  } catch (error) {
    console.error("POST /coupons/apply error:", error);
    return res.status(500).json({ valid: false, error: "Lỗi khi áp dụng mã giảm giá" });
  }
});

router.post("/child-profile", async (req: Request, res: Response) => {
  try {
    const { user_id, child_name, birth_date, gender } = req.body;
    if (!user_id || !child_name || !birth_date) {
      return res.status(400).json({ message: "Thiếu user_id, child_name hoặc birth_date" });
    }

    const result = await client.query(
      `
        INSERT INTO child_profiles (user_id, child_name, birth_date, gender)
        VALUES ($1, $2, $3, $4)
        RETURNING child_id, user_id, child_name, birth_date, gender, created_at
      `,
      [user_id, child_name, birth_date, gender || null],
    );

    return res.status(201).json({ message: "Đã lưu hồ sơ bé", data: result.rows[0] });
  } catch (error) {
    console.error("POST /coupons/child-profile error:", error);
    return res.status(500).json({ message: "Lỗi khi lưu hồ sơ bé" });
  }
});

router.get("/child-profiles/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await client.query(
      `
        SELECT child_id, user_id, child_name, birth_date, gender, created_at
        FROM child_profiles
        WHERE user_id = $1
        ORDER BY birth_date ASC
      `,
      [userId],
    );
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("GET /coupons/child-profiles/:userId error:", error);
    return res.status(500).json({ message: "Lỗi khi lấy hồ sơ bé" });
  }
});

router.get("/birthday/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const childrenResult = await client.query(
      `SELECT child_id, child_name, birth_date, gender FROM child_profiles WHERE user_id = $1`,
      [userId],
    );

    const today = new Date();
    const upcomingChildren = childrenResult.rows.filter((child) => {
      const birthDate = new Date(child.birth_date);
      const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      const diffTime = birthdayThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    const coupons = [];
    for (const child of upcomingChildren) {
      const existing = await client.query(
        `
          SELECT coupon_id, code, discount_percent, expires_at
          FROM birthday_coupons
          WHERE user_id = $1 AND child_id = $2 AND expires_at >= CURRENT_DATE
          LIMIT 1
        `,
        [userId, child.child_id],
      );

      if (existing.rows.length > 0) {
        coupons.push({ child, coupon: existing.rows[0] });
        continue;
      }

      const couponId = IDGenerator();
      const code = generateBirthdayCouponCode(child.child_name);
      const discountPercent = 10;
      const couponResult = await client.query(
        `
          INSERT INTO birthday_coupons (coupon_id, user_id, child_id, code, discount_percent, expires_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '14 days')
          RETURNING coupon_id, code, discount_percent, expires_at
        `,
        [couponId, userId, child.child_id, code, discountPercent],
      );
      coupons.push({ child, coupon: couponResult.rows[0] });
    }

    return res.status(200).json({ message: "Birthday coupons checked", data: coupons });
  } catch (error) {
    console.error("GET /coupons/birthday/:userId error:", error);
    return res.status(500).json({ message: "Lỗi khi kiểm tra sinh nhật" });
  }
});

router.get("/gift-suggestions/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const childrenResult = await client.query(
      `
        SELECT child_id, child_name, birth_date, gender
        FROM child_profiles
        WHERE user_id = $1
        ORDER BY birth_date ASC
        LIMIT 1
      `,
      [userId],
    );

    if (childrenResult.rows.length === 0) {
      const fallback = await client.query(
        `
          SELECT productid, title, price, discount, age_group, brand, skill_type, material
          FROM products
          ORDER BY productid DESC
          LIMIT 12
        `,
      );
      return res.status(200).json({ message: "Chưa có hồ sơ bé, trả về sản phẩm gợi ý chung", data: fallback.rows });
    }

    const child = childrenResult.rows[0];
    const birthDate = new Date(child.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

    let ageGroup = "12+";
    if (age <= 3) ageGroup = "0-3";
    else if (age <= 6) ageGroup = "3-6";
    else if (age <= 12) ageGroup = "6-12";

    const suggestions = await client.query(
      `
        SELECT productid, title, price, discount, age_group, brand, skill_type, material
        FROM products
        WHERE age_group = $1 OR age_group IS NULL
        ORDER BY productid DESC
        LIMIT 12
      `,
      [ageGroup],
    );

    return res.status(200).json({ child, age, age_group: ageGroup, data: suggestions.rows });
  } catch (error) {
    console.error("GET /coupons/gift-suggestions/:userId error:", error);
    return res.status(500).json({ message: "Lỗi khi gợi ý quà tặng" });
  }
});

export default router;
