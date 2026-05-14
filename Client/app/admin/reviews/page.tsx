"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useState } from "react";
import {
  getAdminReviews,
  updateAdminReviewStatus,
  deleteAdminReview,
} from "@/app/api/admin";

type Review = {
  id: number;
  userid: number;
  productid: number;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  username: string;
  title: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminReviews();
      setReviews(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách đánh giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: number) => {
    try {
      await updateAdminReviewStatus(reviewId, "approved");
      await fetchReviews();
    } catch (err) {
      setError("Không phê duyệt được đánh giá. Vui lòng thử lại.");
    }
  };

  const handleHideReview = async (reviewId: number) => {
    try {
      await updateAdminReviewStatus(reviewId, "hidden");
      await fetchReviews();
    } catch (err) {
      setError("Không ẩn được đánh giá. Vui lòng thử lại.");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;
    try {
      await deleteAdminReview(reviewId);
      await fetchReviews();
    } catch (err) {
      setError("Không xóa được đánh giá. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

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
            <button
              onClick={fetchReviews}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
              Đang tải...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
              Không có đánh giá nào.
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {review.username}
                    </p>
                    <p className="text-sm text-slate-500">{review.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <span key={index}>★</span>
                    ))}
                    {Array.from({ length: 5 - review.rating }).map(
                      (_, index) => (
                        <span key={index} className="text-slate-300">
                          ★
                        </span>
                      ),
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      review.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : review.status === "hidden"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {review.status === "approved"
                      ? "Đã duyệt"
                      : review.status === "hidden"
                        ? "Ẩn"
                        : "Chờ duyệt"}
                  </span>
                  {review.status !== "approved" && (
                    <button
                      onClick={() => handleApproveReview(review.id)}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Duyệt
                    </button>
                  )}
                  {review.status !== "hidden" && (
                    <button
                      onClick={() => handleHideReview(review.id)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Ẩn
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
