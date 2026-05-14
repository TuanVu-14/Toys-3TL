"use server";
import { cookies } from "next/headers";

export default async function signOutHandler() {
  cookies().set({
    name: "sessionhold",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return true;
}
