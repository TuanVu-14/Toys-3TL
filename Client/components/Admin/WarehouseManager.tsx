"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
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

type Product = {
  productid: number;
  title: string;
  stock: number;
  low_stock_threshold?: number;
  brand?: string;
  sold_quantity?: number;
};

type Order = {
  orderid: number;
  username?: string;
  email?: string;
  totalamount: number;
  status: string;
  tracking_number?: string;
  item_count: number;
  createdat: string;
};

type Batch = {
  batch_id: number;
  product_id: number;
  title: string;
  batch_number: string;
  quantity: number;
  manufacture_date?: string;
  expiry_date?: string;
};

type ReturnItem = {
  return_id: number;
  orderid: number;
  productid: number;
  title?: string;
  username?: string;
  quantity: number;
  reason: string;
  status: string;
};

const cardClass = "rounded-3xl bg-white border border-rose-100 shadow-sm p-6";
const inputClass = "w-full rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300";
const buttonClass = "rounded-xl bg-slate-950 text-white px-5 py-3 text-sm font-bold hover:bg-rose-500 transition";

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

  const [stockForm, setStockForm] = useState({
    productID: "",
    quantity: "",
    batchNumber: "",
    manufactureDate: "",
    expiryDate: "",
    note: "",
  });

  const currency = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD" }),
    [],
  );

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

  useEffect(() => {
    loadData();
  }, []);

  const handleStock = async (type: "in" | "out", event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      productID: Number(stockForm.productID),
      quantity: Number(stockForm.quantity),
      batchNumber: stockForm.batchNumber || undefined,
      manufactureDate: stockForm.manufactureDate || undefined,
      expiryDate: stockForm.expiryDate || undefined,
      note: stockForm.note || undefined,
    };

    try {
      if (type === "in") await stockIn(payload);
      else await stockOut(payload);
      setMessage(type === "in" ? "Đã nhập kho thành công." : "Đã xuất kho thành công.");
      setStockForm({ productID: "", quantity: "", batchNumber: "", manufactureDate: "", expiryDate: "", note: "" });
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Thao tác thất bại.");
    }
  };

  const changeOrderStatus = async (orderID: number, status: string) => {
    setMessage("");
    setError("");
    try {
      await updateFulfillmentStatus(orderID, status);
      setMessage(`Đã cập nhật đơn #${orderID} sang ${status}.`);
      await loadData();
    } catch {
      setError("Không cập nhật được trạng thái đơn hàng.");
    }
  };

  const changeReturnStatus = async (returnID: number, status: string) => {
    setMessage("");
    setError("");
    try {
      await updateReturnStatus(returnID, status);
      setMessage(`Đã cập nhật yêu cầu trả hàng #${returnID}.`);
      await loadData();
    } catch {
      setError("Không cập nhật được trạng thái trả hàng.");
    }
  };

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Quản trị kho</h2>
            <p className="text-slate-500 mt-1">Nhập/xuất kho, theo dõi lô sản phẩm, cảnh báo tồn kho và xử lý đơn hàng.</p>
          </div>
          <button onClick={loadData} className={buttonClass}>Tải lại</button>
        </div>
        {message ? <div className="mt-4 rounded-2xl bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 text-rose-600 px-4 py-3 text-sm">{error}</div> : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ["Sản phẩm", summary?.products ?? "—"],
          ["Sắp hết hàng", summary?.lowStock ?? "—"],
          ["Đơn cần xử lý", summary?.pendingOrders ?? "—"],
          ["Hàng trả lại", summary?.returns ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className={cardClass}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-black mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["inventory", "Nhập / xuất kho"],
          ["alerts", "Cảnh báo tồn kho"],
          ["batches", "Lô sản phẩm"],
          ["orders", "Order Fulfillment"],
          ["returns", "Hàng trả lại"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === key ? "bg-rose-400 text-white" : "bg-white border border-rose-100 text-rose-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className={cardClass}>Đang tải dữ liệu...</div> : null}

      {tab === "inventory" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form className={cardClass} onSubmit={(event) => handleStock("in", event)}>
            <h3 className="text-xl font-black mb-4">Quản lý nhập kho</h3>
            <StockFormFields products={products} stockForm={stockForm} setStockForm={setStockForm} />
            <button className={`${buttonClass} mt-4`} type="submit">Nhập kho</button>
          </form>

          <form className={cardClass} onSubmit={(event) => handleStock("out", event)}>
            <h3 className="text-xl font-black mb-4">Quản lý xuất kho</h3>
            <StockFormFields products={products} stockForm={stockForm} setStockForm={setStockForm} hideDates />
            <button className={`${buttonClass} mt-4`} type="submit">Xuất kho</button>
          </form>
        </div>
      ) : null}

      {tab === "alerts" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TableCard title="Cảnh báo sản phẩm sắp hết hàng">
            <Table headers={["Sản phẩm", "Tồn kho", "Ngưỡng", "Thương hiệu"]} rows={lowStock.map((p) => [p.title, p.stock, p.low_stock_threshold ?? 10, p.brand || "—"])} />
          </TableCard>
          <TableCard title="Mặt hàng chủ lực / bán chạy">
            <Table headers={["Sản phẩm", "Đã bán", "Tồn kho"]} rows={topProducts.map((p) => [p.title, p.sold_quantity ?? 0, p.stock])} />
          </TableCard>
        </div>
      ) : null}

      {tab === "batches" ? (
        <TableCard title="Theo dõi tồn kho theo lô sản phẩm">
          <Table
            headers={["Mã lô", "Sản phẩm", "Số lượng", "Ngày SX", "Hạn dùng"]}
            rows={batches.map((b) => [b.batch_number, b.title || b.product_id, b.quantity, b.manufacture_date?.slice(0, 10) || "—", b.expiry_date?.slice(0, 10) || "—"])}
          />
        </TableCard>
      ) : null}

      {tab === "orders" ? (
        <TableCard title="Chuẩn bị hàng / Đóng gói / Giao hàng">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b border-rose-100"><th className="py-3">Đơn</th><th>Khách</th><th>Tổng</th><th>SP</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderid} className="border-b border-rose-50">
                    <td className="py-3 font-bold">#{order.orderid}</td>
                    <td>{order.username || order.email || "—"}</td>
                    <td>{currency.format(Number(order.totalamount || 0))}</td>
                    <td>{order.item_count}</td>
                    <td><span className="rounded-full bg-rose-50 text-rose-500 px-3 py-1 text-xs font-bold">{order.status}</span></td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {["Prepared", "Packed", "Shipped", "Delivered"].map((status) => (
                          <button key={status} onClick={() => changeOrderStatus(order.orderid, status)} className="rounded-lg border border-rose-100 px-3 py-1 text-xs hover:bg-rose-100">
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      ) : null}

      {tab === "returns" ? (
        <TableCard title="Quản lý hàng trả lại">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b border-rose-100"><th className="py-3">Mã</th><th>Đơn</th><th>Sản phẩm</th><th>SL</th><th>Lý do</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {returns.map((item) => (
                  <tr key={item.return_id} className="border-b border-rose-50">
                    <td className="py-3 font-bold">#{item.return_id}</td>
                    <td>#{item.orderid}</td>
                    <td>{item.title || item.productid}</td>
                    <td>{item.quantity}</td>
                    <td>{item.reason}</td>
                    <td>{item.status}</td>
                    <td className="flex gap-2 py-2">
                      {["processing", "approved", "rejected", "completed"].map((status) => (
                        <button key={status} onClick={() => changeReturnStatus(item.return_id, status)} className="rounded-lg border border-rose-100 px-3 py-1 text-xs hover:bg-rose-100">
                          {status}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      ) : null}
    </div>
  );
}

function StockFormFields({ products, stockForm, setStockForm, hideDates = false }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <select className={inputClass} value={stockForm.productID} onChange={(e) => setStockForm({ ...stockForm, productID: e.target.value })} required>
        <option value="">Chọn sản phẩm</option>
        {products.map((p: Product) => <option key={p.productid} value={p.productid}>{p.title} - tồn {p.stock}</option>)}
      </select>
      <input className={inputClass} type="number" min="1" placeholder="Số lượng" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
      <input className={inputClass} placeholder="Mã lô / Batch number" value={stockForm.batchNumber} onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })} />
      {!hideDates ? <input className={inputClass} type="date" value={stockForm.manufactureDate} onChange={(e) => setStockForm({ ...stockForm, manufactureDate: e.target.value })} /> : null}
      {!hideDates ? <input className={inputClass} type="date" value={stockForm.expiryDate} onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })} /> : null}
      <input className={inputClass} placeholder="Ghi chú" value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} />
    </div>
  );
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cardClass}>
      <h3 className="text-xl font-black mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-rose-100">
            {headers.map((header) => <th key={header} className="py-3 pr-4">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="border-b border-rose-50">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="py-3 pr-4">{cell}</td>)}
            </tr>
          )) : (
            <tr><td className="py-6 text-center text-slate-500" colSpan={headers.length}>Không có dữ liệu.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
