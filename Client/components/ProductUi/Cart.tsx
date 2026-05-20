import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useMenu } from '@/Helpers/MenuContext'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { setCart, formatPrice, getProductPrice, CartItem } from '@/features/UIUpdates/CartWishlist'
import { cartDeleteHandler } from '@/app/api/itemLists'
import { useApp } from '@/Helpers/AccountDialog'
import Loading from '../Loading'
import { cartQuantityHandler } from '@/app/api/userUpdate'

const num = (value: unknown) => Number(value || 0)

const getCartItemID = (item: CartItem) => num(item.cartItemID ?? item.cartitemid)
const getProductID = (item: CartItem) => num(item.productID ?? item.productid)
const getProductName = (item: CartItem) => item.productName ?? item.title ?? 'Sản phẩm'
const getProductImage = (item: CartItem) => item.productImg ?? item.imglink ?? '/no-image.png'
const getProductAlt = (item: CartItem) => item.productAlt ?? item.imgalt ?? getProductName(item)
const getProductColor = (item: CartItem) => item.productColor ?? item.colorname ?? 'Đỏ'
const getProductSize = (item: CartItem) => item.productSize ?? item.sizename ?? 'S'
const getProductStock = (item: CartItem) => num(item.productStock ?? item.productstock ?? item.stock)

export default function Cart() {
  const { appState } = useApp()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isLogged = appState.loggedIn
  const cartlist = useAppSelector((state) => state.cartWishlist.cart)
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const dispatch = useAppDispatch()
  const { menu, toggleCart } = useMenu()

  const total = cartlist.reduce((sum, item) => {
    return sum + getProductPrice(item) * num(item.quantity)
  }, 0)

  async function removeItem(cartItemID: number, productID: number) {
    setLoading(true)
    if (isLogged) await cartDeleteHandler({ userID: defaultAccount.userID, cartItemID })
    dispatch(setCart(cartlist.filter((each) => getCartItemID(each) !== cartItemID)))
    setLoading(false)
  }

  const changeValue = async (
    action: 'increase' | 'decrease',
    cartItemID: number,
    selectedQuantity: number,
    productID: number,
    stock?: number,
  ) => {
    setMessage('')

    if (action === 'increase') {
      const maxStock = Number(stock || 0)
      if (maxStock > 0 && selectedQuantity >= maxStock) {
        setMessage(`Sản phẩm chỉ còn ${maxStock} sản phẩm trong kho.`)
        return
      }

      setLoading(true)
      const res = isLogged
        ? await cartQuantityHandler(cartItemID, productID, defaultAccount.userID, 'increment')
        : { status: 200 }

      if (res.status === 200) {
        dispatch(
          setCart(
            cartlist.map((each) =>
              getCartItemID(each) === cartItemID ? { ...each, quantity: num(each.quantity) + 1 } : each,
            ),
          ),
        )
      } else {
        setMessage('Số lượng mua vượt quá số lượng trong kho.')
      }
      setLoading(false)
      return
    }

    if (action === 'decrease' && selectedQuantity > 1) {
      setLoading(true)
      if (isLogged) await cartQuantityHandler(cartItemID, productID, defaultAccount.userID, 'decrement')
      dispatch(
        setCart(
          cartlist.map((each) =>
            getCartItemID(each) === cartItemID ? { ...each, quantity: num(each.quantity) - 1 } : each,
          ),
        ),
      )
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
                        <DialogTitle className="text-lg font-medium text-gray-900">Shopping cart</DialogTitle>
                        <button type="button" className="relative -m-2 p-2 text-gray-400 hover:text-gray-500" onClick={toggleCart}>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {loading && <Loading />}
                      {message && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>}

                      <div className="mt-8">
                        <div className="flow-root">
                          <ul role="list" className="-my-6 divide-y divide-gray-200">
                            {cartlist.map((product) => {
                              const cartItemID = getCartItemID(product)
                              const productID = getProductID(product)
                              const quantity = num(product.quantity)
                              const stock = getProductStock(product)

                              return (
                                <li key={`${cartItemID}-${productID}`} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img src={getProductImage(product)} alt={getProductAlt(product)} className="h-full w-full object-cover object-center" />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>{getProductName(product)}</h3>
                                        <p className="ml-4 whitespace-nowrap">{formatPrice(getProductPrice(product))}</p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">{getProductColor(product)}</p>
                                      <p className="mt-1 text-sm text-gray-500">{getProductSize(product)}</p>
                                    </div>

                                    <div className="mt-4 flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <span>Qty</span>
                                        <div className="flex items-center rounded-md bg-gray-100">
                                          <button type="button" onClick={() => changeValue('decrease', cartItemID, quantity, productID, stock)} className="w-10 text-2xl leading-9">-</button>
                                          <span className="w-8 text-center text-gray-900">{quantity}</span>
                                          <button type="button" onClick={() => changeValue('increase', cartItemID, quantity, productID, stock)} className="w-10 text-2xl leading-9">+</button>
                                        </div>
                                      </div>
                                      <button type="button" onClick={() => removeItem(cartItemID, productID)} className="font-medium text-indigo-600 hover:text-indigo-500">
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
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal</p>
                        <p>{formatPrice(total)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">Shipping calculated at checkout.</p>
                      <div className="mt-6">
                        {isLogged ? (
                          <Link href="/checkout" onClick={toggleCart} className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700">
                            Checkout
                          </Link>
                        ) : (
                          <Link href="/login" onClick={toggleCart} className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700">
                            Login to Checkout
                          </Link>
                        )}
                      </div>
                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                        <button type="button" onClick={toggleCart} className="font-medium text-indigo-600 hover:text-indigo-500">
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
