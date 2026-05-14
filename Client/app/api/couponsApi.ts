"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";

async function encrypt(key: string) {
  const encryptedKey = await sign({}, key);
  return encryptedKey;
}

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

export async function createChildProfile({
  user_id,
  child_name,
  birth_date,
  gender,
}: {
  user_id: number;
  child_name: string;
  birth_date: string;
  gender?: string;
}) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.post(
      `${url}/api/coupons/child-profile`,
      {
        user_id,
        child_name,
        birth_date,
        gender,
      },
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
      }
    );

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("createChildProfile error:", error);
    return {
      status: 500,
      error: "Internal Server Error",
    };
  }
}

export async function getChildProfiles(userId: number) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(
      `${url}/api/coupons/child-profiles/${userId}`,
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
      }
    );

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("getChildProfiles error:", error);
    return {
      status: 500,
      error: "Internal Server Error",
    };
  }
}

export async function getBirthdayCoupons(userId: number) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(
      `${url}/api/coupons/birthday/${userId}`,
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
      }
    );

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("getBirthdayCoupons error:", error);
    return {
      status: 500,
      error: "Internal Server Error",
    };
  }
}

export async function getGiftSuggestions(userId: number) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(
      `${url}/api/coupons/gift-suggestions/${userId}`,
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
      }
    );

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("getGiftSuggestions error:", error);
    return {
      status: 500,
      error: "Internal Server Error",
    };
  }
}
