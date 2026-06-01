"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getAdminOrderDetail,
  getAdminOrders,
  updateOrderStatus,
} from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

type OrderItem = {
  orderitemid: number;
  productid: number;
  title?: string;
  quantity: number;
  price?: number;
  discount?: number;
  discount_amount?: number;
  line_total?: number;
  colorname?: string;
  sizename?: string;
  brand?: string;
  age_group?: string;
  skill_type?: string;
  image_url?: string;
  image_alt?: string;
  gift_wrapping?: boolean;
  gift_wrap_style?: string;
  gift_message?: string;
};

type AdminOrder = {
  orderid: number;
  userid?: number;
  username?: string;
  email?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  receiver_name?: string;
  receiver_phone?: string;
  addressline1?: string;
  addressline2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalcode?: string;
  totalamount: number;
  subtotal?: number;
  grand_total?: number;
  orderstatus?: string;
  order_status?: string;
  delivery_status?: string;
  tracking_number?: string;
  trackingnumber?: string;
  item_count?: number;
  createdat?: string;
  updatedat?: string;
  items?: OrderItem[];
  paymentmethod?: string;
  paymentstatus?: string;
  paid_amount?: number;
  transactionid?: string;
  shippingmethod?: string;
  shippingcost?: number;
  shippedat?: string;
  deliveredat?: string;
  is_gift?: boolean;
  gift_message?: string;
  gift_wrapping_type?: string;
};

// 8 trạng thái chuẩn theo nghiệp vụ
const ORDER_STATUSES = [
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Packed", label: "Đã đóng gói" },
  { value: "Shipped", label: "Đang giao hàng" },
  { value: "Delivered", label: "Giao thành công" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "Returned", label: "Hoàn trả" },
  { value: "Failed", label: "Giao thất bại" },
];

const displayDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

const joinAddress = (order: AdminOrder) => {
  return (
    [order.addressline1, order.addressline2, order.city, order.state, order.country, order.postalcode]
      .filter(Boolean)
      .join(", ") || "Chưa có địa chỉ"
  );
};

const getStatus = (order: AdminOrder) => order.orderstatus || order.order_status || "Pending";

const statusLabel = (value?: string) => {
  const found = ORDER_STATUSES.find((s) => s.value === value);
  return found ? found.label : value || "—";
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
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
      setError("Không lấy được danh sách đơn hàng. Kiểm tra server hoặc quyền admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [
        order.orderid,
        order.username,
        order.email,
        order.customer_name,
        order.customer_email,
        order.orderstatus,
        order.order_status,
        order.delivery_status,
        order.tracking_number,
      ].some((value) => String(value || "").toLowerCase().includes(keyword)),
    );
  }, [orders, search]);

  const openOrderDetail = async (order: AdminOrder) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setError(null);
    try {
      const response = await getAdminOrderDetail(order.orderid);
      setSelectedOrder(response.data?.data || order);
    } catch {
      setError("Không lấy được chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (orderID: number, status: string) => {
    setSavingOrderId(orderID);
    setError(null);
    try {
      await updateOrderStatus(orderID, status);
      setOrders((prev) =>
        prev.map((order) =>
          order.orderid === orderID
            ? {
                ...order,
                orderstatus: status,
                order_status: status,
                delivery_status: ["Delivered"].includes(status) ? "Delivered" : order.delivery_status,
              }
            : order,
        ),
      );
      if (selectedOrder?.orderid === orderID) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                orderstatus: status,
                order_status: status,
                delivery_status: ["Delivered"].includes(status) ? "Delivered" : prev.delivery_status,
              }
            : prev,
        );
      }
      await fetchOrders();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không cập nhật được trạng thái đơn hàng.");
    } finally {
      setSavingOrderId(null);
    }
  };

  const badgeClass = (status?: string) => {
    const value = String(status || "").toLowerCase();
    if (["completed"].includes(value)) return "bg-emerald-100 text-emerald-700";
    if (["cancelled", "returned", "failed"].includes(value)) return "bg-rose-100 text-rose-700";
    if (["shipping", "preparing"].includes(value)) return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-500">Quản lý đơn hàng</p>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h2>
          <p className="mt-1 text-sm text-slate-500">Bấm vào một đơn để xem chi tiết ngắn gọn cho admin.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, khách, trạng thái..."
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-500"
          />
          <button
            onClick={fetchOrders}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">Đơn hàng</th>
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Tổng tiền</th>
              <th className="px-5 py-4">Sản phẩm</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Cập nhật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">Đang tải...</td>
              </tr>
            ) : null}

            {!loading && filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">Không có đơn hàng nào.</td>
              </tr>
            ) : null}

            {filteredOrders.map((order) => {
              const status = getStatus(order);
              return (
                <tr
                  key={order.orderid}
                  onClick={() => openOrderDetail(order)}
                  className="cursor-pointer hover:bg-rose-50/50"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">#{order.orderid}</div>
                    <div className="text-xs text-slate-400">{displayDate(order.createdat)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{order.username || order.customer_name || "Khách hàng"}</div>
                    <div className="text-xs text-slate-500">{order.email || order.customer_email || "—"}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatPrice(Number(order.totalamount || 0))}</td>
                  <td className="px-5 py-4 text-slate-600">{order.item_count || 0}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(status)}`}>
                      {statusLabel(status)}
                    </span>
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={status}
                      disabled={savingOrderId === order.orderid}
                      onChange={(e) => handleStatusChange(order.orderid, e.target.value)}
                      className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 disabled:opacity-50"
                    >
                      {ORDER_STATUSES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          loading={detailLoading}
          badgeClass={badgeClass}
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </div>
  );
}

function OrderDetailModal({
  order,
  loading,
  badgeClass,
  onClose,
}: {
  order: AdminOrder;
  loading: boolean;
  badgeClass: (status?: string) => string;
  onClose: () => void;
}) {
  const status = getStatus(order);
  const subtotal = Number(order.subtotal || 0);
  const shippingCost = Number(order.shippingcost || 0);
  const total = Number(order.grand_total || order.totalamount || subtotal + shippingCost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-semibold text-rose-500">Chi tiết đơn hàng</p>
            <h3 className="text-2xl font-black text-slate-900">Đơn #{order.orderid}</h3>
            <p className="text-sm text-slate-500">Ngày đặt: {displayDate(order.createdat)}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold hover:bg-slate-200">Đóng</button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Đang tải chi tiết...</div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <InfoCard label="Trạng thái" value={statusLabel(status)} badgeClass={badgeClass(status)} />
              <InfoCard label="Tổng tiền" value={formatPrice(total)} sub="Tổng thanh toán" />
              <InfoCard label="Thanh toán" value={order.paymentmethod || "—"} sub={order.paymentstatus || "—"} />
              <InfoCard label="Mã vận đơn" value={order.trackingnumber || order.tracking_number || "—"} sub={order.shippingmethod || "—"} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 p-4">
                <h4 className="font-bold text-slate-900">Khách hàng</h4>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p><b>Tên:</b> {order.customer_name || order.username || "—"}</p>
                  <p><b>Email:</b> {order.customer_email || order.email || "—"}</p>
                  <p><b>SĐT:</b> {order.customer_phone || "—"}</p>
                </div>
              </section>
              <section className="rounded-2xl border border-slate-100 p-4">
                <h4 className="font-bold text-slate-900">Địa chỉ nhận hàng</h4>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p><b>Người nhận:</b> {order.receiver_name || order.customer_name || "—"}</p>
                  <p><b>SĐT nhận:</b> {order.receiver_phone || order.customer_phone || "—"}</p>
                  <p><b>Địa chỉ:</b> {joinAddress(order)}</p>
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-900">Sản phẩm trong đơn</div>
              <table className="w-full text-sm">
                <thead className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Phân loại</th>
                    <th className="px-4 py-3">SL</th>
                    <th className="px-4 py-3">Đơn giá</th>
                    <th className="px-4 py-3">Giảm</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).length ? order.items?.map((item) => (
                    <tr key={item.orderitemid}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={item.image_url || "/images/no-image.png"} alt={item.image_alt || item.title || `Product #${item.productid}`} className="h-14 w-14 rounded-xl border border-slate-100 object-cover" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{item.title || `Sản phẩm #${item.productid}`}</div>
                            <div className="text-xs text-slate-400">
                              {[item.brand, item.age_group, item.skill_type].filter(Boolean).join(" • ") || `Mã SP: #${item.productid}`}
                            </div>
                          </div>
                        </div>
                        {item.gift_wrapping ? <div className="mt-1 text-xs text-rose-500">Có gói quà{item.gift_message ? `: ${item.gift_message}` : ""}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{[item.colorname, item.sizename].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{formatPrice(Number(item.price || 0))}</td>
                      <td className="px-4 py-3">{Number(item.discount || 0)}%</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(Number(item.line_total || 0))}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu sản phẩm trong đơn.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 p-4">
                <h4 className="font-bold text-slate-900">Thanh toán & giao hàng</h4>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p><b>Thanh toán:</b> {order.paymentmethod || "—"}</p>
                  <p><b>Trạng thái:</b> {order.paymentstatus || "—"}</p>
                  <p><b>Mã giao dịch:</b> {order.transactionid || "—"}</p>
                  <p><b>Phương thức ship:</b> {order.shippingmethod || "—"}</p>
                  <p><b>Mã vận đơn:</b> {order.trackingnumber || order.tracking_number || "—"}</p>
                  <p><b>Ngày gửi:</b> {displayDate(order.shippedat)}</p>
                </div>
              </section>
              <section className="rounded-2xl border border-slate-100 p-4">
                <h4 className="font-bold text-slate-900">Tổng kết tiền</h4>
                <div className="mt-3 space-y-2 text-sm">
                  <MoneyRow label="Tạm tính" value={subtotal} />
                  <MoneyRow label="Phí ship" value={shippingCost} />
                  <div className="border-t border-slate-100 pt-2">
                    <MoneyRow label="Tổng thanh toán" value={total} strong />
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub, badgeClass }: { label: string; value: string; sub?: string; badgeClass?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {badgeClass ? (
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>{value}</span>
      ) : (
        <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
      )}
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function MoneyRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-black text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{formatPrice(Number(value || 0))}</span>
    </div>
  );
}
