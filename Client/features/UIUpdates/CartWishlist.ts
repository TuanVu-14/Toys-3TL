import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  cartItemID?: number
  cartitemid?: number
  productID?: number
  productid?: number
  productImg?: string
  imglink?: string
  productAlt?: string
  imgalt?: string
  productName?: string
  title?: string
  productPrice?: number | string
  productprice?: number | string
  price?: number | string
  discountedprice?: number | string
  discount?: number | string
  productColor?: string
  colorname?: string
  colorID?: number
  colorid?: number
  productSize?: string
  sizename?: string
  sizeID?: number
  sizeid?: number
  productStock?: number | string | null
  productstock?: number | string | null
  stock?: number | string | null
  quantity: number
}

export interface WishlistItem {
  wishlistItemID?: number
  wishlistitemid?: number
  productID?: number
  productid?: number
  productImg?: string
  imglink?: string
  productAlt?: string
  imgalt?: string
  productName?: string
  title?: string
  productPrice?: number | string
  productprice?: number | string
  price?: number | string
  discountedprice?: number | string
  discount?: number | string
  productStock?: number | string | null
  productstock?: number | string | null
  stock?: number | string | null
}

interface CartWishlistState {
  cart: CartItem[]
  wishlist: WishlistItem[]
}

const initialState: CartWishlistState = {
  cart: [],
  wishlist: [],
}

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

export const getProductPrice = (item: Partial<CartItem | WishlistItem>) => {
  return toNumber(item.productPrice ?? item.productprice ?? item.discountedprice ?? item.price)
}

export const getProductStock = (item: Partial<CartItem | WishlistItem>): number | null => {
  const rawStock = item.productStock ?? item.productstock ?? item.stock

  if (rawStock === null || rawStock === undefined || rawStock === '') {
    return null
  }

  return toNumber(rawStock)
}

const pickStockValue = (item?: Partial<CartItem | WishlistItem>) => {
  if (!item) return undefined
  return item.productStock ?? item.productstock ?? item.stock
}

const hasStockValue = (value: unknown) => value !== undefined && value !== null && value !== ''

export const getFinalPrice = (price: unknown, discount?: unknown) => {
  const originalPrice = toNumber(price)
  const discountValue = toNumber(discount)

  if (originalPrice <= 0) return 0
  if (discountValue <= 0) return originalPrice

  // lego9.sql: discount là phần trăm giảm giá
  if (discountValue <= 100) return Math.max(originalPrice - (originalPrice * discountValue) / 100, 0)

  // dự phòng nếu sau này discount lưu số tiền giảm trực tiếp
  return Math.max(originalPrice - discountValue, 0)
}

export const formatPrice = (price: unknown, discount?: unknown) => {
  const finalPrice = discount === undefined ? toNumber(price) : getFinalPrice(price, discount)

  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(finalPrice)}đ`
}

const sameCartItem = (item: CartItem, target: Partial<CartItem>) => {
  const itemCartID = toNumber(item.cartItemID ?? item.cartitemid)
  const targetCartID = toNumber(target.cartItemID ?? target.cartitemid)

  if (itemCartID > 0 && targetCartID > 0) return itemCartID === targetCartID

  return (
    toNumber(item.productID ?? item.productid) === toNumber(target.productID ?? target.productid) &&
    String(item.productColor ?? item.colorname ?? '') === String(target.productColor ?? target.colorname ?? '') &&
    String(item.productSize ?? item.sizename ?? '') === String(target.productSize ?? target.sizename ?? '')
  )
}

const cartWishlistSlice = createSlice({
  name: 'cartWishlist',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      const incoming = action.payload || []

      state.cart = incoming.map((newItem) => {
        const oldItem = state.cart.find((item) => sameCartItem(item, newItem))
        const newStock = pickStockValue(newItem)
        const oldStock = pickStockValue(oldItem)
        const stockToUse = hasStockValue(newStock) ? newStock : oldStock

        return {
          ...oldItem,
          ...newItem,
          productStock: hasStockValue(stockToUse) ? stockToUse : null,
          quantity: Math.max(1, toNumber(newItem.quantity)),
        }
      })
    },

    setWishlist(state, action: PayloadAction<WishlistItem[]>) {
      const incoming = action.payload || []

      state.wishlist = incoming.map((newItem) => {
        const newProductID = toNumber(newItem.productID ?? newItem.productid)
        const oldItem = state.wishlist.find(
          (item) => toNumber(item.productID ?? item.productid) === newProductID,
        )
        const newStock = pickStockValue(newItem)
        const oldStock = pickStockValue(oldItem)
        const stockToUse = hasStockValue(newStock) ? newStock : oldStock

        return {
          ...oldItem,
          ...newItem,
          productStock: hasStockValue(stockToUse) ? stockToUse : null,
        }
      })
    },

    addItemToCart(state, action: PayloadAction<CartItem>) {
      const existingItem = state.cart.find((item) => sameCartItem(item, action.payload))
      const payloadStock = pickStockValue(action.payload)

      if (existingItem) {
        const stock = hasStockValue(payloadStock) ? toNumber(payloadStock) : getProductStock(existingItem)
        const nextQuantity = toNumber(existingItem.quantity) + Math.max(1, toNumber(action.payload.quantity))

        existingItem.quantity = stock !== null && stock > 0 ? Math.min(nextQuantity, stock) : nextQuantity

        if (hasStockValue(payloadStock)) {
          existingItem.productStock = payloadStock
        }
      } else {
        const stock = getProductStock(action.payload)
        const nextQuantity = Math.max(1, toNumber(action.payload.quantity))

        state.cart.push({
          ...action.payload,
          productStock: hasStockValue(payloadStock) ? payloadStock : null,
          quantity: stock !== null && stock > 0 ? Math.min(nextQuantity, stock) : nextQuantity,
        })
      }
    },

    removeItemFromCart(
      state,
      action: PayloadAction<{
        cartItemID?: number
        productID?: number
        productColor?: string
        productSize?: string
      }>,
    ) {
      state.cart = state.cart.filter((item) => {
        if (action.payload.cartItemID) {
          return toNumber(item.cartItemID ?? item.cartitemid) !== action.payload.cartItemID
        }

        return !(
          toNumber(item.productID ?? item.productid) === toNumber(action.payload.productID) &&
          String(item.productColor ?? item.colorname ?? '') === String(action.payload.productColor ?? '') &&
          String(item.productSize ?? item.sizename ?? '') === String(action.payload.productSize ?? '')
        )
      })
    },

    updateCartItemQuantity(
      state,
      action: PayloadAction<{
        cartItemID?: number
        productID?: number
        quantity: number
      }>,
    ) {
      const item = state.cart.find((item) => {
        if (action.payload.cartItemID) {
          return toNumber(item.cartItemID ?? item.cartitemid) === action.payload.cartItemID
        }

        return toNumber(item.productID ?? item.productid) === action.payload.productID
      })

      if (item) {
        const stock = getProductStock(item)
        const nextQuantity = Math.max(1, toNumber(action.payload.quantity))

        item.quantity = stock !== null && stock > 0 ? Math.min(nextQuantity, stock) : nextQuantity
      }
    },

    addItemToWishlist(state, action: PayloadAction<WishlistItem>) {
      const productID = toNumber(action.payload.productID ?? action.payload.productid)
      const existingItem = state.wishlist.find((item) => toNumber(item.productID ?? item.productid) === productID)
      const payloadStock = pickStockValue(action.payload)

      if (!existingItem) {
        state.wishlist.push({
          ...action.payload,
          productStock: hasStockValue(payloadStock) ? payloadStock : null,
        })
        return
      }

      Object.assign(existingItem, action.payload)

      if (hasStockValue(payloadStock)) {
        existingItem.productStock = payloadStock
      }
    },

    removeItemFromWishlist(
      state,
      action: PayloadAction<{
        wishlistItemID?: number
        productID?: number
      }>,
    ) {
      state.wishlist = state.wishlist.filter((item) => {
        if (action.payload.wishlistItemID) {
          return toNumber(item.wishlistItemID ?? item.wishlistitemid) !== action.payload.wishlistItemID
        }

        return toNumber(item.productID ?? item.productid) !== action.payload.productID
      })
    },
  },
})

export const {
  setCart,
  setWishlist,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  addItemToWishlist,
  removeItemFromWishlist,
} = cartWishlistSlice.actions

export default cartWishlistSlice.reducer
