import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useState } from 'react'
import Link from 'next/link'

import { useMenu } from '@/Helpers/MenuContext'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useApp } from '@/Helpers/AccountDialog'
import { wishlistDeleteHandler } from '@/app/api/itemLists'
import {
  removeItemFromWishlist,
  formatPrice,
  getFinalPrice,
  getProductPrice,
  WishlistItem,
  toNumber,
} from '@/features/UIUpdates/CartWishlist'
import Loading from '../Loading'

const getAccountID = (account: unknown) => Number((account as { userID?: number; userid?: number })?.userID ?? (account as { userid?: number })?.userid ?? 0)

const getError = (res: unknown, fallback: string) => {
  const error = (res as { error?: string })?.error
  return error || fallback
}

const getWishlistItemID = (item: WishlistItem) => toNumber(item.wishlistItemID ?? item.wishlistitemid)
const getProductID = (item: WishlistItem) => toNumber(item.productID ?? item.productid)
const getProductName = (item: WishlistItem) => item.productName ?? item.title ?? 'Sản phẩm'
const getProductImage = (item: WishlistItem) => item.productImg ?? item.imglink ?? '/no-image.png'
const getProductAlt = (item: WishlistItem) => item.productAlt ?? item.imgalt ?? getProductName(item)
const getProductStock = (item: WishlistItem) => toNumber(item.productStock ?? item.productstock ?? item.stock)

export default function Favourite() {
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const dispatch = useAppDispatch()
  const { menu, toggleFav } = useMenu()
  const { appState } = useApp()

  const isLogged = appState.loggedIn
  const wishlist = useAppSelector((state) => state.cartWishlist.wishlist)
  const userID = getAccountID(defaultAccount)

  async function removeItem(product: WishlistItem) {
    const wishlistItemID = getWishlistItemID(product)
    const productID = getProductID(product)

    setMessage('')

    if (isLogged && (!userID || !wishlistItemID)) {
      setMessage('Sản phẩm thiếu wishlistItemID hoặc userID. Hãy đăng nhập lại rồi thử xoá.')
      return
    }

    setLoading(true)

    try {
      if (isLogged) {
        const res = await wishlistDeleteHandler({
          wishlistItemID,
          userID,
        })

        if (res.status !== 200) {
          setMessage(getError(res, 'Không xoá được sản phẩm khỏi danh sách yêu thích.'))
          return
        }
      }

      dispatch(removeItemFromWishlist({ wishlistItemID, productID }))
    } finally {
      setLoading(false)
    }
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
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
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
                        <DialogTitle className="text-lg font-medium text-gray-900">Yêu thích</DialogTitle>

                        <button type="button" className="relative -m-2 p-2 text-gray-400 hover:text-gray-500" onClick={toggleFav}>
                          <span className="sr-only">Đóng</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {loading && <Loading />}

                      {message && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>}

                      <div className="mt-8">
                        <div className="flow-root">
                          {wishlist.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-500">Danh sách yêu thích đang trống.</p>
                          ) : (
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {wishlist.map((product) => {
                                const wishlistItemID = getWishlistItemID(product)
                                const productID = getProductID(product)
                                const stock = getProductStock(product)
                                const price = getFinalPrice(getProductPrice(product), product.discount)

                                return (
                                  <li key={`${wishlistItemID || productID}`} className="flex py-6">
                                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      <img
                                        src={getProductImage(product)}
                                        alt={getProductAlt(product)}
                                        className="h-full w-full object-cover object-center"
                                      />
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col">
                                      <div>
                                        <div className="flex justify-between gap-3 text-base font-medium text-gray-900">
                                          <h3 className="line-clamp-2">
                                            <Link href={`/product/${productID}`} onClick={toggleFav}>
                                              {getProductName(product)}
                                            </Link>
                                          </h3>

                                          <p className="whitespace-nowrap">{formatPrice(price)}</p>
                                        </div>

                                        {stock === 0 ? (
                                          <p className="mt-1 text-sm text-red-500">Hết hàng</p>
                                        ) : (
                                          <p className="mt-1 text-sm text-green-600">Còn hàng</p>
                                        )}
                                      </div>

                                      <div className="mt-4 flex flex-1 items-end justify-end text-sm">
                                        <button
                                          type="button"
                                          disabled={loading}
                                          onClick={() => removeItem(product)}
                                          className="font-medium text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:text-gray-400"
                                        >
                                          Xoá
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="flex justify-center text-center text-sm text-gray-500">
                        <button type="button" onClick={toggleFav} className="font-medium text-indigo-600 hover:text-indigo-500">
                          Tiếp tục mua hàng <span aria-hidden="true">→</span>
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
