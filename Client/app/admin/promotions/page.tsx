"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useState } from "react";

const initialPromotions = [
  {
    id: 1,
    code: "SUMMER25",
    type: "Giảm giá phần trăm",
    amount: "25%",
    expires: "30/06/2026",
    active: true,
  },
  {
    id: 2,
    code: "FREESHIP",
    type: "Miễn phí vận chuyển",
    amount: "Free ship",
    expires: "31/12/2026",
    active: true,
  },
];

function PromotionsContent() {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [expires, setExpires] = useState("");

  const handleAddPromotion = () => {
    if (!code.trim() || !amount.trim()) return;
    setPromotions((current) => [
      ...current,
      {
        id: Date.now(),
        code: code.trim().toUpperCase(),
        type: "Giảm giá cố định",
        amount: amount.trim(),
        expires: expires || "Không giới hạn",
        active: true,
      },
    ]);
    setCode("");
    setAmount("");
    setExpires("");
  };

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
            {promotions.filter((item) => item.active).length} mã đang hoạt động
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">
            Danh sách mã giảm giá
          </h4>
          <div className="mt-6 space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">{promo.code}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {promo.type} • Hạn dùng: {promo.expires}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {promo.amount}
                  </span>
                  <button className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    Hủy kích hoạt
                  </button>
                </div>
              </div>
            ))}
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
                Giảm giá
              </label>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                placeholder="VD: 10% hoặc 100k"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ngày hết hạn
              </label>
              <input
                value={expires}
                onChange={(event) => setExpires(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPromotion}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Lưu mã khuyến mãi
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
