"use client"

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { bannerDataHandler } from '@/app/api/homeData'
import Loading from './Loading'

interface Banner {
  bannerid: number
  id?: number
  imglink: string
  redirect_link: string
  createdat: Date
  updatedat: Date
}

const normalizeBannerLink = (link: string) => {
  const value = String(link || '').trim()

  if (!value || value === '#') return '/'

  // lego9.sql đang có /category/lego-building nhưng Next app dùng /categories/[category]
  if (value.startsWith('/category/')) return value.replace('/category/', '/categories/')

  // Các link /collections/[slug] sẽ hoạt động sau khi thêm route collections trong gói sửa này.
  if (value.startsWith('/collections/')) return value

  if (value.startsWith('/categories/')) return value
  if (value.startsWith('/sub-category/')) return value
  if (value.startsWith('/product/')) return value
  if (value.startsWith('/search/')) return value

  // Nếu DB chỉ lưu slug, tự đưa sang search để không bị 404.
  return `/search/${value.replace(/^\/+/, '')}`
}

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const data = useRef<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [isHovering, setIsHovering] = useState(false)

  const nextSlide = () => {
    if (data.current.length === 0) return
    setCurrentIndex((prevIndex) => (prevIndex + 1) % data.current.length)
  }

  const prevSlide = () => {
    if (data.current.length === 0) return
    setCurrentIndex((prevIndex) => (prevIndex - 1 + data.current.length) % data.current.length)
  }

  async function sync() {
    const res = await bannerDataHandler()

    if (res.status === 200) {
      data.current = res.banners?.data || res.data?.data || res.data || []
    }

    setLoading(false)
  }

  useLayoutEffect(() => {
    sync()
  }, [])

  useEffect(() => {
    if (data.current.length === 0 || isHovering) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.current.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isHovering, loading])

  if (loading) return <Loading />

  if (data.current.length === 0) return null

  return (
    <section
      className="relative mx-auto mt-6 w-full max-w-7xl overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {data.current.map((each, index) => (
        <img
          key={each.bannerid || each.id || index}
          onClick={() => router.push(normalizeBannerLink(each.redirect_link))}
          className={`${index === currentIndex ? 'block' : 'hidden'} max-h-[500px] w-full cursor-pointer rounded-xl object-cover`}
          src={each.imglink}
          alt={`Slide ${index + 1}`}
        />
      ))}

      {data.current.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl shadow hover:bg-white"
          >
            ❮
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl shadow hover:bg-white"
          >
            ❯
          </button>
        </>
      )}
    </section>
  )
}

export default Banner
