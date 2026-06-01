"use server";
import axios from "axios";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";
async function encrypt(key: string) {
  const encryptedKey = await sign({}, key);
  return encryptedKey;
}
export default async function signInHandler({
  email,
  password,
  remember,
}: {
  email: string;
  password: string;
  remember: boolean;
}) {
  const url = process.env.BACKEND_URL;
  const authKey =
    process.env.JWT_AUTH_KEY ||
    process.env.AUTH_KEY ||
    process.env.JWT_KEY ||
    process.env.JWT_ENCRYPTION_KEY;
  if (!authKey) throw new Error("Missing authentication key in environment");
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.post(
      `${url}/api/user/signin/${remember}`,
      { email, password },
      {
        headers: { authorization: `Bearer ${sendingKey}` },
      },
    );
    if (remember) {
      cookies().set({
        name: "sessionhold",
        value: response.data.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      cookies().set({
        name: "sessionhold",
        value: response.data.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return {
      status: error?.response?.status || 500,
      data: error?.response?.data || { error: error?.message || "Internal Server Error" },
    };
  }
}
