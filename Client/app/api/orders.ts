"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";

async function encrypt(key: string) {
  const encryptedKey = await sign({}, key);
  return encryptedKey;
}

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

async function ordersHandler() {
  const sendingKey = await encrypt(authKey);
  const cookie = cookies().get("sessionhold");

  if (cookie) {
    try {
      const response = await axios.post(
        `${url}/api/user/orders`,
        { userIDToken: cookie.value },
        {
          headers: { authorization: `Bearer ${sendingKey}` },
        },
      );
      return { status: response.status, data: response.data };
    } catch (error) {
      return { status: 500, error: "Internal Server Error" };
    }
  }

  return { status: 250, error: "Cookie Not Found" };
}

async function orderDetailHandler(orderID: string) {
  const sendingKey = await encrypt(authKey);
  const cookie = cookies().get("sessionhold");

  if (cookie) {
    try {
      const response = await axios.get(
        `${url}/api/user/order-detail/${cookie.value}/${orderID}`,
        {
          headers: { authorization: `Bearer ${sendingKey}` },
        },
      );
      return { status: response.status, data: response.data };
    } catch (error) {
      return { status: 404, error: "Internal Server Error" };
    }
  }

  return { status: 500, error: "Cookie Not Found" };
}

async function cancelOrderHandler(orderID: string | number) {
  const sendingKey = await encrypt(authKey);
  const cookie = cookies().get("sessionhold");

  if (!cookie) {
    return { status: 250, error: "Cookie Not Found" };
  }

  try {
    const response = await axios.put(
      `${url}/api/user/orders/${orderID}/cancel`,
      { userIDToken: cookie.value },
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("cancelOrderHandler error:", error?.response?.data || error);
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

async function createOrderReviewHandler({
  orderID,
  productID,
  rating,
  title,
  comment,
}: {
  orderID: string | number;
  productID: string | number;
  rating: number;
  title: string;
  comment: string;
}) {
  const sendingKey = await encrypt(authKey);
  const cookie = cookies().get("sessionhold");

  if (!cookie) {
    return { status: 250, error: "Cookie Not Found" };
  }

  try {
    const response = await axios.post(
      `${url}/api/user/reviews/create`,
      {
        userIDToken: cookie.value,
        orderID,
        productID,
        rating,
        title,
        comment,
      },
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("createOrderReviewHandler error:", error?.response?.data || error);
    return {
      status: 500,
      error: error?.response?.data?.error || "Internal Server Error",
    };
  }
}

export {
  ordersHandler,
  orderDetailHandler,
  cancelOrderHandler,
  createOrderReviewHandler,
};
