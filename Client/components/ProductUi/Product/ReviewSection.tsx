import React, { useMemo } from 'react'
import Link from 'next/link'
import Stars from '../Stars'
import formatDate from '@/app/api/dateConvert'
import { useAppSelector } from '@/app/hooks'

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

type Props = {
  productID: number
  data: Review[]
  reviewCount: number
  setdialogType: React.Dispatch<React.SetStateAction<string | null>>
  setloading: React.Dispatch<React.SetStateAction<boolean>>
  setselectedReview: React.Dispatch<React.SetStateAction<null | Review>>
  setselectedRating: React.Dispatch<React.SetStateAction<number>>
  allReview: boolean
}

const getAccountID = (account: unknown) =>
  Number((account as { userID?: number; userid?: number })?.userID ?? (account as { userid?: number })?.userid ?? 0)

const ReviewSection = ({
  data,
  reviewCount,
  setdialogType,
  setselectedReview,
  setselectedRating,
  allReview,
  productID,
}: Props) => {
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount)
  const userID = getAccountID(defaultAccount)

  const stats = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    data.forEach((review) => {
      const key = Math.max(1, Math.min(5, Math.round(Number(review.rating || review.productstars || 0))))
      counts[key] += 1
    })
    const total = data.length
    const average = total > 0 ? data.reduce((sum, r) => sum + Number(r.rating || r.productstars || 0), 0) / total : 0
    const lastReview = data.length > 0 ? data[0] : null
    return { counts, total, average, lastReview }
  }, [data])

  const reviewTotal = reviewCount || stats.total

  return (
    <section className="py-6">
      <h2 className="mb-6 text-xl font-bold text-black">Customer reviews & rating</h2>

      {/* Star breakdown */}
      <div className="rounded-2xl border border-gray-200 p-4 mb-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.counts[star] || 0
          const percent = reviewTotal > 0 ? Math.round((count * 100) / reviewTotal) : 0
          return (
            <div className="mb-3 flex items-center gap-2 last:mb-0" key={star}>
              <span className="w-3 text-sm font-medium text-black">{star}</span>
              <span className="text-base text-yellow-400">★</span>
              <div className="h-2 flex-1 rounded-full bg-gray-200">
                <span className="block h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-5 text-right text-sm font-medium text-black">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Average + Last review */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-black">{stats.average.toFixed(1)}</p>
          <Stars size={24} stars={stats.average} />
          <p className="mt-2 text-center text-xs text-gray-500">{reviewTotal} Đánh giá</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-black">
            {stats.lastReview ? Number(stats.lastReview.rating || stats.lastReview.productstars || 0).toFixed(1) : '—'}
          </p>
          <Stars size={24} stars={stats.lastReview ? Number(stats.lastReview.rating || stats.lastReview.productstars || 0) : 0} />
          <p className="mt-2 text-center text-xs text-gray-500">Đánh giá gần nhất</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setdialogType('create')}
          className="w-full rounded-full bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Viết đánh giá
        </button>
        {!allReview && (
          <Link href={`/all-reviews/${productID}`} className="w-full">
            <button
              type="button"
              className="w-full rounded-full border border-indigo-200 bg-white px-4 py-3 text-center text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
            >
              Xem tất cả đánh giá
            </button>
          </Link>
        )}
      </div>

      {/* Recent reviews */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="mb-4 text-lg font-semibold text-black">Đánh giá gần đây</h4>
        {data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((each) => (
              <div className="rounded-xl border px-4 py-4" key={each.reviewid}>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Stars stars={Number(each.rating || each.productstars || 0)} size={20} />
                    <p className="mt-1 font-medium text-gray-900">{each.title}</p>
                  </div>
                  <div className="text-sm text-gray-400 sm:text-right">
                    <p>{formatDate(each.createdat)}</p>
                    <p className="font-semibold text-gray-700">@{each.username}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-gray-600">{each.comment}</p>
                {userID === each.userid && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setselectedRating(each.rating); setselectedReview(each); setdialogType('edit') }}
                      className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => { setselectedReview(each); setdialogType('delete') }}
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ReviewSection
