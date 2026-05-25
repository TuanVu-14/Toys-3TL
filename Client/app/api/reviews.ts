"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";

async function encrypt(key: string) {
  return await sign({}, key);
}

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

type ReviewResponse = {
  status: number;
  data?: any;
  error?: any;
};

export async function reviewCreateHandler({
  userID,
  productID,
  rating,
  title,
  comment,
}: {
  userID: number;
  productID: number;
  rating: number;
  title: string;
  comment: string;
}): Promise<ReviewResponse> {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.post(
      `${url}/api/review/create`,
      { userID, productID, rating, title, comment },
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("reviewCreateHandler error:", error?.response?.data || error);
    return {
      status: 500,
      error: error?.response?.data || "Internal Server Error",
    };
  }
}

export async function reviewEditHandler({
  reviewID,
  userID,
  productID,
  rating,
  title,
  comment,
}: {
  reviewID: number;
  userID: number;
  productID: number;
  rating: number;
  title: string;
  comment: string;
}): Promise<ReviewResponse> {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.patch(
      `${url}/api/review/edit`,
      { reviewID, userID, productID, rating, title, comment },
      {
        headers: { authorization: `Bearer ${sendingKey}` },
        validateStatus: () => true,
      },
    );

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("reviewEditHandler error:", error?.response?.data || error);
    return {
      status: 500,
      error: error?.response?.data || "Internal Server Error",
    };
  }
}

export async function reviewDeleteHandler({
  reviewID,
  userID,
  productID,
}: {
  reviewID: number;
  userID: number;
  productID: number;
}): Promise<ReviewResponse> {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.delete(`${url}/api/review/delete`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      data: { reviewID, userID, productID },
      validateStatus: () => true,
    });

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("reviewDeleteHandler error:", error?.response?.data || error);
    return {
      status: 500,
      error: error?.response?.data || "Internal Server Error",
    };
  }
}

export async function reviewGetHandler({
  productID,
}: {
  productID: string;
}): Promise<ReviewResponse> {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(`${url}/api/reviews/${productID}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    });

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("reviewGetHandler error:", error?.response?.data || error);
    return {
      status: 500,
      error: error?.response?.data || "Internal Server Error",
    };
  }
}
