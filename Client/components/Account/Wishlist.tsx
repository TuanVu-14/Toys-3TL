import { wishlistDeleteHandler } from '@/app/api/itemLists';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { formatPrice, removeItemFromWishlist, WishlistItem } from '@/features/UIUpdates/CartWishlist';
import { useApp } from '@/Helpers/AccountDialog';
import React from 'react'

const getWishlistItemID = (item: WishlistItem) => Number(item.wishlistItemID ?? item.wishlistitemid ?? 0)
const getProductID = (item: WishlistItem) => Number(item.productID ?? item.productid ?? 0)
const getProductImage = (item: WishlistItem) => item.productImg ?? item.imglink ?? '/no-image.png'
const getProductAlt = (item: WishlistItem) => item.productAlt ?? item.imgalt ?? item.productName ?? item.title ?? 'Product'
const getProductName = (item: WishlistItem) => item.productName ?? item.title ?? 'Sản phẩm'
const getProductPrice = (item: WishlistItem) => item.productPrice ?? item.productprice ?? item.discountedprice ?? item.price ?? 0

const Wishlist = ({Component,loading,setLoading}:{Component:WishlistItem[],loading:boolean,setLoading:React.Dispatch<React.SetStateAction<boolean>>}) => {
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const dispatch = useAppDispatch();
  const { appState } = useApp();
  const isLogged = appState.loggedIn;
  async function removeItem(wishlistItemID:number,productID:number){
    setLoading(true);
    isLogged && await wishlistDeleteHandler({wishlistItemID, userID:defaultAccount.userID})
    dispatch(removeItemFromWishlist({ wishlistItemID, productID }));
    setLoading(false);
    
  }
  return (
    <div className='w-full h-full py-4 px-4 overflow-auto'>
      <h1 className='text-xl font-semibold'>My Wishlist</h1>
      <div>
        <div className='flex justify-end mb-5'>
          {/* <button className='bg-primary-600 text-white px-4 py-2 rounded-xl'>Add all to Cart</button> */}
        </div>
        <div className='flex flex-col gap-4 py-2 px-2'>
         <div className="mt-8">
                <div className="flow-root">
                    <ul role="list" className="-my-6 divide-y divide-gray-200">
                    {Component.map((product) => {
                      const wishlistItemID = getWishlistItemID(product)
                      const productID = getProductID(product)
                      return (
                        <li key={`${wishlistItemID}-${productID}`} className="flex py-6">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img
                            src={getProductImage(product)}
                            alt={getProductAlt(product)}
                            className="h-full w-full object-cover object-center"
                            />
                        </div>

                        <div className="ml-4 flex flex-1 flex-col">
                            <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                                <h3>
                                <a href={`./product/${productID}`}>{getProductName(product)}</a>
                                </h3>
                                <p className="ml-4">{formatPrice(getProductPrice(product), product.discount)}</p>
                            </div>
                            </div>
                            <div className="flex flex-1 items-end justify-between text-sm">
                            {/* <button className="font-medium text-indigo-600 hover:text-indigo-500">Add to Cart</button> */}

                            <div className="flex">
                                <button
                                onClick={()=>removeItem(wishlistItemID, productID)}
                                type="button"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                Remove
                                </button>
                            </div>
                            </div>
                        </div>
                        </li>
                    )})}
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Wishlist
