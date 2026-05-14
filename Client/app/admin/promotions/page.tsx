"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useState, useEffect } from "react";
import {
  getAdminPromotions,
  createAdminPromotion,
  toggleAdminPromotion,
  deleteAdminPromotion,
} from "@/app/api/admin";

type Promotion = {
  id: number;
  code: string;
  type: string;
  discount: string;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
};

function PromotionsContent() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [discount, setDiscount] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminPromotions();
      setPromotions(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách mã khuyến mãi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPromotion = async () => {
    if (!code.trim() || !discount.trim()) return;
    setSaving(true);
    try {
      await createAdminPromotion({
        code: code.trim().toUpperCase(),
        type,
        discount: discount.trim(),
        expiration_date: expires || null,
      });
      setCode("");
      setDiscount("");
      setExpires("");
      setType("percentage");
      await fetchPromotions();
    } catch (err) {
      setError("Không lưu được mã khuyến mãi. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePromotion = async (promotionID: number) => {
    try {
      await toggleAdminPromotion(promotionID);
      await fetchPromotions();
    } catch (err) {
      setError("Không cập nhật được trạng thái. Vui lòng thử lại.");
    }
  };

  const handleDeletePromotion = async (promotionID: number) => {
    if (!confirm("Bạn có chắc muốn xóa mã khuyến mãi này không?")) return;
    try {
      await deleteAdminPromotion(promotionID);
      await fetchPromotions();
    } catch (err) {
      setError("Không xóa được mã khuyến mãi. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Chiến dịch & mã khuyến mãi
            </h3>
            <p className="text-sm text-slate-500">
              Xem và tạo mã giảm giá để tăng doanh số trong mùa khuyến mãi.
            </p>
          </div>
          <span className="rounded-2xl bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {promotions.filter((item) => item.is_active).length} mã đang hoạt
            động
          </span>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">
            Danh sách mã giảm giá
          </h4>
          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-center text-slate-500">Đang tải...</p>
            ) : promotions.length === 0 ? (
              <p className="text-center text-slate-500">
                Không có mã khuyến mãi nào.
              </p>
            ) : (
              promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{promo.code}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {promo.type} • Hạn dùng:{" "}
                      {promo.expiration_date || "Không giới hạn"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {promo.discount}
                    </span>
                    <button
                      onClick={() => handleTogglePromotion(promo.id)}
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
                        promo.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {promo.is_active ? "Hủy kích hoạt" : "Kích hoạt"}
                    </button>
                    <button
                      onClick={() => handleDeletePromotion(promo.id)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">Tạo mã mới</h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Mã khuyến mãi
              </label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                placeholder="VD: TET2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Loại giảm giá
              </label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Cố định (VNĐ)</option>
                <option value="freeship">Miễn phí vận chuyển</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Giảm giá
              </label>
              <input
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                placeholder="VD: 10 hoặc 100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ngày hết hạn
              </label>
              <input
                value={expires}
                onChange={(event) => setExpires(event.target.value)}
                type="date"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPromotion}
              disabled={saving || !code.trim() || !discount.trim()}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu mã khuyến mãi"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminPromotions() {
  return (
    <AdminLayout>
      <PromotionsContent />
    </AdminLayout>
  );
}
