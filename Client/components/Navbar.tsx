'use client'

import Link from 'next/link'
import React, { useRef, useState } from 'react'
import { navBtns } from '@/app/data'
import Account from './DropdownMenu/Account'
import { useMenu } from '@/Helpers/MenuContext'
import Product from './DropdownMenu/Product'
import Category from './DropdownMenu/Category'
import { useRouter } from 'next/navigation'
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useAppSelector } from '@/app/hooks'
import { toNumber } from '@/features/UIUpdates/CartWishlist'

const Navbar = () => {
  const router = useRouter()
  const socialMedia = ['facebook', 'twitter', 'instagram', 'linkedin']
  const { toggleCart, toggleFav } = useMenu()

  const cartCount = useAppSelector((state) =>
    state.cartWishlist.cart.reduce(
      (total, item) => total + Math.max(1, toNumber(item.quantity)),
      0,
    ),
  )

  const wishlistCount = useAppSelector(
    (state) => state.cartWishlist.wishlist.length,
  )

  const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false)
  const [selectIndex, setSelectIndex] = useState<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openDropdown = (index: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setSelectIndex(index)
    setDropdownVisible(true)
  }

  const closeDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)

    closeTimer.current = setTimeout(() => {
      setDropdownVisible(false)
      setSelectIndex(null)
    }, 220)
  }

  function searchRedirect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const input = form.elements.namedItem('searchEntry') as HTMLInputElement
    const keyword = input.value.trim().split(/\s+/).join('-')

    if (keyword) router.push(`/search/${keyword}`)
  }

  return (
    <nav className="w-full h-auto flex flex-col items-center">
      <div className="bg-flower-100 h-[50px] w-full justify-evenly items-center border-b-[1px] hidden sm:flex">
        <div className="flex w-[80%] justify-between">
          <div className="flex gap-2">
            {socialMedia.map((each, index) => (
              <button
                key={index}
                className="text-[16px] text-silver bg-gray-200 w-[25px] rounded-md hover:bg-blueIn hover:text-white"
              >
                <i className={`fa-brands fa-${each}`}></i>
              </button>
            ))}
          </div>

          <p className="text-sm text-white">
            FREE SHIPPING THIS WEEK ORDER OVER - 500K
          </p>

          <p className="hidden sm:block text-sm font-medium text-white">
            Shop Now
          </p>
        </div>
      </div>

      <div className="w-full h-auto flex flex-col justify-between items-center bg-flower-50">
        <div className="flex justify-evenly items-center w-full flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="w-[80%] flex justify-between items-center flex-col sm:flex-row sm:gap-0">
            <Link
              className="mr-2.5 text-[26px] text-flower-150 font-bold"
              href="/"
            >
              <span className="text-[36px]">3TL</span>-Store
            </Link>

            <form
              onSubmit={searchRedirect}
              className="border-[1.5px] rounded-[10px] h-[42px] w-[90%] sm:w-[600px] mb-5 sm:mb-0 flex justify-between items-center"
            >
              <input
                name="searchEntry"
                placeholder="Enter your product name..."
                type="text"
                className="outline-0 ml-5 text-[15px] w-[90%] placeholder:text-base placeholder:text-silver bg-inherit focus:outline-none"
              />

              <button type="submit" className="text-[16px] mr-4">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>

            <div className="gap-5 text-davysilver my-8 hidden sm:flex sm:items-center">
              <Account />

              <button
                type="button"
                onClick={toggleFav}
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Mở danh sách yêu thích"
              >
                <HeartIcon className="h-[30px] w-[30px]" />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleCart}
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Mở giỏ hàng"
              >
                <ShoppingBagIcon className="h-[30px] w-[30px]" />

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="h-[50px] w-full justify-center items-center mb-4 hidden lg:flex bg-flower-50 relative z-40"
        onMouseEnter={() => {
          if (closeTimer.current) clearTimeout(closeTimer.current)
        }}
        onMouseLeave={closeDropdown}
      >
        <div className="flex">
          {navBtns.map((btn, index) => (
            <div
              key={index}
              onMouseEnter={() => openDropdown(index)}
              className="relative items-center"
            >
              <button
                type="button"
                onClick={() => router.push(btn.catLink)}
                className="relative text-[15px] m-6 text-[#9B9797] font-body tracking-wide hover:text-salmon"
              >
                <span className="relative inline-block px-3 py-1">
                  {btn.name.toUpperCase()}

                  {btn.name === 'Sale' && (
                    <svg
                      viewBox="0 0 120 40"
                      className="absolute -top-2 -left-2 w-[130%] h-[160%] pointer-events-none"
                    >
                      <ellipse
                        cx="60"
                        cy="20"
                        rx="55"
                        ry="16"
                        stroke="#E8989A"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  )}
                </span>
              </button>

              {selectIndex === index &&
                isDropdownVisible &&
                btn.name === 'Categories' && (
                  <div
                    onMouseEnter={() => openDropdown(index)}
                    onMouseLeave={closeDropdown}
                  >
                    <Category />
                  </div>
                )}

              {selectIndex === index &&
                btn.isExtendable &&
                isDropdownVisible &&
                btn.name !== 'Categories' && (
                  <div
                    onMouseEnter={() => openDropdown(index)}
                    onMouseLeave={closeDropdown}
                  >
                    <Product options={btn.extendables} />
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
