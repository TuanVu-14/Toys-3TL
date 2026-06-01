"use server"

import axios from 'axios'
import { sign } from 'jsonwebtoken'

interface CartPayload {
  cartItemID?: number
  userID: number
  productID: number
  productPrice?: number
  colorID?: number
  sizeID?: number
  quantity: number
}

interface WishlistPayload {
  wishlistItemID?: number
  userID: number
  productID: number
}

async function encrypt(key: string) {
  return await sign({}, key)
}

const url = process.env.BACKEND_URL
const authKey = process.env.AUTH_KEY as string

function handleAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status || 500,
      error: error.response?.data?.message || error.response?.data?.error || 'Internal Server Error',
    }
  }

  return { status: 500, error: 'Internal Server Error' }
}

async function cartAddHandler({ userID, productID, productPrice, colorID, sizeID, quantity }: CartPayload) {
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.post(
      `${url}/api/user/insert/cartitem`,
      { userID, productID, productPrice, colorID, sizeID, quantity },
      { headers: { authorization: `Bearer ${sendingKey}` } },
    )

    return { status: response.status, message: 'Successful', data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

async function wishlistAddHandler({ wishlistItemID, userID, productID }: WishlistPayload) {
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.post(
      `${url}/api/user/insert/wishlistitem`,
      { wishlistItemID, userID, productID },
      { headers: { authorization: `Bearer ${sendingKey}` } },
    )

    return { status: response.status, message: 'Successful', data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

async function wishlistDeleteHandler({ wishlistItemID, userID }: { wishlistItemID: number; userID: number }) {
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.delete(`${url}/api/user/delete/wishlistitem`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      data: { wishlistItemID, userID },
    })

    return { status: response.status, message: 'Successful', data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

async function cartDeleteHandler({ userID, cartItemID }: { userID: number; cartItemID: number }) {
  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.delete(`${url}/api/user/delete/cartitem`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      data: { userID, cartItemID },
    })

    return { status: response.status, message: 'Successful', data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

export { cartAddHandler, wishlistAddHandler, wishlistDeleteHandler, cartDeleteHandler }
