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
} from "@/app/api/sales";

type Product = { productid: number; title: string; price: number; discount?: number; stock: number; age_group?: string; gender?: string; skill_type?: string; brand?: string; sold_quantity?: number };
type Order = { orderid: number; username?: string; email?: string; totalamount: number; status: string; item_count: number; createdat: string };
type Promotion = { id: number; code: string; type: string; discount: number; expiration_date?: string; is_active: boolean; event_name?: string; season?: string };
type Coupon = { couponid: number; code: string; description?: string; discountpercentage?: number; validuntil?: string };
type Wishlist = { wishlistitemid: number; username?: string; email?: string; title: string; price: number; stock: number; age_group?: string; skill_type?: string };
type Birthday = { child_id: number; username?: string; email?: string; child_name?: string; birth_date: string; child_age?: number; gender?: string };

const cardClass = "rounded-3xl bg-white border border-rose-100 shadow-sm p-6";
const inputClass = "w-full rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300";
const buttonClass = "rounded-xl bg-slate-950 text-white px-5 py-3 text-sm font-bold hover:bg-rose-500 transition";

export default function SalesStaffManager() {
  const [summary, setSummary] = useState<any>(null);
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

  const [filter, setFilter] = useState({ ageGroup: "", skillType: "", gender: "", keyword: "" });
  const [promotionForm, setPromotionForm] = useState({ code: "", type: "percent", discount: "", expirationDate: "", eventName: "", ageGroup: "", season: "", minChildAge: "", maxChildAge: "" });
  const [couponForm, setCouponForm] = useState({ code: "", description: "", discountPercentage: "", maxDiscountAmount: "", minPurchaseAmount: "", validFrom: "", validUntil: "" });

  const currency = useMemo(() => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD" }), []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, productRes, orderRes, promoRes, couponRes, wishlistRes, birthdayRes] = await Promise.all([
        getSalesSummary(),
        getSalesProducts(),
        getSalesOrders(),
        getSalesPromotions(),
        getSalesCoupons(),
        getWishlistSuggestions(),
        getCustomerBirthdays(),
      ]);
      setSummary(summaryRes.data || null);
      setProducts(productRes.data?.data || []);
      setOrders(orderRes.data?.data || []);
      setPromotions(promoRes.data?.data || []);
      setCoupons(couponRes.data?.data || []);
      setWishlists(wishlistRes.data?.data || []);
      setBirthdays(birthdayRes.data?.data || []);
    } catch {
      setError("Không tải được dữ liệu bán hàng. Kiểm tra server hoặc quyền role sales_staff/admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const searchProducts = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const params = Object.fromEntries(Object.entries(filter).filter(([, value]) => value));
      const response = await getSalesProducts(params);
      setProducts(response.data?.data || []);
      setMessage("Đã lọc sản phẩm tư vấn.");
    } catch { setError("Không lọc được sản phẩm."); }
  };

  const submitPromotion = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createSalesPromotion(promotionForm);
      setPromotionForm({ code: "", type: "percent", discount: "", expirationDate: "", eventName: "", ageGroup: "", season: "", minChildAge: "", maxChildAge: "" });
      setMessage("Đã tạo chương trình giảm giá.");
      loadData();
    } catch { setError("Không tạo được promotion."); }
  };

  const submitCoupon = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createSalesCoupon(couponForm);
      setCouponForm({ code: "", description: "", discountPercentage: "", maxDiscountAmount: "", minPurchaseAmount: "", validFrom: "", validUntil: "" });
      setMessage("Đã tạo mã coupon.");
      loadData();
    } catch { setError("Không tạo được coupon."); }
  };

  const confirmOrder = async (orderID: number) => {
    try {
      await confirmSalesOrder(orderID);
      setMessage(`Đã xác nhận đơn #${orderID}.`);
      loadData();
    } catch { setError("Không xác nhận được đơn hàng."); }
  };

  const tabs = [
    ["consulting", "Tư vấn sản phẩm"],
    ["orders", "Tạo/Xác nhận đơn"],
    ["promotions", "Khuyến mãi"],
    ["coupons", "Coupon"],
    ["care", "Chăm sóc KH"],
  ];

  if (loading) return <div className={cardClass}>Đang tải dữ liệu Sales Staff...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Đơn chờ xác nhận" value={summary?.pendingOrders || 0} />
        <Stat label="Promotion đang chạy" value={summary?.activePromotions || 0} />
        <Stat label="Coupon còn hiệu lực" value={summary?.activeCoupons || 0} />
        <Stat label="Sinh nhật sắp tới" value={summary?.upcomingBirthdays || 0} />
      </div>

      {message ? <div className="rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-3 text-sm">{message}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 border border-red-100 text-red-600 px-5 py-3 text-sm">{error}</div> : null}

      <div className="flex gap-2 flex-wrap">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === key ? "bg-slate-950 text-white" : "bg-white border border-rose-100 text-rose-500"}`}>{label}</button>
        ))}
      </div>

      {tab === "consulting" ? (
        <section className={cardClass}>
          <h2 className="text-xl font-black mb-4">Tư vấn sản phẩm theo độ tuổi và kỹ năng</h2>
          <form onSubmit={searchProducts} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
            <input className={inputClass} placeholder="Độ tuổi VD: 6-12" value={filter.ageGroup} onChange={(e) => setFilter({ ...filter, ageGroup: e.target.value })} />
            <input className={inputClass} placeholder="Kỹ năng" value={filter.skillType} onChange={(e) => setFilter({ ...filter, skillType: e.target.value })} />
            <input className={inputClass} placeholder="Giới tính" value={filter.gender} onChange={(e) => setFilter({ ...filter, gender: e.target.value })} />
            <input className={inputClass} placeholder="Từ khóa" value={filter.keyword} onChange={(e) => setFilter({ ...filter, keyword: e.target.value })} />
            <button className={buttonClass}>Lọc</button>
          </form>
          <DataTable headers={["Sản phẩm", "Tuổi", "Kỹ năng", "Kho", "Đã bán", "Giá"]} rows={products.map((p) => [p.title, p.age_group || "-", p.skill_type || "-", p.stock, p.sold_quantity || 0, currency.format(Number(p.price || 0))])} />
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className={cardClass}>
          <h2 className="text-xl font-black mb-4">Hỗ trợ tạo đơn hàng / Xác nhận đơn hàng</h2>
          <p className="text-sm text-slate-500 mb-4">Form tạo đơn có API sẵn: POST /api/sales/orders. Giao diện nhanh bên dưới tập trung xác nhận đơn đang có.</p>
          <DataTable headers={["Mã đơn", "Khách hàng", "Email", "Tổng tiền", "Số SP", "Trạng thái", "Thao tác"]} rows={orders.map((o) => [
            `#${o.orderid}`,
            o.username || "-",
            o.email || "-",
            currency.format(Number(o.totalamount || 0)),
            o.item_count,
            o.status,
            <button key={o.orderid} onClick={() => confirmOrder(o.orderid)} className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-600">Confirm</button>,
          ])} />
        </section>
      ) : null}

      {tab === "promotions" ? (
        <section className={cardClass}>
          <h2 className="text-xl font-black mb-4">Tạo chương trình giảm giá theo dịp</h2>
          <form onSubmit={submitPromotion} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <input className={inputClass} placeholder="Code" value={promotionForm.code} onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value })} />
            <select className={inputClass} value={promotionForm.eventName} onChange={(e) => setPromotionForm({ ...promotionForm, eventName: e.target.value })}>
              <option value="">Chọn dịp</option><option>Quốc tế Thiếu nhi</option><option>Trung thu</option><option>Noel</option><option>Sinh nhật</option>
            </select>
            <input className={inputClass} placeholder="Giảm giá" type="number" value={promotionForm.discount} onChange={(e) => setPromotionForm({ ...promotionForm, discount: e.target.value })} />
            <input className={inputClass} type="date" value={promotionForm.expirationDate} onChange={(e) => setPromotionForm({ ...promotionForm, expirationDate: e.target.value })} />
            <button className={buttonClass}>Tạo promotion</button>
          </form>
          <DataTable headers={["Code", "Dịp", "Loại", "Giảm", "Mùa", "Trạng thái"]} rows={promotions.map((p) => [p.code, p.event_name || "-", p.type, p.discount, p.season || "-", p.is_active ? "Active" : "Off"])} />
        </section>
      ) : null}

      {tab === "coupons" ? (
        <section className={cardClass}>
          <h2 className="text-xl font-black mb-4">Quản lý mã coupon</h2>
          <form onSubmit={submitCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <input className={inputClass} placeholder="Coupon code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
            <input className={inputClass} placeholder="Mô tả" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
            <input className={inputClass} placeholder="% giảm" type="number" value={couponForm.discountPercentage} onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: e.target.value })} />
            <input className={inputClass} type="date" value={couponForm.validUntil} onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })} />
            <button className={buttonClass}>Tạo coupon</button>
          </form>
          <DataTable headers={["Code", "Mô tả", "% giảm", "Hết hạn"]} rows={coupons.map((c) => [c.code, c.description || "-", c.discountpercentage || 0, c.validuntil ? new Date(c.validuntil).toLocaleDateString("vi-VN") : "-"])} />
        </section>
      ) : null}

      {tab === "care" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className={cardClass}>
            <h2 className="text-xl font-black mb-4">Theo dõi Wishlist để gợi ý sản phẩm</h2>
            <DataTable headers={["Khách", "Email", "Sản phẩm", "Tuổi", "Kho", "Giá"]} rows={wishlists.map((w) => [w.username || "-", w.email || "-", w.title, w.age_group || "-", w.stock, currency.format(Number(w.price || 0))])} />
          </section>
          <section className={cardClass}>
            <h2 className="text-xl font-black mb-4">Lịch sinh nhật khách hàng</h2>
            <DataTable headers={["Phụ huynh", "Email", "Bé", "Ngày sinh", "Tuổi"]} rows={birthdays.map((b) => [b.username || "-", b.email || "-", b.child_name || "-", b.birth_date ? new Date(b.birth_date).toLocaleDateString("vi-VN") : "-", b.child_age || "-"])} />
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className={cardClass}><p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-bold">{label}</p><p className="text-3xl font-black mt-3">{value}</p></div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-rose-400 border-b border-rose-100">{headers.map((h) => <th key={h} className="py-3 pr-4 font-black">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-b border-rose-50">{row.map((cell, i) => <td key={i} className="py-3 pr-4 text-slate-700">{cell}</td>)}</tr>)}</tbody>
      </table>
      {!rows.length ? <p className="text-sm text-slate-400 py-6">Chưa có dữ liệu.</p> : null}
    </div>
  );
}
