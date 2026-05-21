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
    const average = total > 0 ? data.reduce((sum, review) => sum + Number(review.rating || review.productstars || 0), 0) / total : 0
    const lastReview = data.length > 0 ? data[0] : null

    return { counts, total, average, lastReview }
  }, [data])

  const reviewTotal = reviewCount || stats.total

  return (
    <section className="relative py-10 lg:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold leading-10 text-black">Customer reviews & rating</h2>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
          <div className="w-full rounded-3xl border border-gray-200 p-5 sm:p-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.counts[star] || 0
              const percent = reviewTotal > 0 ? Math.round((count * 100) / reviewTotal) : 0

              return (
                <div className="mb-4 flex w-full items-center last:mb-0" key={star}>
                  <p className="mr-1 w-4 text-lg font-medium text-black">{star}</p>
                  <span className="text-xl text-yellow-400">★</span>
                  <div className="mx-4 h-2 flex-1 rounded-full bg-gray-200">
                    <span className="block h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="w-8 text-right text-lg font-medium text-black">{count}</p>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 rounded-3xl bg-gray-100 p-5 sm:p-8 md:grid-cols-[1fr_auto]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl bg-white/60 p-4 sm:border-r sm:border-gray-200 sm:bg-transparent">
                <h2 className="mb-4 text-center text-4xl font-bold text-black">{stats.average.toFixed(1)}</h2>
                <Stars size={32} stars={stats.average} />
                <p className="mt-4 text-center font-normal leading-8 text-gray-500">{reviewTotal} Ratings</p>
              </div>

              <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl bg-white/60 p-4 sm:bg-transparent">
                <h2 className="mb-4 text-center text-4xl font-bold text-black">
                  {stats.lastReview ? Number(stats.lastReview.rating || stats.lastReview.productstars || 0).toFixed(1) : '0.0'}
                </h2>
                <Stars size={32} stars={stats.lastReview ? Number(stats.lastReview.rating || stats.lastReview.productstars || 0) : 0} />
                <p className="mt-4 text-center font-normal leading-8 text-gray-500">Last Review</p>
              </div>
            </div>

            <div className="flex w-full flex-col items-stretch justify-center gap-4 md:w-44">
              <button
                type="button"
                onClick={() => setdialogType('create')}
                className="w-full rounded-full bg-indigo-600 px-4 py-4 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700"
              >
                Write A Review
              </button>

              {!allReview && (
                <Link href={`/all-reviews/${productID}`} className="w-full">
                  <button
                    type="button"
                    className="w-full rounded-full bg-white px-4 py-4 text-center text-sm font-semibold text-indigo-600 shadow-sm transition-all duration-300 hover:bg-indigo-100"
                  >
                    See All Reviews
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-b border-gray-200 pb-8">
          <h4 className="mb-6 text-2xl font-semibold leading-10 text-black">Recent Reviews</h4>

          {data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá sản phẩm.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {data.map((each) => (
                <div className="rounded-xl border px-4 py-4" key={each.reviewid}>
                  <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 flex-col gap-3">
                      <Stars stars={Number(each.rating || each.productstars || 0)} size={32} />
                      <p className="break-words text-xl font-medium">{each.title}</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <p className="text-base font-medium leading-7 text-gray-400">{formatDate(each.createdat)}</p>
                      <h6 className="text-lg font-semibold leading-8 text-black">@{each.username}</h6>

                      {userID === each.userid && (
                        <div className="flex flex-wrap gap-3 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setselectedRating(each.rating)
                              setselectedReview(each)
                              setdialogType('edit')
                            }}
                            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
                          >
                            Edit Review
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setselectedReview(each)
                              setdialogType('delete')
                            }}
                            className="rounded-full border px-4 py-2 text-sm font-semibold text-black transition-all duration-300 hover:bg-red-400 hover:text-white"
                          >
                            Delete Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="break-words text-lg font-normal leading-8 text-gray-500">{each.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ReviewSection
