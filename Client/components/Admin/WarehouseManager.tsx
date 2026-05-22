"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import {
  getLowStockProducts,
  getProductBatches,
  getTopWarehouseProducts,
  getWarehouseOrders,
  getWarehouseProducts,
  getWarehouseReturns,
  getWarehouseSummary,
  stockIn,
  stockOut,
  updateFulfillmentStatus,
  updateReturnStatus,
} from "@/app/api/warehouse";

type Product = { productid: number; title: string; stock: number; low_stock_threshold?: number; brand?: string; sold_quantity?: number };
type Order = { orderid: number; username?: string; email?: string; totalamount: number; status: string; tracking_number?: string; item_count: number; createdat: string };
type Batch = { batch_id: number; product_id: number; title: string; batch_number: string; quantity: number; manufacture_date?: string; expiry_date?: string };
type ReturnItem = { return_id: number; orderid: number; productid: number; title?: string; username?: string; quantity: number; reason: string; status: string };

const cardClass = "rounded-3xl bg-white border border-rose-100 shadow-sm p-6";
const inputClass = "w-full rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300";
const buttonClass = "rounded-xl bg-slate-950 text-white px-5 py-3 text-sm font-bold hover:bg-rose-500 transition";

// Trạng thái cho Order Fulfillment (kho phụ trách: chuẩn bị → đóng gói → giao)
const FULFILLMENT_STATUSES = [
  { value: "Preparing", label: "Đang chuẩn bị hàng" },
  { value: "Shipping",  label: "Đang giao hàng" },
  { value: "Completed", label: "Giao thành công" },
  { value: "Failed",    label: "Giao thất bại" },
];

// Trạng thái cho hàng trả lại
const RETURN_STATUSES = [
  { value: "processing", label: "Đang xử lý" },
  { value: "approved",   label: "Đã chấp nhận" },
  { value: "rejected",   label: "Từ chối" },
  { value: "completed",  label: "Hoàn tất" },
];

export default function WarehouseManager() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("inventory");

  const emptyStockInForm = { productID: "", quantity: "", batchNumber: "", manufactureDate: "", expiryDate: "", note: "" };
  const emptyStockOutForm = { productID: "", quantity: "", note: "" };
  const [stockInForm, setStockInForm] = useState(emptyStockInForm);
  const [stockOutForm, setStockOutForm] = useState(emptyStockOutForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, productRes, lowRes, topRes, batchRes, orderRes, returnRes] = await Promise.all([
        getWarehouseSummary(),
        getWarehouseProducts(),
        getLowStockProducts(),
        getTopWarehouseProducts(),
        getProductBatches(),
        getWarehouseOrders(),
        getWarehouseReturns(),
      ]);
      setSummary(summaryRes.data || null);
      setProducts(productRes.data?.data || []);
      setLowStock(lowRes.data?.data || []);
      setTopProducts(topRes.data?.data || []);
      setBatches(batchRes.data?.data || []);
      setOrders(orderRes.data?.data || []);
      setReturns(returnRes.data?.data || []);
    } catch {
      setError("Không tải được dữ liệu kho. Kiểm tra server/API warehouse.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Nhập kho ────────────────────────────────────────────────────────────────
  const handleStockIn = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!stockInForm.productID || !stockInForm.quantity) {
      setError("Vui lòng chọn sản phẩm và nhập số lượng.");
      return;
    }
    const payload = {
      productID: Number(stockInForm.productID),
      quantity: Number(stockInForm.quantity),
      batchNumber: stockInForm.batchNumber || undefined,
      manufactureDate: stockInForm.manufactureDate || undefined,
      expiryDate: stockInForm.expiryDate || undefined,
      note: stockInForm.note || undefined,
    };
    try {
      await stockIn(payload);
      setMessage("Đã nhập kho thành công.");
      setStockInForm(emptyStockInForm);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Nhập kho thất bại. Kiểm tra lại thông tin.");
    }
  };

  // ─── Xuất kho ────────────────────────────────────────────────────────────────
  const handleStockOut = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!stockOutForm.productID || !stockOutForm.quantity) {
      setError("Vui lòng chọn sản phẩm và nhập số lượng xuất.");
      return;
    }
    const selectedProduct = products.find((p) => p.productid === Number(stockOutForm.productID));
    if (selectedProduct && Number(stockOutForm.quantity) > selectedProduct.stock) {
      setError(`Số lượng xuất (${stockOutForm.quantity}) vượt quá tồn kho hiện tại (${selectedProduct.stock}).`);
      return;
    }
    const payload = {
      productID: Number(stockOutForm.productID),
      quantity: Number(stockOutForm.quantity),
      note: stockOutForm.note || undefined,
    };
    try {
      await stockOut(payload);
      setMessage("Đã xuất kho thành công.");
      setStockOutForm(emptyStockOutForm);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Xuất kho thất bại. Kiểm tra lại tồn kho.");
    }
  };

  const changeOrderStatus = async (orderID: number, status: string) => {
    try {
      await updateFulfillmentStatus(orderID, status);
      const label = FULFILLMENT_STATUSES.find((s) => s.value === status)?.label || status;
      setMessage(`Đã cập nhật đơn #${orderID}: ${label}.`);
      await loadData();
    } catch {
      setError("Không cập nhật được trạng thái đơn hàng.");
    }
  };

  const changeReturnStatus = async (returnID: number, status: string) => {
    try {
      await updateReturnStatus(returnID, status);
      const label = RETURN_STATUSES.find((s) => s.value === status)?.label || status;
      setMessage(`Đã cập nhật yêu cầu trả hàng #${returnID}: ${label}.`);
      await loadData();
    } catch {
      setError("Không cập nhật được trạng thái trả hàng.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Quản trị kho</h1>
          <p className="text-slate-500">Nhập/xuất kho, theo dõi lô sản phẩm, cảnh báo tồn kho và xử lý đơn hàng.</p>
        </div>
        <button onClick={loadData} className="rounded-2xl border border-rose-100 px-5 py-3 font-bold text-rose-500 hover:bg-rose-50">Tải lại</button>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[["SẢN PHẨM", summary?.products ?? "—"], ["SẮP HẾT HÀNG", summary?.lowStock ?? "—"], ["ĐƠN CẦN XỬ LÝ", summary?.pendingOrders ?? "—"], ["HÀNG TRẢ LẠI", summary?.returns ?? "—"]].map(([label, value]) => (
          <div key={label} className={cardClass}>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-400">{label}</p>
            <p className="mt-3 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[["inventory", "Nhập / xuất kho"], ["alerts", "Cảnh báo tồn kho"], ["batches", "Lô sản phẩm"], ["orders", "Order Fulfillment"], ["returns", "Hàng trả lại"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === key ? "bg-rose-400 text-white" : "border border-rose-100 bg-white text-rose-500"}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className={cardClass}>Đang tải dữ liệu...</div> : null}

      {/* ─── Tab: Nhập / Xuất kho ─────────────────────────────────────────── */}
      {tab === "inventory" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Nhập kho */}
          <form onSubmit={handleStockIn} className={cardClass}>
            <h3 className="mb-4 text-xl font-black">Quản lý nhập kho</h3>
            <div className="grid gap-3">
              <select
                className={inputClass}
                value={stockInForm.productID}
                onChange={(e) => setStockInForm({ ...stockInForm, productID: e.target.value })}
                required
              >
                <option value="">Chọn sản phẩm</option>
                {products.map((p) => (
                  <option key={p.productid} value={p.productid}>{p.title} - tồn {p.stock}</option>
                ))}
              </select>
              <input
                className={inputClass}
                type="number"
                min="1"
                placeholder="Số lượng nhập"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                required
              />
              <input
                className={inputClass}
                placeholder="Mã lô"
                value={stockInForm.batchNumber}
                onChange={(e) => setStockInForm({ ...stockInForm, batchNumber: e.target.value })}
              />
              <input
                className={inputClass}
                type="date"
                placeholder="Ngày sản xuất"
                value={stockInForm.manufactureDate}
                onChange={(e) => setStockInForm({ ...stockInForm, manufactureDate: e.target.value })}
              />
              <input
                className={inputClass}
                type="date"
                placeholder="Ngày hết hạn"
                value={stockInForm.expiryDate}
                onChange={(e) => setStockInForm({ ...stockInForm, expiryDate: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Ghi chú"
                value={stockInForm.note}
                onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })}
              />
            </div>
            <button className={`${buttonClass} mt-4`} type="submit">Nhập kho</button>
          </form>

          {/* Xuất kho */}
          <form onSubmit={handleStockOut} className={cardClass}>
            <h3 className="mb-4 text-xl font-black">Quản lý xuất kho</h3>
            <div className="grid gap-3">
              <select
                className={inputClass}
                value={stockOutForm.productID}
                onChange={(e) => setStockOutForm({ ...stockOutForm, productID: e.target.value })}
                required
              >
                <option value="">Chọn sản phẩm</option>
                {products.map((p) => (
                  <option key={p.productid} value={p.productid}>{p.title} - tồn {p.stock}</option>
                ))}
              </select>
              <input
                className={inputClass}
                type="number"
                min="1"
                max={products.find((p) => p.productid === Number(stockOutForm.productID))?.stock || undefined}
                placeholder="Số lượng xuất"
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                required
              />
              {stockOutForm.productID && (
                <p className="text-xs text-slate-500">
                  Tồn hiện tại: <b>{products.find((p) => p.productid === Number(stockOutForm.productID))?.stock ?? "—"}</b>
                </p>
              )}
              <input
                className={inputClass}
                placeholder="Ghi chú lý do xuất"
                value={stockOutForm.note}
                onChange={(e) => setStockOutForm({ ...stockOutForm, note: e.target.value })}
              />
            </div>
            <button className={`${buttonClass} mt-4`} type="submit">Xuất kho</button>
          </form>
        </div>
      ) : null}

      {/* ─── Tab: Cảnh báo tồn kho ────────────────────────────────────────── */}
      {tab === "alerts" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <TableCard title="Sản phẩm sắp hết hàng">
            <Table headers={["Sản phẩm", "Tồn", "Ngưỡng", "Thương hiệu"]} rows={lowStock.map((p) => [p.title, p.stock, p.low_stock_threshold ?? 10, p.brand || "—"])} />
          </TableCard>
          <TableCard title="Sản phẩm bán chạy">
            <Table headers={["Sản phẩm", "Đã bán", "Tồn"]} rows={topProducts.map((p) => [p.title, p.sold_quantity ?? 0, p.stock])} />
          </TableCard>
        </div>
      ) : null}

      {/* ─── Tab: Lô sản phẩm ─────────────────────────────────────────────── */}
      {tab === "batches" ? (
        <TableCard title="Lô sản phẩm">
          <Table headers={["Mã lô", "Sản phẩm", "Số lượng", "Ngày SX", "Hạn dùng"]} rows={batches.map((b) => [b.batch_number, b.title || b.product_id, b.quantity, b.manufacture_date?.slice(0, 10) || "—", b.expiry_date?.slice(0, 10) || "—"])} />
        </TableCard>
      ) : null}

      {/* ─── Tab: Order Fulfillment ───────────────────────────────────────── */}
      {tab === "orders" ? (
        <TableCard title="Chuẩn bị - Đóng gói - Giao hàng">
          <Table
            headers={["Đơn", "Khách", "Tổng", "SP", "Trạng thái", "Cập nhật"]}
            rows={orders.map((order) => [
              `#${order.orderid}`,
              order.username || order.email || "—",
              formatPrice(Number(order.totalamount || 0)),
              order.item_count,
              order.status,
              <div className="flex flex-wrap gap-1" key={order.orderid}>
                {FULFILLMENT_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => changeOrderStatus(order.orderid, s.value)}
                    className={`rounded-lg border px-3 py-1 text-xs transition hover:bg-rose-100 ${order.status === s.value ? "border-rose-400 bg-rose-100 font-bold text-rose-700" : "border-rose-100"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>,
            ])}
          />
        </TableCard>
      ) : null}

      {/* ─── Tab: Hàng trả lại ───────────────────────────────────────────── */}
      {tab === "returns" ? (
        <TableCard title="Quản lý hàng trả lại">
          <Table
            headers={["Mã", "Đơn", "Sản phẩm", "SL", "Lý do", "Trạng thái", "Cập nhật"]}
            rows={returns.map((item) => [
              `#${item.return_id}`,
              `#${item.orderid}`,
              item.title || item.productid,
              item.quantity,
              item.reason,
              <span key={`ret-status-${item.return_id}`} className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                {RETURN_STATUSES.find((s) => s.value === item.status)?.label || item.status}
              </span>,
              <div className="flex flex-wrap gap-1" key={item.return_id}>
                {RETURN_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => changeReturnStatus(item.return_id, s.value)}
                    className={`rounded-lg border px-3 py-1 text-xs transition hover:bg-rose-100 ${item.status === s.value ? "border-rose-400 bg-rose-100 font-bold text-rose-700" : "border-rose-100"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>,
            ])}
          />
        </TableCard>
      ) : null}
    </div>
  );
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-rose-100 shadow-sm p-6">
      <h3 className="mb-4 text-xl font-black">{title}</h3>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-rose-400">
            {headers.map((header) => <th key={header} className="py-3 pr-4">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-rose-50">
          {rows.length
            ? rows.map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="py-3 pr-4">{cell}</td>)}</tr>
              ))
            : <tr><td colSpan={headers.length} className="py-5 text-center text-slate-400">Không có dữ liệu.</td></tr>
          }
        </tbody>
      </table>
    </div>
  );
}
