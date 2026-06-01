"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useMemo, useState } from "react";
import { getAdminReviews, updateAdminReviewStatus, deleteAdminReview } from "@/app/api/admin";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-lg ${i < rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
      ))}
      <span className="ml-1 text-sm font-bold text-slate-700">{rating}/5</span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminReviews();
      setReviews(response.data?.data || []);
    } catch {
      setError("Không lấy được danh sách đánh giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try { await updateAdminReviewStatus(id, "approved"); await fetchReviews(); }
    catch { setError("Không phê duyệt được đánh giá."); }
  };

  const handleHide = async (id: number) => {
    try { await updateAdminReviewStatus(id, "hidden"); await fetchReviews(); }
    catch { setError("Không ẩn được đánh giá."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;
    try { await deleteAdminReview(id); await fetchReviews(); }
    catch { setError("Không xóa được đánh giá."); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const kw = search.trim().toLowerCase();
      if (kw && !`${r.username} ${r.title} ${r.comment}`.toLowerCase().includes(kw)) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
      return true;
    });
  }, [reviews, search, filterStatus, filterRating]);

  const statusBadge = (status: string) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "hidden") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return "Đã duyệt";
    if (status === "hidden") return "Ẩn";
    return "Chờ duyệt";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-500">Review Management</p>
              <h2 className="text-2xl font-bold text-slate-900">Đánh giá & nhận xét</h2>
              <p className="mt-1 text-sm text-slate-500">Quản lý đánh giá của khách hàng về sản phẩm.</p>
            </div>
            <button onClick={fetchReviews} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Tải lại</button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên khách, sản phẩm, nội dung..."
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-400 min-w-[220px]"
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400">
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="hidden">Ẩn</option>
            </select>
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400">
              <option value="all">Tất cả sao</option>
              {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} sao</option>)}
            </select>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Hiển thị <b className="text-slate-900">{filtered.length}</b> / {reviews.length}
            </div>
          </div>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-slate-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-slate-500">Không có đánh giá nào phù hợp.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((review) => (
              <div key={review.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-900">{review.username}</span>
                      <span className="text-xs text-slate-400">#{review.id}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(review.status)}`}>{statusLabel(review.status)}</span>
                    </div>
                    <p className="mt-1 text-sm text-rose-600 font-medium">{review.title}</p>
                  </div>
                  <div className="shrink-0">
                    <StarRating rating={review.rating} />
                    {review.created_at && (
                      <p className="mt-1 text-xs text-slate-400 text-right">{new Date(review.created_at).toLocaleString("vi-VN")}</p>
                    )}
                  </div>
                </div>

                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{review.comment || <em className="text-slate-400">Không có nội dung.</em>}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {review.status !== "approved" && (
                    <button onClick={() => handleApprove(review.id)} className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">✓ Duyệt</button>
                  )}
                  {review.status !== "hidden" && (
                    <button onClick={() => handleHide(review.id)} className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">⊘ Ẩn</button>
                  )}
                  <button onClick={() => handleDelete(review.id)} className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">✕ Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
