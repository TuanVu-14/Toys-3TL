"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/Admin/AdminLayout";
import { createAdminBrand, deleteAdminBrand, getAdminBrands, updateAdminBrand } from "@/app/api/admin";

type Brand = {
  brandid: number;
  brand_id?: number;
  name: string;
  slug?: string;
  manufacturer?: string;
  manufacturer_info?: string;
  country?: string;
  description?: string;
  safety_certificates?: string;
  certification_details?: string;
  website?: string;
  logo_url?: string;
  is_active?: boolean;
  product_count?: number;
};

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function BrandsContent() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", manufacturer: "", country: "", description: "", safety_certificates: "", website: "", logo_url: "" });

  const fetchBrands = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminBrands();
      setBrands(response.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không lấy được danh sách thương hiệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", manufacturer: "", country: "", description: "", safety_certificates: "", website: "", logo_url: "" });
  };

  const submit = async () => {
    if (!form.name.trim()) return setError("Vui lòng nhập tên thương hiệu.");
    const payload = { ...form, name: form.name.trim(), slug: form.slug.trim() || slugify(form.name) };
    try {
      if (editingId) await updateAdminBrand(editingId, payload);
      else await createAdminBrand(payload);
      resetForm();
      fetchBrands();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không lưu được thương hiệu.");
    }
  };

  const edit = (brand: Brand) => {
    setEditingId(brand.brandid || brand.brand_id || null);
    setForm({
      name: brand.name || "",
      slug: brand.slug || "",
      manufacturer: brand.manufacturer || brand.manufacturer_info || "",
      country: brand.country || "",
      description: brand.description || "",
      safety_certificates: brand.safety_certificates || brand.certification_details || "",
      website: brand.website || "",
      logo_url: brand.logo_url || "",
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Ẩn thương hiệu này khỏi admin?")) return;
    try {
      await deleteAdminBrand(id);
      fetchBrands();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Không ẩn được thương hiệu.");
    }
  };

  const filteredBrands = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return brands;
    return brands.filter((b) => [b.name, b.manufacturer, b.country, b.description].some((v) => String(v || "").toLowerCase().includes(kw)));
  }, [brands, search]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div><h2 className="text-2xl font-bold text-slate-900">🏭 Quản lý thương hiệu</h2><p className="mt-1 text-sm text-slate-500">Quản lý nhà sản xuất, chứng chỉ an toàn và logo thương hiệu.</p></div>
<div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, quốc gia, nhà sản xuất..." className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-400 min-w-[220px]" />
            <button onClick={fetchBrands} className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white">Tải lại</button>
          </div>
        </div>
        {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Danh sách thương hiệu</h3>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
            {!loading && brands.length === 0 ? <p className="py-8 text-center text-slate-500">Không có thương hiệu nào.</p> : null}
            {filteredBrands.map((brand) => (
              <div key={brand.brandid} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  {brand.logo_url ? <img src={brand.logo_url} alt={brand.name} className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl bg-rose-50" />}
                  <div><p className="font-bold text-slate-900">{brand.name} {!brand.is_active && <span className="text-xs text-rose-500">• Ẩn</span>}</p><p className="text-xs text-slate-500">{brand.product_count || 0} sản phẩm • {brand.safety_certificates || brand.certification_details || "Chưa có chứng chỉ"}</p></div>
                </div>
                <div className="flex gap-2"><button onClick={() => edit(brand)} className="rounded-xl border px-3 py-1.5 text-xs font-semibold">Sửa</button><button onClick={() => remove(brand.brandid)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Ẩn</button></div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">{editingId ? "Sửa thương hiệu" : "Thêm thương hiệu"}</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Tên thương hiệu *<input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })} placeholder="VD: LEGO, Hasbro..." /></label>
            <label className="text-xs font-semibold text-slate-600">Slug<input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="lego" /></label>
            <label className="text-xs font-semibold text-slate-600">Nhà sản xuất<input className={inputClass} value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-600">Quốc gia<input className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-600">Website<input className={inputClass} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-600">Logo URL<input className={inputClass} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Chứng chỉ an toàn<input className={inputClass} value={form.safety_certificates} onChange={(e) => setForm({ ...form, safety_certificates: e.target.value })} placeholder="CE, ASTM, EN71..." /></label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Mô tả<textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          </div>
          <div className="mt-5 flex gap-2"><button onClick={submit} className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white">{editingId ? "Cập nhật" : "Thêm"}</button>{editingId ? <button onClick={resetForm} className="rounded-2xl border px-5 py-2 text-sm font-semibold">Hủy</button> : null}</div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default BrandsContent;
