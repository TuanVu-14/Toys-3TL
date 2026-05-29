import express, { Request, Response } from "express";
import { client } from "../data/DB";
import { paymentCreationSchema, userIDSchema } from "../validators/cartCheckoutValidation";
import { validationResult, matchedData } from "express-validator";
import { createRoleNotification, createUserNotification } from "./notifications";

const router = express.Router();
const SHIPPING_CHARGE = 30000;
const COD_FEE = 15000;
const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100);

async function safeCreateNotification(task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    console.error("Notification creation failed, order will continue:", error);
  }
}

function getGiftOptions(req: Request) {
  return {
    gift_wrapping: req.body.gift_wrapping === true || req.body.gift_wrapping === "true",
    gift_wrap_style: req.body.gift_wrap_style || null,
    gift_message: req.body.gift_message || null,
  };
}

function getDeliveryDate() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  return deliveryDate.toISOString().replace("T", " ").slice(0, 19);
}

async function fetchProductData(productid: string, quantity: number) {
  const productQuery = `
    SELECT p.productid,
           p.title,
           p.price,
           COALESCE(p.discount, 0) AS discount,
           ROUND(p.price * (100 - COALESCE(p.discount, 0)) / 100, 2) AS discountedprice,
           p.stock,
           pi.imglink,
           pi.imgalt
    FROM products p
    LEFT JOIN productimages pi ON pi.productid = p.productid AND pi.isprimary = true
    WHERE p.productid = $1::int AND COALESCE(p.is_active, true) = true
    LIMIT 1
  `;
  const productResult = await client.query(productQuery, [productid]);
  if (productResult.rows.length === 0) return null;
  return { ...productResult.rows[0], shippingcost: SHIPPING_CHARGE, quantity };
}

function parseSelectedCartItemIDs(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter((id) => Number.isInteger(id) && id > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  return [];
}

function cartItemFilterClause(selectedIDs: number[]) {
  if (selectedIDs.length === 0) {
    return { clause: "", params: [] as unknown[] };
  }

  return {
    clause: ` AND cartitemid = ANY($2::int[])`,
    params: [selectedIDs],
  };
}

async function getDefaultAddress(userid: number | string) {
  const result = await client.query(`SELECT addressid FROM addresses WHERE userid = $1::int AND COALESCE(is_default, false) = true`, [userid]);
  return result.rows[0]?.addressid;
}

router.get("/checkout-cart/product-details/:userID", userIDSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: result.array() });
  const { userID } = matchedData(req);

  try {
    const selectedIDs = parseSelectedCartItemIDs(req.query.items);
    const filter = cartItemFilterClause(selectedIDs);
    const cartItems = await client.query(
      `SELECT cartitemid, productid, quantity FROM cartitems WHERE userid = $1::int${filter.clause}`,
      [userID, ...filter.params],
    );
    if (cartItems.rows.length === 0) return res.status(404).json({ error: "Không có sản phẩm nào trong giỏ hàng." });

    const products = await Promise.all(
      cartItems.rows.map((each) => fetchProductData(each.productid, each.quantity)),
    );
    const validProducts = products.filter(Boolean);
    if (validProducts.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });

    return res.status(200).json({ products: validProducts });
  } catch (error) {
    console.error("Error fetching cart checkout details:", error);
    return res.status(500).json({ error: "Lỗi máy chủ khi lấy dữ liệu thanh toán giỏ hàng." });
  }
});

async function createCartOrder({
  userID,
  paymentMethod,
  paymentStatus,
  paymentFee,
  gift_wrapping,
  gift_wrap_style,
  gift_message,
  cartItemIDs = [],
}: {
  userID: string | number;
  paymentMethod: string;
  paymentStatus: string;
  paymentFee: number;
  gift_wrapping: boolean;
  gift_wrap_style: string | null;
  gift_message: string | null;
  cartItemIDs?: number[];
}) {
  await client.query("BEGIN");
  try {
    const selectedIDs = cartItemIDs.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0).map(Number);
    const filter = cartItemFilterClause(selectedIDs);
    const cartItems = await client.query(
      `SELECT cartitemid, productid, quantity FROM cartitems WHERE userid = $1::int${filter.clause}`,
      [userID, ...filter.params],
    );
    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Không có sản phẩm nào trong giỏ hàng." };
    }

    const addressid = await getDefaultAddress(userID);
    if (!addressid) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Bạn chưa có địa chỉ giao hàng mặc định." };
    }

    let itemsAmount = 0;
    let totalShipping = 0;
    const orderItems: any[] = [];

    for (const item of cartItems.rows) {
      const product = await fetchProductData(item.productid, item.quantity);
      if (!product) continue;
      if (Number(product.stock || 0) < Number(item.quantity)) {
        await client.query("ROLLBACK");
        return { status: 409, error: "Số lượng mua vượt quá số lượng còn trong kho." };
      }
      const lineAmount = Number(product.discountedprice) * Number(item.quantity);
      itemsAmount += lineAmount;
      totalShipping += SHIPPING_CHARGE * Number(item.quantity);
      orderItems.push({ ...item, lineAmount });
    }

    if (orderItems.length === 0) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Không tìm thấy sản phẩm." };
    }

    const totalAmount = Math.round((itemsAmount + totalShipping + paymentFee) * 100) / 100;
    const orderResult = await client.query(
      `
      INSERT INTO orders (
        userid, totalamount, orderstatus, order_code,
        is_gift, gift_message, gift_wrapping_type
      )
      VALUES ($1::int, $2::numeric(18,2), $3::varchar, $4::varchar, $5::boolean, $6::text, $7::varchar)
      RETURNING orderid
      `,
      [userID, totalAmount, "Pending", "IN", gift_wrapping, gift_message, gift_wrap_style],
    );

    const orderid = orderResult.rows[0].orderid;
    const shippingid = IDGenerator();
    const paymentid = IDGenerator();
    const transactionid = `${paymentMethod.replace(/\s+/g, "-").toUpperCase()}-${orderid}-${paymentid}`;
    const trackingnumber = `IN${orderid}-${paymentid}`;

    await client.query(
      `INSERT INTO shipping (shippingid, orderid, addressid, shippingmethod, shippingcost, trackingnumber, deliveredat)
       VALUES ($1::int, $2::int, $3::int, $4::varchar, $5::numeric(18,2), $6::varchar, $7::timestamp)`,
      [shippingid, orderid, addressid, "Giao hàng tiêu chuẩn", totalShipping, trackingnumber, getDeliveryDate()],
    );

    await client.query(
      `INSERT INTO payments (paymentid, orderid, paymentmethod, paymentstatus, amount, transactionid, billingaddress, paymentgateway_id)
       VALUES ($1::int, $2::int, $3::varchar, $4::varchar, $5::numeric(18,2), $6::varchar, $7::int, $8::varchar)`,
      [paymentid, orderid, paymentMethod, paymentStatus, itemsAmount, transactionid, addressid, paymentStatus === "Paid" ? `DEMO-${Date.now()}` : null],
    );

    for (const item of orderItems) {
      const orderitemid = IDGenerator();
      await client.query(
        `
        INSERT INTO orderitems (
          orderitemid, orderid, productid, quantity, shippingid, paymentid,
          gift_wrapping, gift_wrap_style, gift_message
        )
        VALUES ($1::int, $2::int, $3::int, $4::int, $5::int, $6::int, $7::boolean, $8::text, $9::text)
        `,
        [
          orderitemid,
          orderid,
          item.productid,
          item.quantity,
          shippingid,
          paymentid,
          gift_wrapping,
          gift_wrap_style,
          gift_message,
        ],
      );
      await client.query(`UPDATE productparams SET sold = COALESCE(sold, 0) + $2::int WHERE productid = $1::int`, [item.productid, item.quantity]);
      // Không trừ stock lần nữa ở đây vì lego13.sql đã có trigger trg_orderitems_update_stock.
    }

    if (selectedIDs.length > 0) {
      await client.query(`DELETE FROM cartitems WHERE userid = $1::int AND cartitemid = ANY($2::int[])`, [userID, selectedIDs]);
    } else {
      await client.query(`DELETE FROM cartitems WHERE userid = $1::int`, [userID]);
    }


    await safeCreateNotification(() => createUserNotification({
      userid: userID,
      title: `Đặt hàng thành công #${orderid}`,
      message: `Bạn đã đặt ${orderItems.length} dòng sản phẩm. Tổng thanh toán là ${totalAmount.toLocaleString("vi-VN")}đ.`,
      type: "order",
      related_table: "orders",
      related_id: orderid,
      action_url: `/order-detail/${orderid}`,
    }));

    await safeCreateNotification(() => createRoleNotification({
      role: "sales_staff",
      title: `Đơn hàng giỏ hàng mới #${orderid}`,
      message: "Khách hàng vừa đặt đơn từ giỏ hàng, cần xác nhận đơn.",
      type: "order",
      related_table: "orders",
      related_id: orderid,
      action_url: `/admin/orders?orderid=${orderid}`,
    }));

    await safeCreateNotification(() => createRoleNotification({
      role: "warehouse_manager",
      title: `Có đơn hàng cần xử lý #${orderid}`,
      message: "Kiểm tra tồn kho, đóng gói và cập nhật trạng thái giao hàng.",
      type: "warehouse",
      related_table: "orders",
      related_id: orderid,
      action_url: `/admin/warehouse?orderid=${orderid}`,
    }));

    await safeCreateNotification(() => createRoleNotification({
      role: "admin",
      title: `Hệ thống ghi nhận đơn hàng #${orderid}`,
      message: "Có đơn hàng mới phát sinh trong hệ thống.",
      type: "system",
      related_table: "orders",
      related_id: orderid,
      action_url: `/admin/orders?orderid=${orderid}`,
    }));

    await client.query("COMMIT");
    return { status: 200, orderid };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating cart order:", error);
    return { status: 500, error: error?.message?.includes("inconsistent types") ? "Database đang còn trigger/câu SQL cũ gây lỗi kiểu dữ liệu. Hãy chạy file SQL fix trong thư mục db rồi thử lại." : error?.message?.includes("numeric") ? "Tổng tiền vượt giới hạn cột tiền. Hãy chạy file SQL fix numeric(18,2)." : "Không tạo được đơn hàng. Vui lòng thử lại." };
  }
}

router.post("/cart-payment-on-delivery/create-order", userIDSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: result.array() });
  const { userID } = matchedData(req);
  const cartItemIDs = parseSelectedCartItemIDs(req.body.cartItemIDs);
  const gift = getGiftOptions(req);

  const created = await createCartOrder({
    userID,
    paymentMethod: "Thanh toán khi nhận hàng",
    paymentStatus: "Pending",
    paymentFee: COD_FEE,
    cartItemIDs,
    ...gift,
  });

  if (created.status === 200) return res.status(200).json({ orderid: created.orderid, message: "Tạo đơn hàng thành công" });
  return res.status(created.status).json({ error: created.error });
});

router.post("/cart-online/create-order", paymentCreationSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: result.array() });
  const { userID } = matchedData(req);
  const cartItemIDs = parseSelectedCartItemIDs(req.body.cartItemIDs);
  const gift = getGiftOptions(req);
  const paymentMethod = String(req.body.paymentMethod || "Thanh toán online");

  const created = await createCartOrder({
    userID,
    paymentMethod,
    paymentStatus: "Paid",
    paymentFee: 0,
    cartItemIDs,
    ...gift,
  });

  if (created.status === 200) return res.status(200).json({ orderid: created.orderid, message: "Tạo đơn hàng thành công" });
  return res.status(created.status).json({ error: created.error });
});

export default router;
