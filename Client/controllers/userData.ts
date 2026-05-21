import userParamsHandler from '@/app/api/userParams'
import { setAddress, setCoupon, setGiftCard } from '@/features/UIUpdates/UserAccount'
import { useAppDispatch } from '@/app/hooks'
import { setCart, setWishlist } from '@/features/UIUpdates/CartWishlist'

const normalizeStock = (item: any) => ({
  ...item,
  productStock: item?.productStock ?? item?.productstock ?? item?.stock ?? null,
  stock: item?.stock ?? item?.productStock ?? item?.productstock ?? null,
})

const userData = () => {
  const dispatch = useAppDispatch()

  const grabUserData = async () => {
    try {
      const res = await userParamsHandler()

      switch (res.status) {
        case 200:
          try {
            if (
              res.data?.addresses !== undefined &&
              res.data?.cartItems !== undefined &&
              res.data?.wishlistItems !== undefined &&
              res.data?.coupons !== undefined &&
              res.data?.giftCards !== undefined
            ) {
              dispatch(setAddress(res.data.addresses))
              dispatch(setCart((res.data.cartItems || []).map(normalizeStock)))
              dispatch(setWishlist((res.data.wishlistItems || []).map(normalizeStock)))
              dispatch(setCoupon(res.data.coupons))
              dispatch(setGiftCard(res.data.giftCards))

              return { success: true, addresses: res.data.addresses }
            }

            return { success: false }
          } catch (tokenError) {
            return { success: false }
          }

        case 500:
          return { success: false }

        default:
          return { success: false }
      }
    } catch (err) {
      return { success: false }
    }
  }

  return { grabUserData }
}

export default userData
