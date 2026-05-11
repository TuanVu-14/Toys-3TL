"use client";

import AdminLayout from "@/components/Admin/AdminLayout";

const reviewItems = [
  {
    id: 1,
    user: "Nguyễn A.",
    product: "Áo thun cotton",
    rating: 5,
    comment: "Chất lượng tốt, giao hàng nhanh.",
    status: "Hiển thị",
  },
  {
    id: 2,
    user: "Trần B.",
    product: "Tai nghe gaming",
    rating: 4,
    comment: "Ổn, nhưng giá hơi cao.",
    status: "Chờ duyệt",
  },
  {
    id: 3,
    user: "Lê C.",
    product: "Balo du lịch",
    rating: 5,
    comment: "Rất hài lòng, thiết kế đẹp.",
    status: "Hiển thị",
  },
];

export default function ReviewsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Đánh giá & nhận xét
              </h3>
              <p className="text-sm text-slate-500">
                Duyệt đánh giá khách hàng để nâng cao chất lượng sản phẩm và uy
                tín cửa hàng.
              </p>
            </div>
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Lọc đánh giá
            </button>
          </div>
        </section>

        <div className="space-y-4">
          {reviewItems.map((review) => (
            <div
              key={review.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {review.user}
                  </p>
                  <p className="text-sm text-slate-500">{review.product}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                  {Array.from({ length: 5 - review.rating }).map((_, index) => (
                    <span key={index} className="text-slate-300">
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {review.status}
                </span>
                <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                  Duyệt
                </button>
                <button className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  Ẩn
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
