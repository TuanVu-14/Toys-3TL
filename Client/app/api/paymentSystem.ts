"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

async function encrypt(key: string) {
  return await sign({}, key);
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  status: boolean;
  config?: unknown;
}

type CouponPayload = {
  coupon_code?: string | null;
  coupon_discount?: number;
  address_id?: number | null;
  shipping_address?: string | null;
};

type ProductOrderPayload = CouponPayload & {
  userid: number;
  productid: string | number;
  quantity: number;
  gift_wrapping?: boolean;
  gift_wrap_style?: string | null;
  gift_message?: string | null;
};

type ProductOnlineOrderPayload = ProductOrderPayload & {
  paymentMethod: string;
};

type CartOrderPayload = CouponPayload & {
  userID: string | number;
  cartItemIDs?: number[];
  gift_wrapping?: boolean;
  gift_wrap_style?: string | null;
  gift_message?: string | null;
};

type CartOnlineOrderPayload = CartOrderPayload & {
  paymentMethod: string;
};

export async function paymentMethodsHandler() {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.get(`${url}/api/payment-methods`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "paymentMethodsHandler error:",
      error?.response?.data || error,
    );
    return { status: 500, data: [] };
  }
}

export async function checkoutProductDataHandler({
  productID,
}: {
  productID: string;
}) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.get(
      `${url}/api/checkout/product-details/${productID}`,
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "checkoutProductDataHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export async function checkoutCartProductDataHandler(
  userID: string | number,
  cartItemIDs?: number[],
) {
  const sendingKey = await encrypt(authKey);
  const itemsQuery =
    Array.isArray(cartItemIDs) && cartItemIDs.length > 0
      ? `?items=${cartItemIDs.join(",")}`
      : "";
  try {
    const response = await axios.get(
      `${url}/api/checkout-cart/product-details/${userID}${itemsQuery}`,
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "checkoutCartProductDataHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export async function paymentOnDeliveryHandler(payload: ProductOrderPayload) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/payment-on-delivery/create-order`,
      payload,
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "paymentOnDeliveryHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export async function onlineCheckoutHandler(
  payload: ProductOnlineOrderPayload,
) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/online/create-order`,
      payload,
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "onlineCheckoutHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export async function cartPaymentOnDeliveryHandler(payload: CartOrderPayload) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/cart-payment-on-delivery/create-order`,
      payload,
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "cartPaymentOnDeliveryHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export async function cartOnlineCheckoutHandler(
  payload: CartOnlineOrderPayload,
) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.post(
      `${url}/api/cart-online/create-order`,
      payload,
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "cartOnlineCheckoutHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export async function orderStatusDataHandler({
  orderID,
}: {
  orderID: string | number;
}) {
  const sendingKey = await encrypt(authKey);
  try {
    const response = await axios.get(`${url}/api/orders/status/${orderID}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error(
      "orderStatusDataHandler error:",
      error?.response?.data || error,
    );
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}
