"use server"

import axios from 'axios'
import { sign } from 'jsonwebtoken'

async function encrypt(key: string) {
  return await sign({}, key)
}

export async function collectionProductsHandler({ collectionSlug }: { collectionSlug: string }) {
  const url = process.env.BACKEND_URL
  const authKey = process.env.AUTH_KEY as string
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.get(`${url}/api/toy-filter/collection/${collectionSlug}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
    })

    return { status: response.status, data: response.data }
  } catch (error: any) {
    return {
      status: error?.response?.status || 500,
      data: error?.response?.data || { data: null, products: [] },
    }
  }
}
