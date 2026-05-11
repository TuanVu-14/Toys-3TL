"use client";

import React, { useEffect, useState } from "react";
import { getAdminOrders, updateOrderStatus } from "@/app/api/admin";

type AdminOrder = {
  orderid: number;
 totalamount: string | number; 
  orderstatus: string;
  createdat: string;
  username: string;
  email: string;
  userid: number;
};

const statusOptions = [
  "Pending",
  "Confirmed",
  "Paid",
  "Completed",
  "Cancelled",
];

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminOrders();
      setOrders(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderID: number, nextStatus: string) => {
    setUpdatingOrderId(orderID);
    try {
      await updateOrderStatus(orderID, nextStatus);
      setOrders((current) =>
        current.map((order) =>
          order.orderid === orderID
            ? { ...order, orderstatus: nextStatus }
            : order,
        ),
      );
    } catch (err) {
      setError("Không cập nhật được trạng thái. Vui lòng thử lại.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Quản lý đơn hàng
            </h3>
            <p className="text-sm text-slate-600">
              Xem và cập nhật trạng thái đơn hàng khách hàng.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Tải lại
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã đơn</th>
              <th className="px-4 py-3 font-semibold">Khách hàng</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Tổng tiền</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Ngày tạo</th>
              <th className="px-4 py-3 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  Đang tải...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  Không có đơn hàng nào.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.orderid} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    #{order.orderid}
                  </td>
                  <td className="px-4 py-4">{order.username}</td>
                  <td className="px-4 py-4">{order.email}</td>
                  <td className="px-4 py-4 font-semibold">
                   ${Number(order.totalamount).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        statusColors[order.orderstatus] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {order.orderstatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {new Date(order.createdat).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.orderstatus}
                      onChange={(event) =>
                        handleStatusChange(order.orderid, event.target.value)
                      }
                      disabled={updatingOrderId === order.orderid}
                      className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-500 disabled:opacity-50"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
