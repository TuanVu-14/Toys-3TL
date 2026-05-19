"use server";

import axios from "axios";
import { sign } from "jsonwebtoken";

async function encrypt(key: string) {
  const encryptedKey = await sign({}, key);
  return encryptedKey;
}

const url = process.env.BACKEND_URL;
const authKey = process.env.AUTH_KEY as string;

type ProductCatalogFilters = {
  age_group?: string;
  gender?: string;
  material?: string;
  skill_type?: string;
  brand?: string;
  collection_id?: string | number;
};

export async function catalogFilterOptionsHandler() {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(`${url}/api/catalog/filters`, {
      headers: {
        authorization: `Bearer ${sendingKey}`,
      },
    });

    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("catalogFilterOptionsHandler error:", error);
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function categoryFilterHandler({
  minPrice,
  maxPrice,
  categoryID,
  minRating,
  categoryName,
  age_group = "",
  gender = "",
  material = "",
  skill_type = "",
  brand = "",
  collection_id = "",
}: {
  minPrice: number;
  maxPrice: number;
  categoryID: number;
  minRating: number;
  categoryName: string | string[];
} & ProductCatalogFilters) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(
      `${url}/api/filter/category/${minPrice}/${maxPrice}/${categoryID}/${minRating}/${categoryName}`,
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
        params: {
          age_group,
          gender,
          material,
          skill_type,
          brand,
          collection_id,
        },
      },
    );

    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("categoryFilterHandler error:", error);
    return { status: 500, error: "Internal Server Error" };
  }
}

export async function categoryOnlyFilterHandler({
  categoryID,
  categoryName,
  age_group = "",
  gender = "",
  material = "",
  skill_type = "",
  brand = "",
  collection_id = "",
}: {
  categoryID: number;
  categoryName: string | string[];
} & ProductCatalogFilters) {
  const sendingKey = await encrypt(authKey);

  try {
    const response = await axios.get(
      `${url}/api/filter/category-only/${categoryID}/${categoryName}`,
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
        params: {
          age_group,
          gender,
          material,
          skill_type,
          brand,
          collection_id,
        },
      },
    );

    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("categoryOnlyFilterHandler error:", error);
    return { status: 500, error: "Internal Server Error" };
  }
}
