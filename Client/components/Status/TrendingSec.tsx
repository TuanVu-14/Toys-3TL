import Link from 'next/link'
import React from 'react'
import { formatPrice, toNumber } from '@/features/UIUpdates/CartWishlist'

interface Product {
  productid: number
  title: string
  price: number | string
  discount: number | string
  imglink: string
  imgalt: string
  category_name: string
  maincategory: string
  isnew?: boolean
  issale?: boolean
  isdiscount?: boolean
}

interface DataPattern {
  data: Product[]
  isSecondary: boolean
}

const TrendingPrimary = ({ data, isSecondary }: DataPattern) => {
  function categoryLink(maincategory: string, category: string) {
    const splitCat = category.split(' ').join('-')
    return `/sub-category/${maincategory}/${splitCat}`
  }

  return (
    <>
      {data.map((each) => {
        const discountValue = toNumber(each.discount)
        const hasDiscount = discountValue > 0
        const badgeText = hasDiscount
          ? `-${discountValue <= 100 ? discountValue : Math.round(discountValue)}%`
          : each.issale
            ? 'SALE'
            : each.isnew
              ? 'NEW'
              : ''

        return (
          <div
            key={each.productid}
            className={`flex items-center rounded-xl border-[1px] border-gray-200 bg-white p-4 transition-shadow duration-300 hover:shadow-md ${
              isSecondary ? 'min-h-[86px]' : 'min-h-[112px]'
            }`}
          >
            <Link
              href={`/product/${each.productid}`}
              className="relative mr-4 h-[82px] w-[120px] flex-shrink-0 overflow-hidden rounded-md bg-gray-50"
            >
              {badgeText && (
                <span className="absolute left-0 top-0 z-10 rounded-br-md bg-salmon px-2 py-[2px] text-[11px] font-semibold text-white">
                  {badgeText}
                </span>
              )}
              <img
                src={each.imglink || '/no-image.png'}
                alt={each.imgalt || each.title}
                className="h-full w-full object-cover object-center"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link href={`/product/${each.productid}`}>
                <p className="line-clamp-1 text-[16px] font-semibold tracking-wide text-gray-900 hover:text-salmon">
                  {each.title}
                </p>
              </Link>

              <Link href={categoryLink(each.maincategory, each.category_name)}>
                <p className="line-clamp-1 text-[13px] text-silver hover:text-salmon">
                  {each.category_name}
                </p>
              </Link>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-[16px] font-bold text-salmon">
                  {formatPrice(each.price, each.discount)}
                </p>
                {hasDiscount && (
                  <p className="text-[13px] text-silver line-through">
                    {formatPrice(each.price)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default TrendingPrimary
