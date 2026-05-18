import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Item {
  cartItemID: number;
  productID: number;
  productImg: string;
  productAlt: string;
  productName: string;
  productPrice: number;
  productColor: string;
  productSize: string;
  productStock?: number;
  quantity: number;
}

interface Wishlist {
  wishlistItemID: number;
  productID: number;
  productImg: string;
  productAlt: string;
  productName: string;
  productPrice: number;
}

interface CartWishlistState {
  cart: Item[];
  wishlist: Wishlist[];
}

const initialState: CartWishlistState = {
  cart: [],
  wishlist: [],
};

const cartWishlistSlice = createSlice({
  name: 'cartWishlist',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<Item[]>) {
      state.cart = action.payload;
    },
    setWishlist(state, action: PayloadAction<Wishlist[]>) {
      state.wishlist = action.payload;
    },
    addItemToCart(state, action: PayloadAction<Item>) {
      const existingItem = state.cart.find(
        (item) =>
          item.productID === action.payload.productID &&
          item.productColor === action.payload.productColor &&
          item.productSize === action.payload.productSize,
      );
      if (existingItem) {
        const stock = Number(existingItem.productStock || action.payload.productStock || 0);
        const nextQuantity = existingItem.quantity + action.payload.quantity;
        existingItem.quantity = stock > 0 ? Math.min(nextQuantity, stock) : nextQuantity;
      } else {
        state.cart.push(action.payload);
      }
    },
    removeItemFromCart(state, action: PayloadAction<number>) {
      state.cart = state.cart.filter((item) => item.productID !== action.payload);
    },
    updateCartItemQuantity(state, action: PayloadAction<{ id: number; quantity: number }>) {
      const item = state.cart.find((item) => item.productID === action.payload.id);
      if (item) item.quantity = action.payload.quantity;
    },
    addItemToWishlist(state, action: PayloadAction<Wishlist>) {
      const existingItem = state.wishlist.find((item) => item.productID === action.payload.productID);
      if (!existingItem) state.wishlist.push(action.payload);
    },
    removeItemFromWishlist(state, action: PayloadAction<number>) {
      state.wishlist = state.wishlist.filter((item) => item.productID !== action.payload);
    },
  },
});

export const {
  setCart,
  setWishlist,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  addItemToWishlist,
  removeItemFromWishlist,
} = cartWishlistSlice.actions;

export const formatPrice = (price: number | string, discount?: number | string) => {
  const originalPrice = Number(price || 0);
  const discountValue = Number(discount || 0);
  const finalPrice = discountValue > 0 ? (originalPrice * (100 - discountValue)) / 100 : originalPrice;
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(finalPrice)}đ`;
};

export default cartWishlistSlice.reducer;
