import express, { Request, Response } from "express";
import { client } from "../data/DB";
import {
  orderCreationSchema,
  orderCreationSchema2,
  checkoutSchema,
  OrderIDSchema,
} from "../validators/productCheckoutValidator";
import { matchedData, validationResult } from "express-validator";

const router = express.Router();

const SHIPPING_CHARGE = 30000;
const COD_FEE = 15000;

const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100);

function getGiftOptions(req: Request) {
  return {
    gift_wrapping: req.body.gift_wrapping === true || req.body.gift_wrapping === "true",
    gift_wrap_style: req.body.gift_wrap_style || null,
    gift_message: req.body.gift_message || null,
  };
}

function getDeliveryDate(): string {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  return deliveryDate.toISOString().replace("T", " ").slice(0, 19);
}

async function getDefaultAddress(userid: number | string) {
  const addressResult = await client.query(
    `SELECT addressid FROM addresses WHERE userid = $1 AND is_default = true`,
    [userid]
  );
  return addressResult.rows[0]?.addressid;
}

async function getProductCheckoutData(productid: number | string, colorid: number | string, sizeid: number | string) {
  const productQuery = `
    SELECT p.title,
           p.price,
           COALESCE(p.discount, 0) AS discount,
           ROUND(p.price * (100 - COALESCE(p.discount, 0)) / 100) AS discountedprice,
           ps.sizename,
           pc.colorname,
           pi.imglink,
           pi.imgalt
    FROM products p
    JOIN productcolors pc ON pc.productid = p.productid AND pc.colorid = $2
    JOIN productsizes ps ON ps.productid = p.productid AND ps.sizeid = $3
    JOIN productimages pi ON pi.productid = p.productid AND pi.isprimary = true
    WHERE p.productid = $1 AND p.is_active = true
  `;
  const result = await client.query(productQuery, [productid, colorid, sizeid]);
  return result.rows[0];
}

async function createSingleProductOrder({
  userid,
  productid,
  colorid,
  sizeid,
  paymentMethod,
  paymentStatus,
  paymentFee,
  gatewayId,
  gift_wrapping,
  gift_wrap_style,
  gift_message,
}: {
  userid: number | string;
  productid: number | string;
  colorid: number | string;
  sizeid: number | string;
  paymentMethod: string;
  paymentStatus: string;
  paymentFee: number;
  gatewayId?: string | null;
  gift_wrapping: boolean;
  gift_wrap_style: string | null;
  gift_message: string | null;
}) {
  await client.query("BEGIN");
  try {
    const product = await getProductCheckoutData(productid, colorid, sizeid);
    if (!product) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Product not found" };
    }

    const addressid = await getDefaultAddress(userid);
    if (!addressid) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Address not found" };
    }

    const amount = Number(product.discountedprice);
    const totalAmount = amount + SHIPPING_CHARGE + paymentFee;
    const shippingid = IDGenerator();
    const paymentid = IDGenerator();
    const orderitemid = IDGenerator();
    const deliveryDate = getDeliveryDate();

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        userid, totalamount, orderstatus, order_code,
        is_gift, gift_message, gift_wrapping_type,
        order_status, delivery_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING orderid
      `,
      [
        userid,
        totalAmount,
        "Confirmed",
        "IN",
        gift_wrapping,
        gift_message,
        gift_wrap_style,
        "Confirmed",
        "Confirmed",
      ]
    );

    const orderid = orderResult.rows[0].orderid;
    const transactionid = `${paymentMethod.replace(/\s+/g, "-").toUpperCase()}-${orderid}-${paymentid}`;
    const trackingnumber = `IN${orderid}-${paymentid}`;

    await client.query(
      `
      INSERT INTO shipping (shippingid, orderid, addressid, shippingmethod, shippingcost, trackingnumber, deliveredat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [shippingid, orderid, addressid, "Giao hàng tiêu chuẩn", SHIPPING_CHARGE, trackingnumber, deliveryDate]
    );

    await client.query(
      `
      INSERT INTO payments (
        paymentid, orderid, paymentmethod, paymentstatus, amount,
        transactionid, billingaddress, paymentgateway_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [paymentid, orderid, paymentMethod, paymentStatus, amount, transactionid, addressid, gatewayId || null]
    );

    await client.query(
      `
      INSERT INTO orderitems (
        orderitemid, orderid, productid, quantity, shippingid, paymentid,
        colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [orderitemid, orderid, productid, 1, shippingid, paymentid, colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message]
    );

    await client.query(`UPDATE productparams SET sold = COALESCE(sold, 0) + 1 WHERE productid = $1`, [productid]);
    await client.query(`UPDATE products SET stock = GREATEST(stock - 1, 0), updatedat = CURRENT_TIMESTAMP WHERE productid = $1`, [productid]);

    await client.query("COMMIT");
    return { status: 200, orderid };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating order:", error);
    return { status: 500, error: "Internal Server Error" };
  }
}

router.get("/payment-methods", async (_req: Request, res: Response) => {
  try {
    const result = await client.query(
      `SELECT id, name, type, status, config FROM payment_methods WHERE status = true ORDER BY id ASC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/payment-on-delivery/create-order", orderCreationSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });

  const { userid, productid, colorid, sizeid } = matchedData(req);
  const gift = getGiftOptions(req);
  const created = await createSingleProductOrder({
    userid,
    productid,
    colorid,
    sizeid,
    paymentMethod: "Thanh toán khi nhận hàng",
    paymentStatus: "Pending",
    paymentFee: COD_FEE,
    ...gift,
  });

  if (created.status === 200) return res.status(200).json({ orderid: created.orderid });
  return res.status(created.status).json({ error: created.error });
});

router.post("/online/create-order", orderCreationSchema2, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });

  const { userid, productid, colorid, sizeid } = matchedData(req);
  const paymentMethod = String(req.body.paymentMethod || "Thanh toán online");
  const gift = getGiftOptions(req);
  const created = await createSingleProductOrder({
    userid,
    productid,
    colorid,
    sizeid,
    paymentMethod,
    paymentStatus: "Paid",
    paymentFee: 0,
    gatewayId: `DEMO-${Date.now()}`,
    ...gift,
  });

  if (created.status === 200) return res.status(200).json({ orderid: created.orderid });
  return res.status(created.status).json({ error: created.error });
});

router.get("/orders/status/:orderID", OrderIDSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });

  const { orderID } = matchedData(req);
  try {
    const orderResult = await client.query(
      `
      SELECT o.orderstatus, p.paymentstatus, p.paymentmethod
      FROM orders o
      LEFT JOIN payments p ON p.orderid = o.orderid
      WHERE o.orderid = $1
      `,
      [orderID]
    );

    if (orderResult.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    const { orderstatus, paymentstatus } = orderResult.rows[0];
    if (orderstatus === "Failed" || paymentstatus === "Failed") return res.sendStatus(210);
    if (paymentstatus === "Pending") return res.sendStatus(205);
    return res.sendStatus(200);
  } catch (error) {
    console.error("Error checking order status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/checkout/product-details/:productid/:sizeid/:colorid", checkoutSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });

  const { productid, sizeid, colorid } = matchedData(req);
  try {
    const productDetails = await getProductCheckoutData(productid, colorid, sizeid);
    if (!productDetails) return res.status(404).json({ error: "Product details not found" });

    return res.status(200).json({
      title: productDetails.title,
      price: productDetails.price,
      discount: productDetails.discount,
      discountedprice: productDetails.discountedprice,
      sizename: productDetails.sizename,
      colorname: productDetails.colorname,
      imglink: productDetails.imglink,
      imgalt: productDetails.imgalt,
      shippingcost: SHIPPING_CHARGE,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
