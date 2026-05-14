"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/app/api/admin";

type AdminStats = {
  products: number;
  orders: number;
  users: number;
  revenue: number;
  recentOrders: Array<{
    orderid: number;
    totalamount: number;
    orderstatus: string;
    createdat: string;
    username: string;
    email: string;
  }>;
};

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAdminStats();
        setStats(response.data || null);
      } catch (err) {
        setError("Không tải được số liệu thống kê. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const formatCurrency = (value: number | undefined) =>
    typeof value === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "USD",
        }).format(value)
      : "—";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sản phẩm", value: stats?.products ?? "—" },
          { label: "Đơn hàng", value: stats?.orders ?? "—" },
          { label: "Người dùng", value: stats?.users ?? "—" },
          { label: "Doanh thu", value: formatCurrency(stats?.revenue) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm uppercase tracking-[0.18em] text-rose-600">
              {item.label}
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-slate-900">
                  {item.value}
                </p>
                <p className="text-sm text-slate-500">So với tuần trước</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Tổng quan hiệu suất
              </h3>
              <p className="text-sm text-slate-600">
                Theo dõi doanh số bán hàng, lưu lượng truy cập và doanh thu.
              </p>
            </div>
            <button className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
              Xem báo cáo
            </button>
          </div>
          <div className="h-64 rounded-3xl bg-slate-100 p-6 text-slate-500">
            {loading ? (
              <p className="mt-24 text-center">Đang tải biểu đồ...</p>
            ) : (
              <p className="mt-24 text-center">
                Hiện tại chưa có biểu đồ động.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Tóm tắt doanh thu
            </h3>
            <p className="text-sm text-slate-600">
              Doanh thu tháng này so với tháng trước.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Doanh thu</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(stats?.revenue)}
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Sản phẩm</span>
                <span className="font-semibold text-slate-900">
                  {stats?.products ?? "—"}
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Đơn hàng</span>
                <span className="font-semibold text-slate-900">
                  {stats?.orders ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Đơn hàng gần đây
            </h3>
            <p className="text-sm text-slate-600">
              Hoạt động mới nhất từ cửa hàng của bạn.
            </p>
          </div>
          <button className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
            Quản lý đơn hàng
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Đang tải đơn hàng...
                  </td>
                </tr>
              ) : stats?.recentOrders?.length ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.orderid} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      #{order.orderid}
                    </td>
                    <td className="px-4 py-4">{order.username}</td>
                    <td className="px-4 py-4">
                      {formatCurrency(order.totalamount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
                        {order.orderstatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Không có đơn hàng gần đây.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
