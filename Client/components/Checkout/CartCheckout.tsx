'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useRouter, useSearchParams } from 'next/navigation'
import userData from '@/controllers/userData'
import useAuth from '@/controllers/Authentication'
import { useApp } from '@/Helpers/AccountDialog'
import Loading from '../Loading'
import {
  cartOnlineCheckoutHandler,
  cartPaymentOnDeliveryHandler,
  checkoutCartProductDataHandler,
  paymentMethodsHandler,
  PaymentMethod,
} from '@/app/api/paymentSystem'

type ProductDetails = {
  title?: string
  price?: string | number
  discount?: string | number
  sizename?: string
  colorname?: string
  imglink?: string
  imgalt?: string
  shippingcost?: string | number
  quantity?: string | number
}

type Address = {
  addressID?: number
  addressid?: number
  addressType?: string
  contactNumber?: number | string
  mobile_number?: number | string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  userName?: string
  is_default?: boolean
}

type Account = {
  userID?: number
  userid?: number
  userName?: string
  username?: string
  email?: string
  mobile_number?: number | string
  dob?: string
  role?: string
}

type GiftOptions = {
  gift_wrapping: boolean
  gift_wrap_style: string
  gift_message_template: string
  gift_message: string
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))

const getUserID = (account: Account) => toNumber(account.userID ?? account.userid)
const getAddressID = (address: Address) => toNumber(address.addressID ?? address.addressid)
const getSalePrice = (item: ProductDetails) => {
  const discount = toNumber(item.discount)
  const price = toNumber(item.price)
  return discount > 0 ? discount : price
}

const getPaymentFee = (payment?: PaymentMethod | null) => {
  const config = payment?.config as { fee?: number } | undefined
  return toNumber(config?.fee)
}

export default function CartCheckout() {
  const { appState } = useApp()
  const loggedIn = appState.loggedIn
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkSession } = useAuth()
  const { grabUserData } = userData()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [dialogType, setDialogType] = useState<null | 'addressRequired' | 'defaultAddressRequired'>(null)
  const [products, setProducts] = useState<ProductDetails[]>([])
  const [account, setAccount] = useState<Account>({})
  const [address, setAddress] = useState<Address>({})
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPayment, setSelectedPayment] = useState<string>('cod')
  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    gift_wrapping: false,
    gift_wrap_style: '',
    gift_message_template: '',
    gift_message: '',
  })

  const selectedCartItemIDs = useMemo(() => {
    const rawItems = searchParams.get('items') || ''
    return rawItems
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0)
  }, [searchParams])

  const activePayment = useMemo(
    () => paymentMethods.find((method) => String(method.name) === selectedPayment),
    [paymentMethods, selectedPayment],
  )

  const subTotal = products.reduce(
    (sum, item) => sum + getSalePrice(item) * Math.max(1, toNumber(item.quantity)),
    0,
  )

  const originalTotal = products.reduce(
    (sum, item) => sum + toNumber(item.price) * Math.max(1, toNumber(item.quantity)),
    0,
  )

  const discount = Math.max(0, originalTotal - subTotal)
  const shipping = products.reduce(
    (sum, item) => sum + toNumber(item.shippingcost) * Math.max(1, toNumber(item.quantity)),
    0,
  )
  const paymentFee = selectedPayment === 'cod' ? 0 : getPaymentFee(activePayment)
  const totalAmount = subTotal + shipping + paymentFee

  const finalGiftMessage =
    giftOptions.gift_message.trim() !== ''
      ? giftOptions.gift_message.trim()
      : giftOptions.gift_message_template

  useEffect(() => {
    async function sync() {
      setLoading(true)
      setMessage('')

      try {
        const sessionCheck = await checkSession()
        const userDataCheck = await grabUserData()

        if (!sessionCheck?.success || !sessionCheck.data || !userDataCheck?.success) {
          router.push('/sign-in')
          return
        }

        const currentAccount: Account = sessionCheck.data
        const sessionUserID = getUserID(currentAccount)

        if (!sessionUserID) {
          router.push('/sign-in')
          return
        }

        const checkoutData = await checkoutCartProductDataHandler(
          sessionUserID,
          selectedCartItemIDs.length > 0 ? selectedCartItemIDs : undefined,
        )

        if (checkoutData.status !== 200) {
          setMessage(checkoutData.error || 'Không lấy được dữ liệu sản phẩm trong giỏ hàng.')
          setLoading(false)
          return
        }

        const fetchedProducts = checkoutData.data?.products ?? []
        if (!Array.isArray(fetchedProducts) || fetchedProducts.length === 0) {
          setMessage('Không có sản phẩm nào được chọn để thanh toán.')
          setLoading(false)
          return
        }

        setProducts(fetchedProducts)
        setAccount(currentAccount)

        const addresses = userDataCheck.addresses ?? []
        if (addresses.length === 0) {
          setDialogType('addressRequired')
          setLoading(false)
          return
        }

        const defaultAddress = addresses.find((each: Address) => each.is_default) ?? addresses[0]
        setAddress(defaultAddress)

        if (!getAddressID(defaultAddress)) {
          setDialogType('defaultAddressRequired')
          setLoading(false)
          return
        }

        const methods = await paymentMethodsHandler()
        const activeMethods = Array.isArray(methods.data)
          ? methods.data.filter((method: PaymentMethod) => method.status)
          : []
        setPaymentMethods(activeMethods)
      } catch (error) {
        console.error(error)
        setMessage('Có lỗi khi tải trang thanh toán. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCartItemIDs.join(',')])

  async function createOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!loggedIn) {
      router.push('/sign-in')
      return
    }

    const userID = getUserID(account)
    if (!userID) {
      setMessage('Không tìm thấy userID. Hãy đăng nhập lại.')
      return
    }

    if (products.length === 0) {
      setMessage('Không có sản phẩm để thanh toán.')
      return
    }

    setLoading(true)
    setMessage('')

    const payload = {
      userID,
      cartItemIDs: selectedCartItemIDs.length > 0 ? selectedCartItemIDs : undefined,
      gift_wrapping: giftOptions.gift_wrapping,
      gift_wrap_style: giftOptions.gift_wrap_style || null,
      gift_message: finalGiftMessage || null,
    }

    const response =
      selectedPayment === 'cod'
        ? await cartPaymentOnDeliveryHandler(payload)
        : await cartOnlineCheckoutHandler({ ...payload, paymentMethod: selectedPayment })

    setLoading(false)

    if (response.status === 200) {
      const orderID = response.data?.orderid ?? response.data?.orderID ?? response.data?.order_id
      router.push(orderID ? `/cart-confirmation/${orderID}` : '/orders')
      return
    }

    setMessage(response.error || 'Tạo đơn hàng thất bại. Vui lòng kiểm tra lại.')
  }

  const name = account.userName ?? account.username ?? address.userName ?? ''

  return (
    <>
      <Dialog open={dialogType === 'addressRequired'} onClose={() => setDialogType(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">Address Required</DialogTitle>
            <p className="mt-2 text-sm text-gray-600">Please add an address to proceed with checkout.</p>
            <button
              type="button"
              onClick={() => router.push('/account-settings')}
              className="mt-5 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
            >
              Go to Account Settings
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={dialogType === 'defaultAddressRequired'} onClose={() => setDialogType(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">Default Address Required</DialogTitle>
            <p className="mt-2 text-sm text-gray-600">
              Please add a default address or set an existing address to default to proceed with checkout.
            </p>
            <button
              type="button"
              onClick={() => router.push('/account-settings')}
              className="mt-5 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
            >
              Go to Account Settings
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      {loading && <Loading />}

      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <ol className="mb-8 flex items-center gap-4 text-sm font-medium text-gray-500 sm:text-base">
            <li className="flex items-center text-primary-700">1. Product</li>
            <li className="flex items-center text-primary-700">2. Checkout</li>
            <li className="flex items-center">3. Order summary</li>
          </ol>

          {message && (
            <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600">
              {message}
            </p>
          )}

          <form id="informational-form" onSubmit={createOrder} className="lg:flex lg:items-start lg:gap-12">
            <div className="min-w-0 flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Details</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Your name</span>
                    <input readOnly value={name} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Your email*</span>
                    <input readOnly value={account.email ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Country*</span>
                    <input readOnly value={address.country ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">City*</span>
                    <input readOnly value={address.city ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Phone Number*</span>
                    <input readOnly value={address.contactNumber ?? address.mobile_number ?? account.mobile_number ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Pin Code</span>
                    <input readOnly value={address.postalCode ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Address 1</span>
                    <input readOnly value={address.addressLine1 ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Address 2</span>
                    <input readOnly value={address.addressLine2 ?? ''} className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm" />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Payment</h3>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
                  <input
                    id="pay-on-delivery"
                    type="radio"
                    name="payment-method"
                    checked={selectedPayment === 'cod'}
                    onChange={() => setSelectedPayment('cod')}
                    className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">Payment on delivery</span>
                    <span className="block text-sm text-gray-500">Thanh toán khi nhận hàng</span>
                  </span>
                </label>

                {paymentMethods.map((method) => (
                  <label key={method.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedPayment === method.name}
                      onChange={() => setSelectedPayment(method.name)}
                      className="mt-1 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                    <span>
                      <span className="block font-medium text-gray-900">{method.name}</span>
                      <span className="block text-sm text-gray-500">{method.type}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Gift Options</h3>
                <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
                  <input
                    type="checkbox"
                    checked={giftOptions.gift_wrapping}
                    onChange={(e) =>
                      setGiftOptions({ ...giftOptions, gift_wrapping: e.target.checked })
                    }
                  />
                  Add Gift Wrapping
                </label>

                <select
                  value={giftOptions.gift_wrap_style}
                  onChange={(e) => setGiftOptions({ ...giftOptions, gift_wrap_style: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
                >
                  <option value="">Select a wrapping style</option>
                  <option value="Classic Red">Classic Red</option>
                  <option value="Birthday Theme">Birthday Theme</option>
                  <option value="Christmas Theme">Christmas Theme</option>
                  <option value="Baby Blue">Baby Blue</option>
                  <option value="Princess Pink">Princess Pink</option>
                </select>

                <select
                  value={giftOptions.gift_message_template}
                  onChange={(e) => setGiftOptions({ ...giftOptions, gift_message_template: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
                >
                  <option value="">Select a message template</option>
                  <option value="Happy Birthday! Wishing you joy and creativity!">Happy Birthday! Wishing you joy and creativity!</option>
                  <option value="A special gift just for you!">A special gift just for you!</option>
                  <option value="Merry Christmas!">Merry Christmas!</option>
                </select>

                <textarea
                  value={giftOptions.gift_message}
                  onChange={(e) => setGiftOptions({ ...giftOptions, gift_message: e.target.value })}
                  placeholder="Personal Message"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <aside className="mt-8 w-full space-y-6 lg:mt-0 lg:max-w-sm xl:max-w-md">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Order summary</h3>

                <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                  {products.map((item, index) => {
                    const quantity = Math.max(1, toNumber(item.quantity))
                    const price = getSalePrice(item)
                    return (
                      <div key={`${item.title}-${index}`} className="flex gap-4 border-b border-gray-100 pb-4">
                        <img
                          src={item.imglink || '/no-image.png'}
                          alt={item.imgalt || item.title || 'Product'}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          {item.sizename && <p className="text-sm text-gray-500">Size: {item.sizename}</p>}
                          {item.colorname && <p className="text-sm text-gray-500">Color: {item.colorname}</p>}
                          <p className="text-sm text-gray-500">Quantity: {quantity}</p>
                          <p className="mt-1 font-semibold text-gray-900">{formatPrice(price)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 divide-y divide-gray-200">
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-normal text-gray-500">Subtotal</dt>
                    <dd className="text-base font-medium text-gray-900">{formatPrice(subTotal)}</dd>
                  </dl>
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-normal text-gray-500">Shipping Charge</dt>
                    <dd className="text-base font-medium text-gray-900">{formatPrice(shipping)}</dd>
                  </dl>
                  {paymentFee > 0 && (
                    <dl className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-base font-normal text-gray-500">Payment Processing Charge</dt>
                      <dd className="text-base font-medium text-gray-900">{formatPrice(paymentFee)}</dd>
                    </dl>
                  )}
                  {discount > 0 && (
                    <dl className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-base font-normal text-gray-500">Discount</dt>
                      <dd className="text-base font-medium text-green-600">-{formatPrice(discount)}</dd>
                    </dl>
                  )}
                  <dl className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-base font-bold text-gray-900">Total</dt>
                    <dd className="text-base font-bold text-gray-900">{formatPrice(totalAmount)}</dd>
                  </dl>
                </div>

                <button
                  disabled={!loggedIn || loading || products.length === 0}
                  type="submit"
                  className="mt-5 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Place Order
                </button>
              </div>
            </aside>
          </form>
        </div>
      </section>
    </>
  )
}
