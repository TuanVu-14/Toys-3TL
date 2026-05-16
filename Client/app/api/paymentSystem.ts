"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";

async function encrypt(key: string) {
  const encryptedKey = await sign({}, key);
  return encryptedKey;
}

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

type GiftOptions = {
  gift_wrapping?: boolean;
  gift_wrap_style?: string;
  gift_message?: string;
};

export default async function paymentGatewayHandler(
  productID: string | string[],
  userID: number
) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/create/payment/create-payment-intent`,
      { item: productID, userID },
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, clientSecret: response.data.clientSecret };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function checkoutProductDataHandler({
  productID,
  colorID,
  sizeID,
}: {
  productID: string;
  colorID: string;
  sizeID: string;
}) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.get(
      `${url}/api/checkout/product-details/${productID}/${sizeID}/${colorID}`,
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function orderStatusDataHandler({
  orderID,
}: {
  orderID: string | string[];
}) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(`${url}/api/orders/status/${orderID}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    });

    return { status: response.status };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function paymentOnDeliveryHandler({
  userid,
  productid,
  colorid,
  sizeid,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  userid: number;
  productid: string | string[];
  colorid: string | string[];
  sizeid: string | string[];
} & GiftOptions) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/payment-on-delivery/create-order`,
      { userid, productid, colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message },
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function cardCheckoutHandler({
  userid,
  productid,
  colorid,
  sizeid,
  paymentid,
  paymentStatus,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  userid: number;
  productid: string | string[];
  colorid: string | string[];
  sizeid: string | string[];
  paymentid: string;
  paymentStatus: string;
} & GiftOptions) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/card/create-order`,
      { userid, productid, colorid, sizeid, paymentid, paymentStatus, gift_wrapping, gift_wrap_style, gift_message },
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function checkoutCartProductDataHandler(userID: number) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.get(
      `${url}/api/checkout-cart/product-details/${userID}`,
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function cartCardCheckoutHandler({
  userID,
  paymentid,
  paymentstatus,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  userID: number;
  paymentid: string;
  paymentstatus: string;
} & GiftOptions) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/cart-card/create-order`,
      { userID, paymentid, paymentstatus, gift_wrapping, gift_wrap_style, gift_message },
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function cartCashCheckoutHandler({
  userID,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  userID: number;
} & GiftOptions) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/cart-payment-on-delivery/create-order`,
      { userID, gift_wrapping, gift_wrap_style, gift_message },
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function paymentGatewayCartHandler(userID: number) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/create/cart-payment/create-payment-intent`,
      { userID },
      { headers: { authorization: `Bearer ${sendingKey}` } }
    );
    return { status: response.status, clientSecret: response.data.clientSecret };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}
