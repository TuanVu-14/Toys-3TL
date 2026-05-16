"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getAdminOrders, updateOrderStatus } from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

type AdminOrder = {
  orderid: number;
  userid?: number;
  username?: string;
  email?: string;
  totalamount: number;
  orderstatus?: string;
  order_status?: string;
  delivery_status?: string;
  tracking_number?: string;
  item_count?: number;
  createdat?: string;
  updatedat?: string;
};

const statuses = ["Pending", "Confirmed", "Prepared", "Packed", "Shipped", "Delivered", "Completed", "Cancelled", "Returned", "Refunded", "Payment Failed"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminOrders();
      setOrders(response.data?.data || []);
    } catch {
      setError("Không lấy được đơn hàng. Kiểm tra token admin hoặc server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => [order.orderid, order.username, order.email, order.orderstatus, order.delivery_status, order.tracking_number].some((value) => String(value || "").toLowerCase().includes(keyword)));
  }, [orders, search]);

  const handleStatusChange = async (orderID: number, status: string) => {
    setSavingOrderId(orderID);
    setError(null);
    try {
      await updateOrderStatus(orderID, status);
      setOrders((prev) => prev.map((order) => order.orderid === orderID ? { ...order, orderstatus: status, order_status: status, delivery_status: status === "Completed" ? "Delivered" : status } : order));
      await fetchOrders();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không cập nhật được trạng thái đơn hàng.");
    } finally {
      setSavingOrderId(null);
    }
  };

  const badgeClass = (status?: string) => {
    const value = String(status || "").toLowerCase();
    if (["completed", "delivered"].includes(value)) return "bg-emerald-100 text-emerald-700";
    if (["cancelled", "returned", "refunded", "payment failed"].includes(value)) return "bg-rose-100 text-rose-700";
    if (["shipped", "packed", "prepared"].includes(value)) return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-semibold text-rose-500">Order Management</p><h2 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h2><p className="mt-1 text-sm text-slate-500">Theo dõi quy trình Pending → Confirmed → Prepared → Packed → Shipped → Delivered → Completed.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đơn, khách, trạng thái..." className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-500" /><button onClick={fetchOrders} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Tải lại</button></div>
      </div>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Đơn hàng</th><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Tổng tiền</th><th className="px-5 py-4">Sản phẩm</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Cập nhật</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Đang tải...</td></tr> : null}
            {!loading && filteredOrders.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Không có đơn hàng nào.</td></tr> : null}
            {filteredOrders.map((order) => {
              const status = order.orderstatus || order.order_status || "Pending";
              return <tr key={order.orderid}>
                <td className="px-5 py-4"><div className="font-semibold text-slate-900">#{order.orderid}</div><div className="text-xs text-slate-400">{order.createdat ? new Date(order.createdat).toLocaleString("vi-VN") : "—"}</div></td>
                <td className="px-5 py-4"><div>{order.username || "Khách hàng"}</div><div className="text-xs text-slate-500">{order.email || "—"}</div></td>
                <td className="px-5 py-4 font-semibold text-slate-900">{formatPrice(Number(order.totalamount || 0))}</td>
                <td className="px-5 py-4 text-slate-600">{order.item_count || 0}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(status)}`}>{status}</span><div className="mt-1 text-xs text-slate-400">Giao hàng: {order.delivery_status || "—"}</div></td>
                <td className="px-5 py-4"><select value={status} disabled={savingOrderId === order.orderid} onChange={(e) => handleStatusChange(order.orderid, e.target.value)} className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 disabled:opacity-50">{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
