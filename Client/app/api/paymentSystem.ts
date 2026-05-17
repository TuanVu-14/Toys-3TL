"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

async function encrypt(key: string) {
  return sign({}, key);
}

type GiftOptions = {
  gift_wrapping?: boolean;
  gift_wrap_style?: string;
  gift_message?: string;
};

export type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  status: boolean;
  config?: {
    provider?: string;
    fee?: number;
    description?: string;
    icon?: string;
    qrImageUrl?: string;
    qrPayload?: string;
    bankBin?: string;
    bankAccount?: string;
    bankAccountName?: string;
    storeName?: string;
  };
};

async function authHeaders() {
  const sendingKey = await encrypt(authKey);
  return { authorization: `Bearer ${sendingKey}` };
}

export async function paymentMethodsHandler() {
  try {
    const response = await axios.get(`${url}/api/payment-methods`, {
      headers: await authHeaders(),
    });
    return { status: response.status, data: response.data as PaymentMethod[] };
  } catch (error) {
    return { status: 500, data: [] as PaymentMethod[], error: "Internal Server Error" };
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
  try {
    const response = await axios.get(
      `${url}/api/checkout/product-details/${productID}/${sizeID}/${colorID}`,
      { headers: await authHeaders() }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function orderStatusDataHandler({ orderID }: { orderID: string | string[] }) {
  try {
    const response = await axios.get(`${url}/api/orders/status/${orderID}`, {
      headers: await authHeaders(),
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
  try {
    const response = await axios.post(
      `${url}/api/payment-on-delivery/create-order`,
      { userid, productid, colorid, sizeid, gift_wrapping, gift_wrap_style, gift_message },
      { headers: await authHeaders() }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function onlineCheckoutHandler({
  userid,
  productid,
  colorid,
  sizeid,
  paymentMethod,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  userid: number;
  productid: string | string[];
  colorid: string | string[];
  sizeid: string | string[];
  paymentMethod: string;
} & GiftOptions) {
  try {
    const response = await axios.post(
      `${url}/api/online/create-order`,
      {
        userid,
        productid,
        colorid,
        sizeid,
        paymentMethod,
        gift_wrapping,
        gift_wrap_style,
        gift_message,
      },
      { headers: await authHeaders() }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function checkoutCartProductDataHandler(userID: number) {
  try {
    const response = await axios.get(`${url}/api/checkout-cart/product-details/${userID}`, {
      headers: await authHeaders(),
    });
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
  try {
    const response = await axios.post(
      `${url}/api/cart-payment-on-delivery/create-order`,
      { userID, gift_wrapping, gift_wrap_style, gift_message },
      { headers: await authHeaders() }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function cartOnlineCheckoutHandler({
  userID,
  paymentMethod,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  userID: number;
  paymentMethod: string;
} & GiftOptions) {
  try {
    const response = await axios.post(
      `${url}/api/cart-online/create-order`,
      { userID, paymentMethod, gift_wrapping, gift_wrap_style, gift_message },
      { headers: await authHeaders() }
    );
    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 500, error: "Internal Server Error" };
  }
}

// Giữ export cũ để các file khác chưa sửa không bị lỗi import.
export default async function paymentGatewayHandler() {
  return { status: 410, clientSecret: "", error: "Stripe was removed" };
}
export async function paymentGatewayCartHandler() {
  return { status: 410, clientSecret: "", error: "Stripe was removed" };
}
export const cardCheckoutHandler = onlineCheckoutHandler;
export const cartCardCheckoutHandler = cartOnlineCheckoutHandler;
