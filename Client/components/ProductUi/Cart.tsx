import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { useMenu } from '@/Helpers/MenuContext'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import {
  setCart,
  formatPrice,
  getProductPrice,
  getFinalPrice,
  removeItemFromCart,
  CartItem,
  toNumber,
  getProductStock,
} from '@/features/UIUpdates/CartWishlist'
import { cartDeleteHandler } from '@/app/api/itemLists'
import { useApp } from '@/Helpers/AccountDialog'
import Loading from '../Loading'
import { cartQuantityHandler } from '@/app/api/userUpdate'

const getAccountID = (account: unknown) =>
  Number(
    (account as { userID?: number; userid?: number })?.userID ??
      (account as { userid?: number })?.userid ??
      0,
  )

const getError = (res: unknown, fallback: string) => {
  const error = (res as { error?: string })?.error
  return error || fallback
}

const getCartItemID = (item: CartItem) =>
  toNumber(item.cartItemID ?? item.cartitemid)

const getProductID = (item: CartItem) =>
  toNumber(item.productID ?? item.productid)

const getProductName = (item: CartItem) =>
  item.productName ?? item.title ?? 'Sản phẩm'

const getProductImage = (item: CartItem) =>
  item.productImg ?? item.imglink ?? '/no-image.png'

const getProductAlt = (item: CartItem) =>
  item.productAlt ?? item.imgalt ?? getProductName(item)

const getProductColor = (item: CartItem) =>
  item.productColor ?? item.colorname ?? ''

const getProductSize = (item: CartItem) =>
  item.productSize ?? item.sizename ?? ''

export default function Cart() {
  const { appState } = useApp()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const isLogged = appState.loggedIn
  const cartlist = useAppSelector((state) => state.cartWishlist.cart)
  const defaultAccount = useAppSelector(
    (state) => state.userState.defaultAccount,
  )
  const dispatch = useAppDispatch()
  const { menu, toggleCart } = useMenu()
  const [selectedCartItemIDs, setSelectedCartItemIDs] = useState<number[]>([])

  const userID = getAccountID(defaultAccount)

  const selectedItems = cartlist.filter((item) =>
    selectedCartItemIDs.includes(getCartItemID(item)),
  )

  const total = selectedItems.reduce((sum, item) => {
    return (
      sum +
      getFinalPrice(getProductPrice(item), item.discount) *
        Math.max(1, toNumber(item.quantity))
    )
  }, 0)

  const selectableCartItemIDs = cartlist
    .map((item) => getCartItemID(item))
    .filter((id) => id > 0)

  const selectedCheckoutIDs = selectedCartItemIDs.filter((id) =>
    selectableCartItemIDs.includes(id),
  )

  const allSelected =
    cartlist.length > 0 &&
    selectableCartItemIDs.length > 0 &&
    selectedCheckoutIDs.length === selectableCartItemIDs.length

  useEffect(() => {
    setSelectedCartItemIDs((current) => {
      const validCurrent = current.filter((id) => selectableCartItemIDs.includes(id))
      if (validCurrent.length > 0) return validCurrent
      return selectableCartItemIDs
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartlist])

  const toggleSelectedItem = (cartItemID: number) => {
    if (!cartItemID) return

    setSelectedCartItemIDs((current) => {
      return current.includes(cartItemID)
        ? current.filter((id) => id !== cartItemID)
        : [...current, cartItemID]
    })
  }

  const toggleSelectAll = () => {
    setSelectedCartItemIDs(allSelected ? [] : selectableCartItemIDs)
  }

  async function removeItem(product: CartItem) {
    const cartItemID = getCartItemID(product)
    const productID = getProductID(product)

    setMessage('')

    if (isLogged && (!userID || !cartItemID)) {
      setMessage(
        'Sản phẩm thiếu cartItemID hoặc userID. Hãy đăng nhập lại rồi thử xoá.',
      )
      return
    }

    setLoading(true)

    try {
      if (isLogged) {
        const res = await cartDeleteHandler({
          userID,
          cartItemID,
        })

        if (res.status !== 200) {
          setMessage(getError(res, 'Không xoá được sản phẩm khỏi giỏ hàng.'))
          return
        }
      }

      dispatch(
        removeItemFromCart({
          cartItemID,
          productID,
          productColor: getProductColor(product),
          productSize: getProductSize(product),
        }),
      )
    } finally {
      setLoading(false)
    }
  }

  const changeValue = async (
    action: 'increase' | 'decrease',
    cartItemID: number,
    selectedQuantity: number,
    productID: number,
    stock: number | null,
  ) => {
    setMessage('')

    if (action === 'decrease' && selectedQuantity <= 1) return

    if (action === 'increase' && stock !== null && stock > 0) {
      if (selectedQuantity >= stock) {
        setMessage(`Sản phẩm chỉ còn ${stock} sản phẩm trong kho.`)
        return
      }
    }

    if (isLogged && (!userID || !cartItemID)) {
      setMessage(
        'Sản phẩm thiếu cartItemID hoặc userID. Hãy đăng nhập lại rồi thử cập nhật.',
      )
      return
    }

    setLoading(true)

    try {
      const res = isLogged
        ? await cartQuantityHandler(
            cartItemID,
            productID,
            userID,
            action === 'increase' ? 'increment' : 'decrement',
          )
        : { status: 200 }

      if (res.status === 200) {
        dispatch(
          setCart(
            cartlist.map((each) => {
              if (getCartItemID(each) !== cartItemID) return each

              const currentQuantity = Math.max(1, toNumber(each.quantity))
              const nextQuantity =
                action === 'increase'
                  ? currentQuantity + 1
                  : currentQuantity - 1

              const safeQuantity =
                stock !== null && stock > 0
                  ? Math.min(Math.max(1, nextQuantity), stock)
                  : Math.max(1, nextQuantity)

              return {
                ...each,
                quantity: safeQuantity,
              }
            }),
          ),
        )
      } else {
        setMessage(getError(res, 'Số lượng mua vượt quá số lượng trong kho.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition show={menu.cart} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={toggleCart}>
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
                        <DialogTitle className="text-lg font-medium text-gray-900">
                          Giỏ hàng
                        </DialogTitle>

                        <button
                          type="button"
                          className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={toggleCart}
                        >
                          <span className="sr-only">Đóng</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {loading && <Loading />}

                      {message && (
                        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                          {message}
                        </p>
                      )}

                      <div className="mt-8">
                        {cartlist.length > 0 && (
                          <label className="mb-4 flex items-center gap-3 text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleSelectAll}
                              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            Chọn tất cả sản phẩm
                          </label>
                        )}

                        <div className="flow-root">
                          {cartlist.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-500">
                              Giỏ hàng đang trống.
                            </p>
                          ) : (
                            <ul
                              role="list"
                              className="-my-6 divide-y divide-gray-200"
                            >
                              {cartlist.map((product) => {
                                const cartItemID = getCartItemID(product)
                                const productID = getProductID(product)
                                const quantity = Math.max(
                                  1,
                                  toNumber(product.quantity),
                                )
                                const stock = getProductStock(product)
                                const price = getFinalPrice(
                                  getProductPrice(product),
                                  product.discount,
                                )

                                return (
                                  <li
                                    key={`${cartItemID || productID}-${getProductColor(product)}-${getProductSize(product)}`}
                                    className="flex gap-3 py-6"
                                  >
                                    <div className="pt-9">
                                      <input
                                        type="checkbox"
                                        checked={selectedCheckoutIDs.includes(cartItemID)}
                                        onChange={() => toggleSelectedItem(cartItemID)}
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        aria-label={`Chọn ${getProductName(product)}`}
                                      />
                                    </div>

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
                                            <Link
                                              href={`/product/${productID}`}
                                              onClick={toggleCart}
                                            >
                                              {getProductName(product)}
                                            </Link>
                                          </h3>

                                          <p className="whitespace-nowrap">
                                            {formatPrice(price)}
                                          </p>
                                        </div>

                                        {getProductColor(product) && (
                                          <p className="mt-1 text-sm text-gray-500">
                                            Màu: {getProductColor(product)}
                                          </p>
                                        )}

                                        {getProductSize(product) && (
                                          <p className="mt-1 text-sm text-gray-500">
                                            Size: {getProductSize(product)}
                                          </p>
                                        )}

                                        {stock !== null && stock <= 0 ? (
                                          <p className="mt-1 text-sm text-red-500">
                                            Hết hàng
                                          </p>
                                        ) : (
                                          <p className="mt-1 text-sm text-green-600">
                                            {stock === null
                                              ? 'Còn hàng'
                                              : `Còn ${stock} sản phẩm`}
                                          </p>
                                        )}

                                        <p className="mt-1 text-sm font-medium text-gray-700">
                                          Thành tiền:{' '}
                                          {formatPrice(price * quantity)}
                                        </p>
                                      </div>

                                      <div className="mt-4 flex flex-1 items-end justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                          <span>SL</span>

                                          <div className="flex items-center rounded-md bg-gray-100">
                                            <button
                                              type="button"
                                              disabled={loading || quantity <= 1}
                                              onClick={() =>
                                                changeValue(
                                                  'decrease',
                                                  cartItemID,
                                                  quantity,
                                                  productID,
                                                  stock,
                                                )
                                              }
                                              className="w-10 text-2xl leading-9 disabled:cursor-not-allowed disabled:text-gray-300"
                                            >
                                              -
                                            </button>

                                            <span className="w-8 text-center text-gray-900">
                                              {quantity}
                                            </span>

                                            <button
                                              type="button"
                                              disabled={
                                                loading ||
                                                (stock !== null &&
                                                  stock > 0 &&
                                                  quantity >= stock)
                                              }
                                              onClick={() =>
                                                changeValue(
                                                  'increase',
                                                  cartItemID,
                                                  quantity,
                                                  productID,
                                                  stock,
                                                )
                                              }
                                              className="w-10 text-2xl leading-9 disabled:cursor-not-allowed disabled:text-gray-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>

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
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Tạm tính</p>
                        <p>{formatPrice(total)}</p>
                      </div>

                      {cartlist.length > 0 && selectedCheckoutIDs.length === 0 && (
                        <p className="mt-2 text-sm text-red-600">
                          Vui lòng chọn ít nhất một sản phẩm để thanh toán.
                        </p>
                      )}

                      <p className="mt-0.5 text-sm text-gray-500">
                        Phí vận chuyển được tính ở bước thanh toán.
                      </p>

                      <div className="mt-6">
                        {isLogged ? (
                          <Link
                            href={`/cart-checkout?items=${selectedCheckoutIDs.join(',')}`}
                            onClick={toggleCart}
                            className={`flex items-center justify-center rounded-md border border-transparent px-6 py-3 text-base font-medium text-white shadow-sm ${
                              selectedCheckoutIDs.length === 0
                                ? 'pointer-events-none bg-gray-300'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            Thanh toán
                          </Link>
                        ) : (
                          <Link
                            href="/sign-in"
                            onClick={toggleCart}
                            className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                          >
                            Đăng nhập để thanh toán
                          </Link>
                        )}
                      </div>

                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                        <button
                          type="button"
                          onClick={toggleCart}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
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
