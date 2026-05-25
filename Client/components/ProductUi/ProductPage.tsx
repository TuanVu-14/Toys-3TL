import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Stars from './Stars'
import { HeartIcon } from '@heroicons/react/24/outline'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  addItemToCart,
  addItemToWishlist,
  formatPrice,
  getFinalPrice,
} from '@/features/UIUpdates/CartWishlist'
import ReviewSection from './Product/ReviewSection'
import ProductNotFound from './Product/ProductNotFound'
import productDataHandler from '@/app/api/product'
import { useParams, useRouter } from 'next/navigation'
import Loading from '../Loading'
import { cartAddHandler, wishlistAddHandler } from '@/app/api/itemLists'
import { useApp } from '@/Helpers/AccountDialog'
import ProductDialogs from './ProductDialogs'
import Link from 'next/link'

interface Review {
  reviewid: number
  userid: number
  rating: number
  title: string
  comment: string
  username: string
  createdat: string
  productstars: number
}

interface ProductImage {
  imageid: number
  imglink: string
  imgalt: string
}


interface Categories {
  subcategory: string
  maincategory: string
}

interface Product {
  productid: number
  title: string
  description: string
  stock: number
  discountedprice: string | number
  price: string | number
  stars: number
  seller: string
  brand_name?: string
  manufacturer_info?: string
  certification_details?: string
  collection_names?: string
  reviewcount: number
  categories: Categories
  imglink: string
  imgalt: string
  imgcollection: ProductImage[]
  reviews: Review[]
  discount: number
}

const defaultData: Product = {
  productid: 0,
  title: '',
  description: '',
  stock: 0,
  discountedprice: 0,
  price: 0,
  stars: 0,
  seller: '',
  brand_name: '',
  manufacturer_info: '',
  certification_details: '',
  collection_names: '',
  reviewcount: 0,
  categories: { subcategory: '', maincategory: '' },
  imglink: '',
  imgalt: '',
  imgcollection: [],
  reviews: [],
  discount: 0,
}

const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100)

const normalizeSlug = (value: string) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getAccountID = (account: unknown) =>
  Number(
    (account as { userID?: number; userid?: number })?.userID ??
      (account as { userid?: number })?.userid ??
      0,
  )

const ProductPage = () => {
  const { appState } = useApp()
  const router = useRouter()
  const params = useParams<{ productID: string }>()
  const dispatch = useAppDispatch()
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)

  const userID = getAccountID(defaultAccount)
  const isLogged = appState.loggedIn
  const reviewRef = useRef<HTMLDivElement | null>(null)

  const [data, setData] = useState<Product>(defaultData)
  const [dataChecked, setDataChecked] = useState(false)
  const [found, setFound] = useState(true)
  const [loading, setLoading] = useState(false)
  const [btnLoading, setBtnLoading] = useState(false)
  const [stockMessage, setStockMessage] = useState('')
  const [toast, setToast] = useState('')
  const [dialogType, setDialogType] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [selectedRating, setSelectedRating] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const maxQuantity = Number(data.stock || 0)
  const outOfStock = maxQuantity <= 0

  const images = useMemo(() => {
    const allImages: ProductImage[] = [
      { imageid: -1, imglink: data.imglink, imgalt: data.imgalt || data.title },
      ...(data.imgcollection || []),
    ].filter((img) => Boolean(img.imglink))

    return allImages.filter(
      (img, index, arr) => arr.findIndex((x) => x.imglink === img.imglink) === index,
    )
  }, [data.imglink, data.imgalt, data.title, data.imgcollection])

  const selectedImage = images[selectedImageIndex] || images[0]
  const finalPrice = getFinalPrice(data.price || data.discountedprice, data.discount)

  useEffect(() => {
    if (!toast) return undefined

    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  async function dataRequest() {
    setLoading(true)

    const response = await productDataHandler({ productID: params.productID })

    if (response.status === 200 && response.data?.data) {
      const product = response.data.data as Product
      const normalizedReviews: Review[] = (product.reviews || []).map((review) => ({
        ...review,
        productstars: review.productstars ?? review.rating ?? 0,
      }))

      setData({
        ...product,
        reviews: normalizedReviews,
        imgcollection: product.imgcollection || [],
        stock: Number(product.stock || 0),
        discount: Number(product.discount || 0),
      })
      setFound(true)

      setSelectedImageIndex(0)
      setQuantity(1)
    } else {
      setFound(false)
    }

    setDataChecked(true)
    setLoading(false)
  }

  useLayoutEffect(() => {
    dataRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.productID])

  const changeValue = (action: 'increase' | 'decrease') => {
    setStockMessage('')

    if (action === 'increase') {
      if (quantity >= maxQuantity) {
        setStockMessage(`Sản phẩm chỉ còn ${maxQuantity} sản phẩm trong kho.`)
        return
      }

      setQuantity(quantity + 1)
    }

    if (action === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const changeImage = (action: 'prev' | 'next') => {
    if (images.length <= 1) return

    setSelectedImageIndex((prev) => {
      if (action === 'prev') return prev === 0 ? images.length - 1 : prev - 1
      return prev === images.length - 1 ? 0 : prev + 1
    })
  }

  const handleReviewClick = () => reviewRef.current?.scrollIntoView({ behavior: 'smooth' })

  async function itemStateUpdate(key: 'cart' | 'wishlist') {
    setStockMessage('')

    if (outOfStock) {
      setStockMessage('Sản phẩm đã hết hàng.')
      return
    }

    if (quantity > maxQuantity) {
      setStockMessage(`Sản phẩm chỉ còn ${maxQuantity} sản phẩm trong kho.`)
      return
    }

    setBtnLoading(true)

    const commonProductData = {
      productID: data.productid,
      productid: data.productid,
      productImg: selectedImage?.imglink || data.imglink,
      imglink: selectedImage?.imglink || data.imglink,
      productAlt: selectedImage?.imgalt || data.imgalt,
      imgalt: selectedImage?.imgalt || data.imgalt,
      productName: data.title,
      title: data.title,
      productPrice: Number(data.price || data.discountedprice || 0),
      price: Number(data.price || data.discountedprice || 0),
      discount: Number(data.discount || 0),
      productStock: Number(data.stock || 0),
      stock: Number(data.stock || 0),
    }

    const cartItemData = {
      cartItemID: IDGenerator(),
      ...commonProductData,
      quantity,
    }

    const wishlistItem = {
      wishlistItemID: IDGenerator(),
      ...commonProductData,
    }

    switch (key) {
      case 'cart': {
        if (isLogged) {
          const res = await cartAddHandler({
            cartItemID: cartItemData.cartItemID,
            userID,
            productID: data.productid,
            productPrice: finalPrice,
            quantity,
          })

          if (res.status !== 200) {
            setStockMessage('Số lượng mua vượt quá số lượng trong kho.')
            setBtnLoading(false)
            return
          }
        }

        dispatch(addItemToCart(cartItemData))
        setToast('Đã thêm sản phẩm vào giỏ hàng')
        break
      }

      case 'wishlist': {
        if (isLogged) {
          await wishlistAddHandler({
            wishlistItemID: wishlistItem.wishlistItemID,
            userID,
            productID: data.productid,
          })
        }

        dispatch(addItemToWishlist(wishlistItem))
        setToast('Đã thêm sản phẩm vào yêu thích')
        break
      }

      default:
        break
    }

    setBtnLoading(false)
  }

  function categoryLink(maincategory: string, category: string) {
    return `/sub-category/${normalizeSlug(maincategory)}/${normalizeSlug(category)}`
  }

  return (
    <>
      {loading && <Loading />}

      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {!dataChecked && <Loading />}
      {dataChecked && !found && <ProductNotFound />}

      {dataChecked && data && found && (
        <div className="mx-auto w-[90%] max-w-7xl py-8">
          <div className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-indigo-600">
              Trang chủ
            </Link>{' '}
            ›{' '}
            <Link
              href={categoryLink(data.categories.maincategory, data.categories.subcategory)}
              className="hover:text-indigo-600"
            >
              {data.categories.maincategory} › {data.categories.subcategory}
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="relative overflow-hidden rounded-2xl border bg-white">
                <img
                  src={selectedImage?.imglink || data.imglink || '/no-image.png'}
                  alt={selectedImage?.imgalt || data.imgalt || data.title}
                  className="h-[520px] w-full object-contain"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => changeImage('prev')}
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-indigo-600 hover:text-white"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>

                    <button
                      type="button"
                      onClick={() => changeImage('next')}
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-indigo-600 hover:text-white"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {images.map((each, index) => (
                    <button
                      type="button"
                      key={`${each.imageid}-${each.imglink}`}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white p-1 transition ${
                        selectedImageIndex === index
                          ? 'border-indigo-600 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <img
                        src={each.imglink}
                        alt={each.imgalt || data.title}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div>
                <div>
                  <p className="text-sm text-gray-500"># {data.productid}</p>
                  <h1 className="mt-2 text-4xl font-bold text-gray-900">{data.title}</h1>
                  <p className="mt-2 text-sm text-gray-500">By {data.seller}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReviewClick}
                className="mt-4 flex items-center gap-3 text-sm text-gray-600 hover:text-indigo-600"
              >
                <Stars stars={Number(data.stars || 0)} />
                {data.reviewcount > 0 ? (
                  <span>
                    {Number(data.stars || 0).toFixed(1)} · {data.reviewcount} đánh giá
                  </span>
                ) : (
                  <span>Chưa có đánh giá</span>
                )}
              </button>

              <div className="mt-6 flex items-end gap-4">
                <p className="text-3xl font-bold text-red-500">
                  {formatPrice(data.price || data.discountedprice, data.discount)}
                </p>

                {Number(data.discount || 0) > 0 && (
                  <>
                    <p className="text-lg text-gray-400 line-through">{formatPrice(data.price)}</p>
                    <p className="text-sm text-red-400">{Number(data.discount)}% off</p>
                  </>
                )}
              </div>

              <p className={`mt-4 text-sm ${outOfStock ? 'text-red-500' : 'text-gray-500'}`}>
                {outOfStock
                  ? 'Hết hàng'
                  : `Còn ${data.stock} sản phẩm trong kho, giao trong 5 ngày làm việc`}
              </p>

              <div className="mt-6 space-y-2 text-sm text-gray-600">
                {data.brand_name && <p><strong>Thương hiệu:</strong> {data.brand_name}</p>}
                {data.manufacturer_info && <p><strong>Nhà sản xuất:</strong> {data.manufacturer_info}</p>}
                {data.certification_details && <p><strong>Chứng chỉ an toàn:</strong> {data.certification_details}</p>}
                {data.collection_names && <p><strong>Bộ sưu tập:</strong> {data.collection_names}</p>}
              </div>

              <div className="mt-8">
                <p className="mb-2 font-semibold text-gray-900">Quantity</p>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => changeValue('decrease')}
                    className="w-12 rounded-l-lg bg-gray-100 text-3xl"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (!value || value < 1) return setQuantity(1)

                      if (value > maxQuantity) {
                        setStockMessage(`Sản phẩm chỉ còn ${maxQuantity} sản phẩm trong kho.`)
                        return setQuantity(maxQuantity)
                      }

                      setStockMessage('')
                      setQuantity(value)
                    }}
                    className="w-16 bg-gray-100 py-2 text-center outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => changeValue('increase')}
                    className="w-12 rounded-r-lg bg-gray-100 text-3xl"
                  >
                    +
                  </button>
                </div>

                {stockMessage && <p className="mt-2 text-sm text-red-500">{stockMessage}</p>}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  disabled={btnLoading || outOfStock}
                  onClick={() => itemStateUpdate('cart')}
                  className="h-12 w-48 rounded-lg bg-yellow-400 font-semibold transition hover:border-2 hover:border-yellow-400 hover:bg-white disabled:cursor-not-allowed disabled:bg-gray-200"
                >
                  {btnLoading ? 'Loading...' : 'ADD TO CART'}
                </button>

                <button
                  type="button"
                  disabled={btnLoading || outOfStock || quantity > maxQuantity}
                  onClick={() =>
                    router.push(`/checkout/${data.productid}?qty=${quantity}`)
                  }
                  className="h-12 w-48 rounded-lg border-2 border-yellow-400 font-semibold transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                >
                  BUY NOW
                </button>
              </div>

              <button
                type="button"
                onClick={() => itemStateUpdate('wishlist')}
                className="mt-6 flex items-center gap-2 text-gray-600 hover:text-yellow-500"
              >
                <HeartIcon className="h-5 w-5" /> Add to wishlist
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_420px]">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Description:</h2>
              <p className="mt-4 leading-8 text-gray-600">{data.description}</p>
            </div>

            <div ref={reviewRef}>
              <ReviewSection
                productID={data.productid}
                data={data.reviews}
                reviewCount={data.reviewcount}
                setdialogType={setDialogType}
                setloading={setLoading}
                setselectedReview={setSelectedReview}
                setselectedRating={setSelectedRating}
                allReview={false}
              />
            </div>
          </div>
        </div>
      )}

      {dialogType && (
        <ProductDialogs
          dialogType={dialogType}
          setdialogType={setDialogType}
          setloading={setLoading}
          productID={data.productid}
          selectedReview={selectedReview}
          selectedRating={selectedRating}
          setselectedRating={setSelectedRating}
        />
      )}
    </>
  )
}

export default ProductPage
