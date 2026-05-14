"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";

async function encrypt(key: string) {
  return sign({}, key);
}

interface propForm {
  userName: string;
  email: string;
  password: string;
  mobile_number: number;
  dob: string;
}

export default async function signUpHandler(
  { userName, email, password, mobile_number, dob }: propForm,
  promotional: boolean,
) {
  const url = process.env.BACKEND_URL;
  const authKey =
    process.env.JWT_AUTH_KEY ||
    process.env.AUTH_KEY ||
    process.env.JWT_KEY ||
    process.env.JWT_ENCRYPTION_KEY;

  if (!url) {
    return {
      status: 500,
      data: { error: "Missing BACKEND_URL in environment" },
    };
  }

  if (!authKey) {
    return {
      status: 500,
      data: { error: "Missing authentication key in environment" },
    };
  }

  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.post(
      `${url}/api/user/signup/${promotional}`,
      { userName, email, password, mobile_number, dob },
      {
        headers: { authorization: `Bearer ${sendingKey}` },
      },
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
    console.error("signUpHandler error:", error?.response?.data || error?.message);

    return {
      status: error?.response?.status || 500,
      data: error?.response?.data || {
        error: error?.message || "Internal Server Error",
      },
    };
  }
}