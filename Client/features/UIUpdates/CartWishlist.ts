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
  productPrice?: number
  productprice?: number
  price?: number
  discount?: number
  productColor?: string
  colorname?: string
  productSize?: string
  sizename?: string
  productStock?: number
  productstock?: number
  stock?: number
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
  productPrice?: number
  productprice?: number
  price?: number
  discount?: number
}

interface CartWishlistState {
  cart: CartItem[]
  wishlist: WishlistItem[]
}

const initialState: CartWishlistState = {
  cart: [],
  wishlist: [],
}

const cartWishlistSlice = createSlice({
  name: 'cartWishlist',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.cart = action.payload || []
    },
    setWishlist(state, action: PayloadAction<WishlistItem[]>) {
      state.wishlist = action.payload || []
    },
    addItemToCart(state, action: PayloadAction<CartItem>) {
      const productID = action.payload.productID ?? action.payload.productid
      const existingItem = state.cart.find((item) => (item.productID ?? item.productid) === productID)

      if (existingItem) {
        existingItem.quantity += Number(action.payload.quantity || 1)
      } else {
        state.cart.push(action.payload)
      }
    },
    removeItemFromCart(state, action: PayloadAction<number>) {
      state.cart = state.cart.filter((item) => (item.productID ?? item.productid) !== action.payload)
    },
    updateCartItemQuantity(state, action: PayloadAction<{ id: number; quantity: number }>) {
      const item = state.cart.find((item) => (item.productID ?? item.productid) === action.payload.id)
      if (item) item.quantity = action.payload.quantity
    },
    addItemToWishlist(state, action: PayloadAction<WishlistItem>) {
      const productID = action.payload.productID ?? action.payload.productid
      const existingItem = state.wishlist.find((item) => (item.productID ?? item.productid) === productID)
      if (!existingItem) state.wishlist.push(action.payload)
    },
    removeItemFromWishlist(state, action: PayloadAction<number>) {
      state.wishlist = state.wishlist.filter((item) => (item.productID ?? item.productid) !== action.payload)
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

export const getProductPrice = (item: Partial<CartItem & WishlistItem>) => {
  return Number(item.productPrice ?? item.productprice ?? item.price ?? 0)
}

export const formatPrice = (price: number | string, discount?: number | string) => {
  const originalPrice = Number(price || 0)
  const discountValue = Number(discount || 0)
  const finalPrice = discountValue > 0 ? (originalPrice * (100 - discountValue)) / 100 : originalPrice

  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(finalPrice)}đ`
}

export default cartWishlistSlice.reducer
