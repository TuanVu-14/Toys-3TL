"use server"

import axios from 'axios'
import { sign } from 'jsonwebtoken'

const backendURL = process.env.BACKEND_URL
const authKey = process.env.AUTH_KEY as string

async function encrypt(key: string) {
  return await sign({}, key)
}

export interface ToyFilterParams {
  categoryName?: string
  categoryID?: number
  productName?: string
  minPrice?: string | number
  maxPrice?: string | number
  minRating?: string | number
  age_group?: string
  gender?: string
  material?: string
  skill_type?: string
  brand?: string
  collection_id?: string | number
}

function safeNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function toyFilterCategoryHandler(params: ToyFilterParams) {
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.post(
      `${backendURL}/api/toy-filter/category`,
      {
        ...params,
        minPrice: safeNumber(params.minPrice, 0),
        maxPrice: safeNumber(params.maxPrice, 999999999),
        minRating: safeNumber(params.minRating, 0),
      },
      { headers: { authorization: `Bearer ${sendingKey}` } },
    )

    return { status: response.status, data: response.data }
  } catch (error: any) {
    return {
      status: error?.response?.status || 500,
      data: error?.response?.data || null,
    }
  }
}

export async function toyFilterSearchHandler(params: ToyFilterParams) {
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.post(
      `${backendURL}/api/toy-filter/search`,
      {
        ...params,
        productName: params.productName || '',
        minPrice: safeNumber(params.minPrice, 0),
        maxPrice: safeNumber(params.maxPrice, 999999999),
        minRating: safeNumber(params.minRating, 0),
      },
      { headers: { authorization: `Bearer ${sendingKey}` } },
    )

    return { status: response.status, data: response.data }
  } catch (error: any) {
    return {
      status: error?.response?.status || 500,
      data: error?.response?.data || null,
    }
  }
}
