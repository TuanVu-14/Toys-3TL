"use server"

import axios from 'axios'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'

async function encrypt(key: string) {
  return await sign({}, key)
}

interface Address {
  addressID: number
  addressType: string
  contactNumber: number
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
  userName: string
  is_default: boolean
}

interface CartItem {
  cartItemID: number
  productID: number
  productImg: string
  productAlt: string
  productName: string
  productPrice: number
  discount: number
  productColor: string
  colorID: number
  productSize: string
  sizeID: number
  productStock: number
  quantity: number
}

interface Wishlist {
  wishlistItemID: number
  productID: number
  productImg: string
  productAlt: string
  productName: string
  productPrice: number
  discount: number
  productStock: number
}

interface UserCoupon {
  couponid: number
  code: string
  description: string
  discountpercentage: number
  maxdiscountamount: number
  minpurchaseamount: number
  validuntil: string
}

interface GiftCard {
  cardid: number
  cardname: string
  cardcode: string
  description: string
  balance: number
  currency: string
  expirydate: string
  sendername: string
  message: string
  status: string
}

const pick = (obj: any, ...keys: string[]) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]
  }
  return undefined
}

const toNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeImage = (value: unknown) => {
  const src = String(value || '').trim()
  return src || '/no-image.png'
}

const mapAddress = (address: any): Address => ({
  addressID: toNumber(pick(address, 'addressID', 'addressid')),
  addressType: pick(address, 'addressType', 'addresstype') || '',
  contactNumber: toNumber(pick(address, 'contactNumber', 'contactnumber')),
  addressLine1: pick(address, 'addressLine1', 'addressline1') || '',
  addressLine2: pick(address, 'addressLine2', 'addressline2') || '',
  city: pick(address, 'city') || '',
  state: pick(address, 'state') || '',
  country: pick(address, 'country') || '',
  postalCode: pick(address, 'postalCode', 'postalcode') || '',
  userName: pick(address, 'userName', 'username') || '',
  is_default: Boolean(pick(address, 'is_default', 'isDefault')),
})

const mapCartItem = (cartItem: any): CartItem => ({
  // Backend đang SELECT alias dạng camelCase: "cartItemID", "productID", "productName"...
  // Vì vậy phải đọc cả camelCase và lowercase để không bị undefined.
  cartItemID: toNumber(pick(cartItem, 'cartItemID', 'cartitemid')),
  productID: toNumber(pick(cartItem, 'productID', 'productid')),

  productImg: normalizeImage(pick(cartItem, 'productImg', 'imglink')),
  productAlt: pick(cartItem, 'productAlt', 'imgalt') || 'Sản phẩm',
  productName: pick(cartItem, 'productName', 'title') || 'Sản phẩm',

  // LỖI CŨ: đang map productPrice = cartItem.discount nên giá bị 0đ/5đ.
  // Đúng nghiệp vụ lego9.sql: products.price là giá gốc, products.discount là % giảm giá.
  productPrice: toNumber(pick(cartItem, 'productPrice', 'price')),
  discount: toNumber(pick(cartItem, 'discount')),

  productColor: pick(cartItem, 'productColor', 'colorname') || '',
  colorID: toNumber(pick(cartItem, 'colorID', 'colorid')),

  productSize: pick(cartItem, 'productSize', 'sizename') || '',
  sizeID: toNumber(pick(cartItem, 'sizeID', 'sizeid')),

  productStock: toNumber(pick(cartItem, 'productStock', 'stock')),
  quantity: Math.max(1, toNumber(pick(cartItem, 'quantity'))),
})

const mapWishlist = (wishlistItem: any): Wishlist => ({
  wishlistItemID: toNumber(pick(wishlistItem, 'wishlistItemID', 'wishlistitemid')),
  productID: toNumber(pick(wishlistItem, 'productID', 'productid')),
  productImg: normalizeImage(pick(wishlistItem, 'productImg', 'imglink')),
  productAlt: pick(wishlistItem, 'productAlt', 'imgalt') || 'Sản phẩm',
  productName: pick(wishlistItem, 'productName', 'title') || 'Sản phẩm',
  productPrice: toNumber(pick(wishlistItem, 'productPrice', 'price')),
  discount: toNumber(pick(wishlistItem, 'discount')),
  productStock: toNumber(pick(wishlistItem, 'productStock', 'stock')),
})

export default async function userParamsHandler() {
  const url = process.env.BACKEND_URL
  const authKey = process.env.AUTH_KEY as string
  const cookie = cookies().get('sessionhold')

  if (!cookie) return { status: 205, error: 'Cookie not found' }

  const sendingKey = await encrypt(authKey)

  try {
    const response = await axios.post(
      `${url}/api/user/all-data`,
      { userIDToken: cookie.value },
      { headers: { authorization: `Bearer ${sendingKey}` } },
    )

    const data = response.data || {}

    const addresses: Address[] = Array.isArray(data.addresses) ? data.addresses.map(mapAddress) : []
    const cartItems: CartItem[] = Array.isArray(data.cartItems) ? data.cartItems.map(mapCartItem) : []
    const wishlistItems: Wishlist[] = Array.isArray(data.wishlistItems) ? data.wishlistItems.map(mapWishlist) : []
    const userCoupons: UserCoupon[] = Array.isArray(data.coupons) ? data.coupons : []
    const giftcardsData: GiftCard[] = Array.isArray(data.giftcards) ? data.giftcards : []

    return {
      status: response.status,
      data: {
        addresses,
        cartItems,
        wishlistItems,
        coupons: userCoupons,
        giftCards: giftcardsData,
      },
    }
  } catch (error) {
    return { status: 500, error: 'Internal Server Error' }
  }
}
