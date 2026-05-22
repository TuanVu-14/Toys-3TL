import express, { Request, Response } from "express";
import { client } from "../data/DB";
import { paymentCreationSchema, userIDSchema } from "../validators/cartCheckoutValidation";
import { validationResult, matchedData } from "express-validator";

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

function getDeliveryDate() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  return deliveryDate.toISOString().replace("T", " ").slice(0, 19);
}

async function fetchProductData(productid: string, colorid: string, sizeid: string, quantity: number) {
  const productQuery = `
    SELECT p.title,
           p.price,
           COALESCE(p.discount, 0) AS discount,
           ROUND(p.price * (100 - COALESCE(p.discount, 0)) / 100) AS discountedprice,
           p.stock,
           ps.sizename,
           pc.colorname,
           pi.imglink,
           pi.imgalt
    FROM products p
    JOIN productsizes ps ON ps.productid = p.productid AND ps.sizeid = $2
    JOIN productcolors pc ON pc.productid = p.productid AND pc.colorid = $3
    JOIN productimages pi ON pi.productid = p.productid AND pi.isprimary = true
    WHERE p.productid = $1 AND p.is_active = true
  `;
  const productResult = await client.query(productQuery, [productid, sizeid, colorid]);
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
  const result = await client.query(`SELECT addressid FROM addresses WHERE userid = $1 AND is_default = true`, [userid]);
  return result.rows[0]?.addressid;
}

router.get("/checkout-cart/product-details/:userID", userIDSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });
  const { userID } = matchedData(req);

  try {
    const selectedIDs = parseSelectedCartItemIDs(req.query.items);
    const filter = cartItemFilterClause(selectedIDs);
    const cartItems = await client.query(
      `SELECT cartitemid, productid, sizeid, colorid, quantity FROM cartitems WHERE userid = $1${filter.clause}`,
      [userID, ...filter.params]
    );
    if (cartItems.rows.length === 0) return res.status(404).json({ error: "cart items not found" });

    const products = await Promise.all(
      cartItems.rows.map((each) => fetchProductData(each.productid, each.colorid, each.sizeid, each.quantity))
    );
    const validProducts = products.filter(Boolean);
    if (validProducts.length === 0) return res.status(404).json({ error: "Product details not found" });

    return res.status(200).json({ products: validProducts });
  } catch (error) {
    console.error("Error fetching cart checkout details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
      `SELECT cartitemid, productid, sizeid, colorid, quantity FROM cartitems WHERE userid = $1${filter.clause}`,
      [userID, ...filter.params]
    );
    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: 404, error: "cart items not found" };
    }

    const addressid = await getDefaultAddress(userID);
    if (!addressid) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Address not found" };
    }

    let itemsAmount = 0;
    let totalShipping = 0;
    const orderItems: any[] = [];

    for (const item of cartItems.rows) {
      const product = await fetchProductData(item.productid, item.colorid, item.sizeid, item.quantity);
      if (!product) continue;
      if (Number(product.stock || 0) < Number(item.quantity)) {
        await client.query("ROLLBACK");
        return { status: 409, error: "Not enough stock" };
      }
      const lineAmount = Number(product.discountedprice) * Number(item.quantity);
      itemsAmount += lineAmount;
      totalShipping += SHIPPING_CHARGE * Number(item.quantity);
      orderItems.push({ ...item, lineAmount });
    }

    if (orderItems.length === 0) {
      await client.query("ROLLBACK");
      return { status: 404, error: "Product details not found" };
    }

    const totalAmount = itemsAmount + totalShipping + paymentFee;
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
      [userID, totalAmount, "Confirmed", "IN", gift_wrapping, gift_message, gift_wrap_style, "Confirmed", "Confirmed"]
    );

    const orderid = orderResult.rows[0].orderid;
    const shippingid = IDGenerator();
    const paymentid = IDGenerator();
    const transactionid = `${paymentMethod.replace(/\s+/g, "-").toUpperCase()}-${orderid}-${paymentid}`;
    const trackingnumber = `IN${orderid}-${paymentid}`;

    await client.query(
      `INSERT INTO shipping (shippingid, orderid, addressid, shippingmethod, shippingcost, trackingnumber, deliveredat)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [shippingid, orderid, addressid, "Giao hàng tiêu chuẩn", totalShipping, trackingnumber, getDeliveryDate()]
    );

    await client.query(
      `INSERT INTO payments (paymentid, orderid, paymentmethod, paymentstatus, amount, transactionid, billingaddress, paymentgateway_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [paymentid, orderid, paymentMethod, paymentStatus, itemsAmount, transactionid, addressid, paymentStatus === "Paid" ? `DEMO-${Date.now()}` : null]
    );

    for (const item of orderItems) {
      const orderitemid = IDGenerator();
      await client.query(
        `
        INSERT INTO orderitems (
          orderitemid, orderid, productid, quantity, shippingid, paymentid,
          colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          orderitemid,
          orderid,
          item.productid,
          item.quantity,
          shippingid,
          paymentid,
          item.colorid,
          item.sizeid,
          gift_wrapping,
          gift_wrap_style,
          gift_message,
        ]
      );
      await client.query(`UPDATE productparams SET sold = COALESCE(sold, 0) + $2 WHERE productid = $1`, [item.productid, item.quantity]);
      await client.query(`UPDATE products SET stock = GREATEST(stock - $2, 0), updatedat = CURRENT_TIMESTAMP WHERE productid = $1`, [item.productid, item.quantity]);
    }

    if (selectedIDs.length > 0) {
      await client.query(`DELETE FROM cartitems WHERE userid = $1 AND cartitemid = ANY($2::int[])`, [userID, selectedIDs]);
    } else {
      await client.query(`DELETE FROM cartitems WHERE userid = $1`, [userID]);
    }
    await client.query("COMMIT");
    return { status: 200, orderid };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating cart order:", error);
    return { status: 500, error: "Internal Server Error" };
  }
}

router.post("/cart-payment-on-delivery/create-order", userIDSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });
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

  if (created.status === 200) return res.status(200).json({ orderid: created.orderid, message: "Successfully created order" });
  return res.status(created.status).json({ error: created.error });
});

router.post("/cart-online/create-order", paymentCreationSchema, async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ message: "Validation error", errors: result.array() });
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

  if (created.status === 200) return res.status(200).json({ orderid: created.orderid, message: "Successfully created order" });
  return res.status(created.status).json({ error: created.error });
});

export default router;
