import React, { useEffect, useRef, useState } from 'react'
import TrendingPrimary from './TrendingSec'
import { topDataHandler } from '@/app/api/homeData'
import Loading from '../Loading'

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

interface HomeTopData {
  trending: Product[]
  top_rated: Product[]
  new_arrival: Product[]
}

const emptyData: HomeTopData = {
  trending: [],
  top_rated: [],
  new_arrival: [],
}

const TrendColumn = ({
  title,
  data,
  loading,
}: {
  title: string
  data: Product[]
  loading: boolean
}) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="border-b-[1px] leading-[40px] tracking-wide font-semibold text-lg">
        {title}
      </p>

      <div className="relative mt-3 max-h-[430px] overflow-y-auto pr-1 flex flex-col gap-4 rounded-sm">
        {loading && (
          <div className="absolute left-0 right-0 top-0 z-50 flex justify-center bg-white/70 pt-6">
            <Loading />
          </div>
        )}

        {!loading && data.length === 0 ? (
          <div className="flex min-h-[105px] items-center justify-center rounded-xl border border-gray-200 text-sm text-gray-400">
            Chưa có sản phẩm.
          </div>
        ) : (
          <TrendingPrimary data={data} isSecondary={false} />
        )}
      </div>
    </div>
  )
}

const TrendSection = () => {
  const data = useRef<HomeTopData>(emptyData)
  const [loading, setloading] = useState(true)

  async function sync() {
    const res = await topDataHandler()

    switch (res.status) {
      case 200:
        data.current = {
          trending: res.data?.data?.trending || [],
          top_rated: res.data?.data?.top_rated || [],
          new_arrival: res.data?.data?.new_arrival || [],
        }
        setloading(false)
        break
      default:
        data.current = emptyData
        setloading(false)
        break
    }
  }

  useEffect(() => {
    sync()
  }, [])

  return (
    <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
      <TrendColumn title="New Arrivals" data={data.current.new_arrival} loading={loading} />
      <TrendColumn title="Trending" data={data.current.trending} loading={loading} />
      <TrendColumn title="Top Rated" data={data.current.top_rated} loading={loading} />
    </div>
  )
}

export default TrendSection
