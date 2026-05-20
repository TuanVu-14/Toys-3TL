import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useMenu } from '@/Helpers/MenuContext'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useApp } from '@/Helpers/AccountDialog'
import { wishlistDeleteHandler } from '@/app/api/itemLists'
import { removeItemFromWishlist, formatPrice, getProductPrice, WishlistItem } from '@/features/UIUpdates/CartWishlist'
import Loading from '../Loading'

const num = (value: unknown) => Number(value || 0)
const getWishlistItemID = (item: WishlistItem) => num(item.wishlistItemID ?? item.wishlistitemid)
const getProductID = (item: WishlistItem) => num(item.productID ?? item.productid)
const getProductName = (item: WishlistItem) => item.productName ?? item.title ?? 'Sản phẩm'
const getProductImage = (item: WishlistItem) => item.productImg ?? item.imglink ?? '/no-image.png'
const getProductAlt = (item: WishlistItem) => item.productAlt ?? item.imgalt ?? getProductName(item)

export default function Favourite() {
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const { menu, toggleFav } = useMenu()
  const { appState } = useApp()
  const isLogged = appState.loggedIn
  const wishlist = useAppSelector((state) => state.cartWishlist.wishlist)

  async function removeItem(wishlistItemID: number, productID: number) {
    setLoading(true)
    if (isLogged) await wishlistDeleteHandler({ wishlistItemID, userID: defaultAccount.userID })
    dispatch(removeItemFromWishlist(productID))
    setLoading(false)
  }

  return (
    <Transition show={menu.fav} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={toggleFav}>
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <DialogTitle className="text-lg font-medium text-gray-900">Favourites</DialogTitle>
                        <button type="button" className="relative -m-2 p-2 text-gray-400 hover:text-gray-500" onClick={toggleFav}>
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {loading && <Loading />}

                      <div className="mt-8">
                        <div className="flow-root">
                          <ul role="list" className="-my-6 divide-y divide-gray-200">
                            {wishlist.map((product) => {
                              const wishlistItemID = getWishlistItemID(product)
                              const productID = getProductID(product)

                              return (
                                <li key={`${wishlistItemID}-${productID}`} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img src={getProductImage(product)} alt={getProductAlt(product)} className="h-full w-full object-cover object-center" />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                          <Link href={`/product/${productID}`} onClick={toggleFav}>{getProductName(product)}</Link>
                                        </h3>
                                        <p className="ml-4 whitespace-nowrap">{formatPrice(getProductPrice(product))}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-1 items-end justify-end text-sm">
                                      <button type="button" onClick={() => removeItem(wishlistItemID, productID)} className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="flex justify-center text-center text-sm text-gray-500">
                        <button type="button" onClick={toggleFav} className="font-medium text-indigo-600 hover:text-indigo-500">
                          Continue Shopping <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
