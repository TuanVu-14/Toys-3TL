"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  confirmSalesOrder,
  createSalesCoupon,
  createSalesPromotion,
  getCustomerBirthdays,
  getSalesCoupons,
  getSalesOrders,
  getSalesProducts,
  getSalesPromotions,
  getSalesSummary,
  getWishlistSuggestions,
  updateSalesOrderStatus,
} from "@/app/api/sales";

type Product = { productid: number; title: string; price: number; discount?: number; stock: number; age_group?: string; gender?: string; skill_type?: string; brand?: string; sold_quantity?: number };
type Order = { orderid: number; username?: string; email?: string; totalamount: number; status: string; delivery_status?: string; item_count: number; createdat: string };
type Promotion = { id: number; code: string; type: string; discount: number; expiration_date?: string; is_active: boolean; event_name?: string; season?: string };
type Coupon = { couponid: number; code: string; description?: string; discountpercentage?: number; validuntil?: string };
type Wishlist = { wishlistitemid: number; username?: string; email?: string; title: string; price: number; stock: number; age_group?: string; skill_type?: string };
type Birthday = { child_id: number; username?: string; email?: string; child_name?: string; birth_date: string; child_age?: number; gender?: string };
type Summary = { products: number; pendingOrders: number; promotions: number; wishlistItems: number };

const inputClass = "w-full rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300";
const buttonClass = "rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500";
const orderStatuses = ["Pending", "Confirmed", "Prepared", "Packed", "Shipped", "Delivered", "Completed", "Cancelled", "Returned", "Refunded", "Payment Failed"];

function formatVND(value: number | string | undefined | null) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function SalesStaffManager() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [tab, setTab] = useState("consulting");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [filter, setFilter] = useState({ ageGroup: "", skillType: "", gender: "", keyword: "" });
  const [promotionForm, setPromotionForm] = useState({ code: "", type: "percentage", discount: "", expirationDate: "", eventName: "", ageGroup: "", season: "", minChildAge: "", maxChildAge: "" });
  const [couponForm, setCouponForm] = useState({ code: "", description: "", discountPercentage: "", maxDiscountAmount: "", minPurchaseAmount: "", validFrom: "", validUntil: "" });

  const tabs = useMemo(() => [
    ["consulting", "Tư vấn sản phẩm"],
    ["orders", "Tạo/Xác nhận đơn"],
    ["promotions", "Khuyến mãi"],
    ["coupons", "Coupon"],
    ["care", "Chăm sóc KH"],
  ], []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      getSalesSummary(),
      getSalesProducts(),
      getSalesOrders(),
      getSalesPromotions(),
      getSalesCoupons(),
      getWishlistSuggestions(),
      getCustomerBirthdays(),
    ]);

    const read = (index: number) => results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<any>).value : null;
    const firstError = results.find((item) => item.status === "rejected") as PromiseRejectedResult | undefined;

    const summaryRes = read(0);
    const productRes = read(1);
    const orderRes = read(2);
    const promoRes = read(3);
    const couponRes = read(4);
    const wishlistRes = read(5);
    const birthdayRes = read(6);

    setSummary(summaryRes?.data || { products: 0, pendingOrders: 0, promotions: 0, wishlistItems: 0 });
    setProducts(productRes?.data?.data || []);
    setOrders(orderRes?.data?.data || []);
    setPromotions(promoRes?.data?.data || []);
    setCoupons(couponRes?.data?.data || []);
    setWishlists(wishlistRes?.data?.data || []);
    setBirthdays(birthdayRes?.data?.data || []);

    if (firstError) {
      const reason: any = firstError.reason;
      setError(reason?.response?.data?.error || "Một phần dữ liệu Sales Management chưa tải được. Kiểm tra terminal server để xem API lỗi.");
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const searchProducts = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(filter).filter(([, value]) => value));
      const response = await getSalesProducts(params);
      setProducts(response.data?.data || []);
      setMessage("Đã lọc sản phẩm tư vấn.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không lọc được sản phẩm.");
    }
  };

  const submitPromotion = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await createSalesPromotion(promotionForm);
      setPromotionForm({ code: "", type: "percentage", discount: "", expirationDate: "", eventName: "", ageGroup: "", season: "", minChildAge: "", maxChildAge: "" });
      setMessage("Đã tạo chương trình giảm giá.");
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không tạo được promotion.");
    }
  };

  const submitCoupon = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await createSalesCoupon(couponForm);
      setCouponForm({ code: "", description: "", discountPercentage: "", maxDiscountAmount: "", minPurchaseAmount: "", validFrom: "", validUntil: "" });
      setMessage("Đã tạo mã coupon.");
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không tạo được coupon.");
    }
  };

  const confirmOrder = async (orderID: number) => {
    setSavingOrderId(orderID);
    setError("");
    try {
      await confirmSalesOrder(orderID);
      setMessage(`Đã xác nhận đơn #${orderID}.`);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không xác nhận được đơn hàng.");
    } finally {
      setSavingOrderId(null);
    }
  };

  const changeOrderStatus = async (orderID: number, status: string) => {
    setSavingOrderId(orderID);
    setError("");
    try {
      await updateSalesOrderStatus(orderID, status);
      setOrders((prev) => prev.map((order) => order.orderid === orderID ? { ...order, status, delivery_status: status === "Completed" ? "Delivered" : status } : order));
      setMessage(`Đã cập nhật đơn #${orderID} sang ${status}.`);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không cập nhật được trạng thái đơn hàng.");
    } finally {
      setSavingOrderId(null);
    }
  };

  if (loading) return <div className="rounded-3xl border border-rose-100 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu Sales Staff...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Sản phẩm tư vấn" value={summary?.products || 0} />
        <Stat label="Đơn chờ xác nhận" value={summary?.pendingOrders || 0} />
        <Stat label="Promotion" value={summary?.promotions || 0} />
        <Stat label="Wishlist" value={summary?.wishlistItems || 0} />
      </div>

      {message ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === key ? "bg-slate-950 text-white" : "border border-rose-100 bg-white text-rose-500"}`}>{label}</button>
        ))}
      </div>

      {tab === "consulting" ? (
        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Tư vấn sản phẩm theo độ tuổi và kỹ năng</h2>
          <form onSubmit={searchProducts} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <input className={inputClass} placeholder="Độ tuổi: 3-6, 5-10..." value={filter.ageGroup} onChange={(e) => setFilter({ ...filter, ageGroup: e.target.value })} />
            <input className={inputClass} placeholder="Kỹ năng: STEM, logic..." value={filter.skillType} onChange={(e) => setFilter({ ...filter, skillType: e.target.value })} />
            <input className={inputClass} placeholder="Giới tính" value={filter.gender} onChange={(e) => setFilter({ ...filter, gender: e.target.value })} />
            <input className={inputClass} placeholder="Từ khóa" value={filter.keyword} onChange={(e) => setFilter({ ...filter, keyword: e.target.value })} />
            <button className={buttonClass}>Lọc</button>
          </form>
          <DataTable headers={["Sản phẩm", "Độ tuổi", "Kỹ năng", "Tồn", "Đã bán", "Giá"]} rows={products.map((p) => [p.title, p.age_group || "-", p.skill_type || "-", p.stock, p.sold_quantity || 0, formatVND(p.price)])} />
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Hỗ trợ xác nhận/cập nhật đơn hàng</h2>
          <DataTable headers={["Đơn", "Khách", "Email", "Tổng tiền", "SP", "Trạng thái", "Cập nhật"]} rows={orders.map((o) => [
            `#${o.orderid}`,
            o.username || "-",
            o.email || "-",
            formatVND(o.totalamount),
            o.item_count,
            o.status,
            <div key={o.orderid} className="flex flex-wrap gap-2">
              <button disabled={savingOrderId === o.orderid} onClick={() => confirmOrder(o.orderid)} className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-50">Confirm</button>
              <select disabled={savingOrderId === o.orderid} value={o.status || "Pending"} onChange={(e) => changeOrderStatus(o.orderid, e.target.value)} className="rounded-lg border border-rose-100 bg-white px-3 py-2 text-xs font-semibold outline-none disabled:opacity-50">
                {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>,
          ])} />
        </section>
      ) : null}

      {tab === "promotions" ? (
        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Tạo chương trình giảm giá theo dịp</h2>
          <form onSubmit={submitPromotion} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <input className={inputClass} placeholder="Mã: NOEL2026" value={promotionForm.code} onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value })} />
            <select className={inputClass} value={promotionForm.eventName} onChange={(e) => setPromotionForm({ ...promotionForm, eventName: e.target.value })}>
              <option value="">Chọn dịp</option><option>Quốc tế Thiếu nhi</option><option>Trung Thu</option><option>Noel</option><option>Sinh nhật</option>
            </select>
            <input className={inputClass} type="number" placeholder="Giảm (%)" value={promotionForm.discount} onChange={(e) => setPromotionForm({ ...promotionForm, discount: e.target.value })} />
            <input className={inputClass} type="date" value={promotionForm.expirationDate} onChange={(e) => setPromotionForm({ ...promotionForm, expirationDate: e.target.value })} />
            <button className={buttonClass}>Tạo promotion</button>
          </form>
          <DataTable headers={["Code", "Dịp", "Loại", "Giảm", "Mùa", "Trạng thái"]} rows={promotions.map((p) => [p.code, p.event_name || "-", p.type, `${p.discount}%`, p.season || "-", p.is_active ? "Active" : "Off"])} />
        </section>
      ) : null}

      {tab === "coupons" ? (
        <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Quản lý mã coupon</h2>
          <form onSubmit={submitCoupon} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <input className={inputClass} placeholder="Mã coupon" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
            <input className={inputClass} placeholder="Mô tả" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
            <input className={inputClass} type="number" placeholder="Giảm %" value={couponForm.discountPercentage} onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: e.target.value })} />
            <input className={inputClass} type="date" value={couponForm.validUntil} onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })} />
            <button className={buttonClass}>Tạo coupon</button>
          </form>
          <DataTable headers={["Code", "Mô tả", "Giảm", "Hết hạn"]} rows={coupons.map((c) => [c.code, c.description || "-", `${c.discountpercentage || 0}%`, c.validuntil ? new Date(c.validuntil).toLocaleDateString("vi-VN") : "-"])} />
        </section>
      ) : null}

      {tab === "care" ? (
        <section className="space-y-6">
          <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Theo dõi Wishlist để gợi ý sản phẩm</h2>
            <DataTable headers={["Khách", "Email", "Sản phẩm", "Độ tuổi", "Tồn", "Giá"]} rows={wishlists.map((w) => [w.username || "-", w.email || "-", w.title, w.age_group || "-", w.stock, formatVND(w.price)])} />
          </div>
          <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Lịch sinh nhật trẻ em</h2>
            <DataTable headers={["Phụ huynh", "Email", "Tên bé", "Ngày sinh", "Tuổi"]} rows={birthdays.map((b) => [b.username || "-", b.email || "-", b.child_name || "-", b.birth_date ? new Date(b.birth_date).toLocaleDateString("vi-VN") : "-", b.child_age || "-"])} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-rose-400">{label}</p><p className="mt-3 text-3xl font-black text-slate-950">{value}</p></div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-widest text-rose-400"><tr>{headers.map((h) => <th key={h} className="border-b border-rose-50 px-3 py-3">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => <tr key={index} className="border-b border-rose-50">{row.map((cell, i) => <td key={i} className="px-3 py-3 text-slate-700">{cell}</td>)}</tr>)}
          {!rows.length ? <tr><td colSpan={headers.length} className="px-3 py-8 text-center text-slate-400">Chưa có dữ liệu.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
