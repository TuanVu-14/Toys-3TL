"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats } from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

type AdminStats = {
  products: number;
  orders: number;
  users: number;
  revenue: number;
  lowStock?: number;
  recentOrders: Array<{ orderid: number; totalamount: number; orderstatus: string; createdat: string; username: string; email: string }>;
};

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminStats();
      setStats(response.data || null);
    } catch {
      setError("Không tải được số liệu thống kê. Kiểm tra server, token admin hoặc file SQL bổ sung.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const cards = [
    { label: "Sản phẩm đang bán", value: stats?.products ?? "—", href: "/admin/products" },
    { label: "Đơn hàng", value: stats?.orders ?? "—", href: "/admin/orders" },
    { label: "Người dùng hoạt động", value: stats?.users ?? "—", href: "/admin/users" },
    { label: "Doanh thu hợp lệ", value: formatPrice(Number(stats?.revenue || 0)), href: "/admin/reports" },
    { label: "Sắp hết hàng", value: stats?.lowStock ?? "—", href: "/admin/warehouse" },
  ];

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((item) => <Link key={item.label} href={item.href} className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="text-sm font-medium text-slate-500">{item.label}</div><div className="mt-3 text-2xl font-bold text-slate-900">{loading ? "..." : item.value}</div><div className="mt-3 text-xs font-semibold text-rose-500">Xem chi tiết →</div></Link>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-900">Đơn hàng gần đây</h3><p className="text-sm text-slate-500">Hoạt động mới nhất từ cửa hàng.</p></div><button onClick={loadStats} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Tải lại</button></div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Mã đơn</th><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Tổng</th><th className="px-4 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={4}>Đang tải...</td></tr> : stats?.recentOrders?.length ? stats.recentOrders.map((order) => <tr key={order.orderid}><td className="px-4 py-3 font-semibold">#{order.orderid}</td><td className="px-4 py-3"><div>{order.username || "—"}</div><div className="text-xs text-slate-400">{order.email}</div></td><td className="px-4 py-3">{formatPrice(Number(order.totalamount || 0))}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{order.orderstatus}</span></td></tr>) : <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={4}>Chưa có đơn hàng.</td></tr>}</tbody></table>
          </div>
        </div>
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Quy trình thực tế</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>1. Sales xác nhận đơn và khuyến mãi.</p>
            <p>2. Warehouse chuẩn bị, đóng gói, xuất kho.</p>
            <p>3. Admin theo dõi doanh thu, user, sản phẩm.</p>
            <p>4. Không xóa cứng dữ liệu đã phát sinh đơn hàng.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
