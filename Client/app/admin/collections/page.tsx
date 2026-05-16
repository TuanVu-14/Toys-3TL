"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/Admin/AdminLayout";
import { createAdminCollection, deleteAdminCollection, getAdminCollections, updateAdminCollection } from "@/app/api/admin";

type Collection = { collectionid: number; collection_id?: number; name: string; slug: string; description?: string; imglink?: string; banner_url?: string; icon_url?: string; sort_order?: number; display_order?: number; is_active?: boolean; product_count?: number };
const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
function slugify(value: string) { return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function CollectionsContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", imglink: "", sort_order: 0, is_active: true });

  const fetchCollections = async () => {
    setLoading(true); setError("");
    try { const response = await getAdminCollections(); setCollections(response.data?.data || []); }
    catch (err: any) { setError(err?.response?.data?.error || "Không lấy được danh sách bộ sưu tập. Vui lòng thử lại."); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchCollections(); }, []);

  const resetForm = () => { setEditingId(null); setForm({ name: "", slug: "", description: "", imglink: "", sort_order: 0, is_active: true }); };
  const submit = async () => {
    if (!form.name.trim()) return setError("Vui lòng nhập tên bộ sưu tập.");
    const payload = { ...form, name: form.name.trim(), slug: form.slug.trim() || slugify(form.name) };
    try { if (editingId) await updateAdminCollection(editingId, payload); else await createAdminCollection(payload); resetForm(); fetchCollections(); }
    catch (err: any) { setError(err?.response?.data?.error || "Không lưu được bộ sưu tập."); }
  };
  const edit = (collection: Collection) => {
    setEditingId(collection.collectionid || collection.collection_id || null);
    setForm({ name: collection.name || "", slug: collection.slug || "", description: collection.description || "", imglink: collection.imglink || collection.banner_url || collection.icon_url || "", sort_order: collection.sort_order ?? collection.display_order ?? 0, is_active: collection.is_active !== false });
  };
  const remove = async (id: number) => {
    if (!confirm("Ẩn bộ sưu tập này khỏi admin?")) return;
    try { await deleteAdminCollection(id); fetchCollections(); }
    catch (err: any) { setError(err?.response?.data?.error || "Không ẩn được bộ sưu tập."); }
  };

  return <AdminLayout><div className="space-y-6">
    <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div><h2 className="text-2xl font-bold text-slate-900">🧩 Quản lý bộ sưu tập</h2><p className="mt-1 text-sm text-slate-500">Nhóm sản phẩm theo chủ đề như STEM, Noel, mầm non, vận động...</p></div>
      <button onClick={fetchCollections} className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white">Tải lại</button>
    </div>
    {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Danh sách bộ sưu tập</h3>
      <div className="mt-4 space-y-3">
        {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
        {!loading && collections.length === 0 ? <p className="py-8 text-center text-slate-500">Không có bộ sưu tập nào.</p> : null}
        {collections.map((collection) => <div key={collection.collectionid} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">{collection.imglink || collection.banner_url ? <img src={collection.imglink || collection.banner_url} alt={collection.name} className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl bg-rose-50" />}<div><p className="font-bold text-slate-900">{collection.name} {!collection.is_active && <span className="text-xs text-rose-500">• Ẩn</span>}</p><p className="text-xs text-slate-500">{collection.product_count || 0} sản phẩm • slug: {collection.slug}</p></div></div>
          <div className="flex gap-2"><button onClick={() => edit(collection)} className="rounded-xl border px-3 py-1.5 text-xs font-semibold">Sửa</button><button onClick={() => remove(collection.collectionid)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Ẩn</button></div>
        </div>)}
      </div>
    </section>
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{editingId ? "Sửa bộ sưu tập" : "Thêm bộ sưu tập"}</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Tên bộ sưu tập *<input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })} /></label>
        <label className="text-xs font-semibold text-slate-600">Slug *<input className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-600">Ảnh/Icon URL<input className={inputClass} value={form.imglink} onChange={(e) => setForm({ ...form, imglink: e.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-600">Thứ tự<input type="number" className={inputClass} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></label>
        <label className="text-xs font-semibold text-slate-600 md:col-span-2">Mô tả<textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Hiển thị công khai</label>
      <div className="mt-5 flex gap-2"><button onClick={submit} className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white">{editingId ? "Cập nhật" : "Thêm"}</button>{editingId ? <button onClick={resetForm} className="rounded-2xl border px-5 py-2 text-sm font-semibold">Hủy</button> : null}</div>
    </section>
  </div></AdminLayout>;
}
export default CollectionsContent;
