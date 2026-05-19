import React, { useMemo } from 'react';
import Link from 'next/link';
import Stars from '../Stars';
import formatDate from '@/app/api/dateConvert';
import { useAppSelector } from '@/app/hooks';

interface Review {
  reviewid: number;
  userid: number;
  rating: number;
  title: string;
  comment: string;
  username: string;
  createdat: string;
  productstars: number;
}

type Props = {
  productID: number;
  data: Review[];
  reviewCount: number;
  setdialogType: React.Dispatch<React.SetStateAction<string | null>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  setselectedReview: React.Dispatch<React.SetStateAction<null | Review>>;
  setselectedRating: React.Dispatch<React.SetStateAction<number>>;
  allReview: boolean;
};

const ReviewSection = ({
  data,
  reviewCount,
  setdialogType,
  setselectedReview,
  setselectedRating,
  allReview,
  productID,
}: Props) => {
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount);

  const stats = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((review) => {
      const key = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0))));
      counts[key] += 1;
    });

    const total = data.length;
    const average = total > 0 ? data.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total : 0;
    const lastReview = data.length > 0 ? data[0] : null;

    return { counts, total, average, lastReview };
  }, [data]);

  const reviewTotal = reviewCount || stats.total;

  return (
    <section className="relative py-16">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-5 lg:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold leading-10 text-black">Customer reviews & rating</h2>

        <div className="grid grid-cols-12 gap-6 mb-11">
          <div className="col-span-12 xl:col-span-4">
            <div className="flex w-full flex-col gap-y-4 rounded-3xl border border-gray-200 p-6">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.counts[star] || 0;
                const percent = reviewTotal > 0 ? Math.round((count * 100) / reviewTotal) : 0;

                return (
                  <div className="flex items-center w-full" key={star}>
                    <p className="mr-1 text-lg font-medium text-black">{star}</p>
                    <span className="text-xl text-yellow-400">★</span>
                    <div className="mx-4 h-2 w-full rounded-full bg-gray-200">
                      <span className="flex h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="w-8 text-right text-lg font-medium text-black">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-8">
            <div className="grid min-h-[230px] grid-cols-12 rounded-3xl bg-gray-100 px-8 py-8">
              <div className="col-span-12 flex items-center md:col-span-8">
                <div className="flex h-full w-full flex-col items-center justify-center gap-8 sm:flex-row">
                  <div className="flex flex-col items-center justify-center sm:border-r sm:border-gray-200 sm:pr-8">
                    <h2 className="mb-4 text-center text-4xl font-bold text-black">{stats.average.toFixed(1)}</h2>
                    <Stars size={40} stars={stats.average} />
                    <p className="mt-4 font-normal leading-8 text-gray-400">{reviewTotal} Ratings</p>
                  </div>
                  <div className="flex flex-col items-center justify-center sm:pl-8">
                    <h2 className="mb-4 text-center text-4xl font-bold text-black">{stats.lastReview ? Number(stats.lastReview.rating).toFixed(1) : '0'}</h2>
                    <Stars size={40} stars={stats.lastReview ? Number(stats.lastReview.rating) : 0} />
                    <p className="mt-4 font-normal leading-8 text-gray-400">Last Review</p>
                  </div>
                </div>
              </div>

              <div className="col-span-12 mt-8 md:col-span-4 md:mt-0 md:pl-8">
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <button
                    onClick={() => setdialogType('create')}
                    className="mb-6 w-full rounded-full bg-indigo-600 px-4 py-4 text-center text-md font-semibold text-white shadow-sm transition-all duration-500 hover:bg-indigo-700 hover:shadow-indigo-400"
                  >
                    Write A Review
                  </button>
                  {!allReview && (
                    <Link href={`/all-reviews/${productID}`} className="w-full">
                      <button className="w-full rounded-full bg-white px-4 py-4 text-center text-md font-semibold text-indigo-600 shadow-sm transition-all duration-500 hover:bg-indigo-100 hover:shadow-indigo-200">
                        See All Reviews
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-8">
          <h4 className="mb-6 text-2xl font-semibold leading-10 text-black">Recent Reviews</h4>

          {data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá sản phẩm.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {data.map((each) => (
                <div className="rounded-xl border px-4 py-4" key={each.reviewid}>
                  <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-3">
                      <Stars stars={Number(each.rating)} size={40} />
                      <p className="text-xl font-medium">{each.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <p className="text-base font-medium leading-7 text-gray-400">{formatDate(each.createdat)}</p>
                      <h6 className="text-lg font-semibold leading-8 text-black">@{each.username}</h6>
                      {defaultAccount.userID === each.userid && (
                        <div className="flex gap-5">
                          <button
                            onClick={() => {
                              setselectedRating(each.rating);
                              setselectedReview(each);
                              setdialogType('edit');
                            }}
                            className="rounded-full bg-indigo-600 px-4 py-2 text-md font-semibold text-white transition-all duration-500 hover:bg-indigo-700"
                          >
                            Edit Review
                          </button>
                          <button
                            onClick={() => {
                              setselectedReview(each);
                              setdialogType('delete');
                            }}
                            className="rounded-full border px-4 py-2 text-md font-semibold text-black transition-all duration-500 hover:bg-red-400 hover:text-white"
                          >
                            Delete Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-lg font-normal leading-8 text-gray-500">{each.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
