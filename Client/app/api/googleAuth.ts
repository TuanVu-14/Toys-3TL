"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";

async function encrypt(key: string) {
  return sign({}, key);
}

const url = process.env.BACKEND_URL;
const authKey =
  process.env.JWT_AUTH_KEY ||
  process.env.AUTH_KEY ||
  process.env.JWT_KEY ||
  process.env.JWT_ENCRYPTION_KEY;

export default async function authDataHandler(code: string) {
  if (!url) return { status: 500, data: { error: "Missing BACKEND_URL" } };
  if (!authKey) return { status: 500, data: { error: "Missing authentication key in environment" } };

  const sendingKey = await encrypt(authKey as string);
  try {
    const response = await axios.post(
      `${url}/api/auth/google`,
      { code },
      { headers: { authorization: `Bearer ${sendingKey}` } },
    );

    cookies().set({
      name: "sessionhold",
      value: response.data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { status: response.status, data: response.data };
  } catch (error: any) {
    return {
      status: error?.response?.status || 500,
      data: error?.response?.data || { error: error?.message || "Internal Server Error" },
    };
  }
}
