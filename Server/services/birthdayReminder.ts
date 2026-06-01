import { client } from "../data/DB";
import { SMTP } from "../data/SMTP";

type ChildBirthdayRow = {
  child_id: number;
  user_id: number;
  child_name: string;
  birth_date: string;
  gender: string | null;
  favorite_category: string | null;
  favorite_skill: string | null;
  username: string;
  email: string;
};

function removeVietnameseTones(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function makeSafeName(name: string) {
  return (
    removeVietnameseTones(name || "BE")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10) || "BE"
  );
}

function getNextBirthday(birthDateValue: string) {
  const today = new Date();
  const birthDate = new Date(birthDateValue);

  let nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (nextBirthday < todayStart) {
    nextBirthday = new Date(
      today.getFullYear() + 1,
      birthDate.getMonth(),
      birthDate.getDate(),
    );
  }

  return nextBirthday;
}

function getDaysUntil(date: Date) {
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diff = targetDate.getTime() - startToday.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDateVi(date: Date) {
  return date.toLocaleDateString("vi-VN");
}

function getAgeAtBirthday(birthDateValue: string, birthdayDate: Date) {
  const birthDate = new Date(birthDateValue);
  return birthdayDate.getFullYear() - birthDate.getFullYear();
}

function buildGiftSuggestion(age: number, favoriteSkill?: string | null) {
  const skillText = favoriteSkill ? `, ưu tiên nhóm phát triển ${favoriteSkill}` : "";

  if (age <= 3) {
    return `Gợi ý quà: đồ chơi vận động, khối xếp hình lớn, đồ chơi âm thanh${skillText}.`;
  }

  if (age <= 6) {
    return `Gợi ý quà: LEGO cơ bản, đồ chơi nhập vai, đất nặn, bộ nhà bếp${skillText}.`;
  }

  if (age <= 10) {
    return `Gợi ý quà: LEGO sáng tạo, STEM, mô hình lắp ráp, board game tư duy${skillText}.`;
  }

  return `Gợi ý quà: LEGO nâng cao, robot STEM, mô hình điều khiển, bộ lắp ráp kỹ thuật${skillText}.`;
}

async function sendBirthdayEmail({
  email,
  username,
  childName,
  birthdayDate,
  code,
  discountPercentage,
  minPurchaseAmount,
  maxDiscountAmount,
  validUntil,
  giftSuggestion,
}: {
  email: string;
  username: string;
  childName: string;
  birthdayDate: Date;
  code: string;
  discountPercentage: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number;
  validUntil: Date;
  giftSuggestion: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
    return false;
  }

  await SMTP.sendMail({
    from: `"Toys 3TL" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Bé ${childName} sắp sinh nhật - Toys 3TL gửi tặng mã giảm giá`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Xin chào ${username || "quý khách"},</h2>
        <p>Bé <b>${childName}</b> sắp đến sinh nhật vào ngày <b>${formatDateVi(birthdayDate)}</b>.</p>
        <p>Toys 3TL gửi tặng gia đình mã giảm giá sinh nhật:</p>
        <div style="padding: 14px 18px; border: 2px dashed #f97316; display: inline-block; font-size: 22px; font-weight: bold; color: #ea580c;">
          ${code}
        </div>
        <p>
          Giảm <b>${discountPercentage}%</b>, áp dụng cho đơn hàng từ
          <b>${minPurchaseAmount.toLocaleString("vi-VN")}đ</b>.
          Giảm tối đa <b>${maxDiscountAmount.toLocaleString("vi-VN")}đ</b>.
        </p>
        <p>Hạn sử dụng đến: <b>${formatDateVi(validUntil)}</b>.</p>
        <p>${giftSuggestion}</p>
        <p>Chúc bé có một sinh nhật thật vui vẻ!</p>
        <p><b>Toys 3TL</b></p>
      </div>
    `,
  });

  return true;
}

export async function runBirthdayReminder(daysBefore = 7) {
  const childrenResult = await client.query<ChildBirthdayRow>(`
    SELECT
      cp.child_id,
      cp.user_id,
      cp.child_name,
      cp.birth_date,
      cp.gender,
      cp.favorite_category,
      cp.favorite_skill,
      u.username,
      u.email
    FROM public.child_profiles cp
    INNER JOIN public.users u ON u.userid = cp.user_id
    WHERE cp.birth_date IS NOT NULL
      AND COALESCE(u.is_active, true) = true
  `);

  let createdCount = 0;
  let skippedCount = 0;
  let emailCount = 0;

  for (const child of childrenResult.rows) {
    const birthdayDate = getNextBirthday(child.birth_date);
    const daysUntilBirthday = getDaysUntil(birthdayDate);

    if (daysUntilBirthday < 0 || daysUntilBirthday > daysBefore) {
      skippedCount++;
      continue;
    }

    const reminderYear = birthdayDate.getFullYear();

    const existed = await client.query(
      `
        SELECT reminder_id
        FROM public.birthday_reminder_logs
        WHERE child_id = $1
          AND reminder_year = $2
        LIMIT 1
      `,
      [child.child_id, reminderYear],
    );

    if (existed.rows.length > 0) {
      skippedCount++;
      continue;
    }

    const age = getAgeAtBirthday(child.birth_date, birthdayDate);
    const discountPercentage = 20;
    const minPurchaseAmount = 200000;
    const maxDiscountAmount = 100000;
    const validUntil = new Date(birthdayDate);
    validUntil.setDate(validUntil.getDate() + 7);

    const code = `SN-${makeSafeName(child.child_name)}-${child.child_id}-${reminderYear}`;

    const couponResult = await client.query(
      `
        INSERT INTO public.coupons (
          code,
          description,
          discountpercentage,
          maxdiscountamount,
          minpurchaseamount,
          validfrom,
          validuntil,
          event_type,
          is_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          CURRENT_TIMESTAMP,
          $6,
          'birthday',
          true
        )
        ON CONFLICT (code)
        DO UPDATE SET
          description = EXCLUDED.description,
          discountpercentage = EXCLUDED.discountpercentage,
          maxdiscountamount = EXCLUDED.maxdiscountamount,
          minpurchaseamount = EXCLUDED.minpurchaseamount,
          validuntil = EXCLUDED.validuntil,
          event_type = 'birthday',
          is_active = true,
          updatedat = CURRENT_TIMESTAMP
        RETURNING couponid, code
      `,
      [
        code,
        `Mã giảm giá sinh nhật cho bé ${child.child_name}`,
        discountPercentage,
        maxDiscountAmount,
        minPurchaseAmount,
        validUntil,
      ],
    );

    const coupon = couponResult.rows[0];

    const userCouponExisted = await client.query(
      `
        SELECT usercouponid
        FROM public.usercoupons
        WHERE userid = $1
          AND couponid = $2
        LIMIT 1
      `,
      [child.user_id, coupon.couponid],
    );

    if (userCouponExisted.rows.length === 0) {
      await client.query(
        `
          INSERT INTO public.usercoupons (
            userid,
            couponid,
            child_id,
            is_used
          )
          VALUES ($1, $2, $3, false)
        `,
        [child.user_id, coupon.couponid, child.child_id],
      );
    }

    const giftSuggestion = buildGiftSuggestion(age, child.favorite_skill);

    const notificationTitle = `Bé ${child.child_name} sắp sinh nhật`;
    const notificationMessage =
      `Toys 3TL gửi tặng mã ${coupon.code} giảm ${discountPercentage}% cho sinh nhật bé ${child.child_name}. ` +
      `Mã dùng đến ${formatDateVi(validUntil)}. ${giftSuggestion}`;

    const notificationResult = await client.query(
      `
        INSERT INTO public.notifications (
          userid,
          title,
          message,
          type,
          related_table,
          related_id,
          action_url
        )
        VALUES (
          $1,
          $2,
          $3,
          'birthday',
          'coupons',
          $4,
          '/account-settings'
        )
        RETURNING notificationid
      `,
      [child.user_id, notificationTitle, notificationMessage, coupon.couponid],
    );

    let emailSent = false;

    try {
      emailSent = await sendBirthdayEmail({
        email: child.email,
        username: child.username,
        childName: child.child_name,
        birthdayDate,
        code: coupon.code,
        discountPercentage,
        minPurchaseAmount,
        maxDiscountAmount,
        validUntil,
        giftSuggestion,
      });
    } catch (error) {
      console.error("Birthday email error:", error);
    }

    if (emailSent) emailCount++;

    await client.query(
      `
        INSERT INTO public.birthday_reminder_logs (
          user_id,
          child_id,
          couponid,
          notificationid,
          reminder_year,
          birthday_date,
          days_before,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (child_id, reminder_year)
        DO NOTHING
      `,
      [
        child.user_id,
        child.child_id,
        coupon.couponid,
        notificationResult.rows[0]?.notificationid || null,
        reminderYear,
        birthdayDate,
        daysBefore,
        emailSent ? "notification_and_email_created" : "notification_created",
      ],
    );

    createdCount++;
  }

  return {
    checked: childrenResult.rows.length,
    created: createdCount,
    skipped: skippedCount,
    emails: emailCount,
  };
}

let birthdayJobStarted = false;

export function startBirthdayReminderJob() {
  if (birthdayJobStarted) return;
  birthdayJobStarted = true;

  const run = async () => {
    try {
      const result = await runBirthdayReminder(7);
      console.log("[birthday-reminder] done:", result);
    } catch (error) {
      console.error("[birthday-reminder] error:", error);
    }
  };

  setTimeout(run, 5000);
  setInterval(run, 24 * 60 * 60 * 1000);
}
