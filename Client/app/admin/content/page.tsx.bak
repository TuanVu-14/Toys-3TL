
"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useRef, useState } from "react";
import { createAdminContent, deleteAdminContent, getAdminContent, updateAdminContent } from "@/app/api/admin";

type BannerItem = {
  id: number;
  bannerid: number;
  title: string;
  toptitle: string;
  middletitle: string;
  bottomtitle: string;
  subtitle?: string | null;
  description?: string | null;
  imglink: string;
  startprice: number;
  buttontitle: string;
  redirect_link: string;
  status: boolean;
  sort_order: number;
};

type FormData = {
  toptitle: string;
  middletitle: string;
  bottomtitle: string;
  subtitle: string;
  description: string;
  imglink: string;
  startprice: number;
  buttontitle: string;
  redirect_link: string;
  status: boolean;
  sort_order: number;
};

const emptyForm: FormData = {
  toptitle: "Ưu đãi đồ chơi",
  middletitle: "Banner trang chủ",
  bottomtitle: "Đồ chơi an toàn cho bé",
  subtitle: "",
  description: "",
  imglink: "",
  startprice: 0,
  buttontitle: "Mua ngay",
  redirect_link: "/",
  status: true,
  sort_order: 0,
};

const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-500";

export default function ContentPage() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchContent() {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminContent();
      setItems(response.data?.data || []);
    } catch {
      setError("Không lấy được danh sách banner. Kiểm tra server và file SQL bổ sung.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchContent(); }, []);

  function openForm(item?: BannerItem) {
    if (item) {
      setEditingId(item.bannerid || item.id);
      const data = {
        toptitle: item.toptitle || "Ưu đãi đồ chơi",
        middletitle: item.middletitle || item.title || "Banner trang chủ",
        bottomtitle: item.bottomtitle || "Đồ chơi an toàn cho bé",
        subtitle: item.subtitle || "",
        description: item.description || "",
        imglink: item.imglink || "",
        startprice: Number(item.startprice || 0),
        buttontitle: item.buttontitle || "Mua ngay",
        redirect_link: item.redirect_link || "/",
        status: item.status !== false,
        sort_order: Number(item.sort_order || 0),
      };
      setFormData(data);
      setPreview(data.imglink);
    } else {
      setEditingId(null);
      setFormData(emptyForm);
      setPreview("");
    }
    setShowForm(true);
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh banner.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      setFormData((prev) => ({ ...prev, imglink: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveContent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.middletitle.trim() || !formData.imglink.trim()) {
      setError("Banner cần có tiêu đề chính và ảnh.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { title: formData.middletitle, type: "banner", location: "home_top", ...formData };
      if (editingId) await updateAdminContent(editingId, payload);
      else await createAdminContent(payload);
      setShowForm(false);
      setEditingId(null);
      await fetchContent();
    } catch {
      setError("Không lưu được banner. Kiểm tra dữ liệu và database.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContent(itemId: number) {
    if (!confirm("Ẩn banner này khỏi trang chủ?")) return;
    try {
      await deleteAdminContent(itemId);
      await fetchContent();
    } catch {
      setError("Không ẩn được banner.");
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-500">Quản lý giao diện trang chủ</p>
              <h3 className="text-2xl font-bold text-slate-900">Banner khách hàng</h3>
              <p className="text-sm text-slate-500">Thêm, sửa, ẩn banner; banner ngoài trang chủ sẽ tự chạy sau 3 giây.</p>
            </div>
            <button onClick={() => openForm()} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Tạo banner mới</button>
          </div>
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            {loading ? <p className="text-center text-slate-500">Đang tải...</p> : items.length === 0 ? <p className="text-center text-slate-500">Chưa có banner.</p> : items.map((item) => (
              <div key={item.id} className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-center">
                <img src={item.imglink || "/images/no-image.png"} alt={item.middletitle} className="h-32 w-full rounded-2xl object-cover lg:w-[220px]" />
                <div>
                  <p className="text-base font-bold text-slate-900">{item.middletitle || item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.toptitle} • {item.bottomtitle}</p>
                  <p className="mt-1 text-sm text-slate-500">Link: {item.redirect_link || "/"}</p>
                  <p className="mt-1 text-sm text-slate-500">Thứ tự: {item.sort_order || 0}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{item.status ? "Đang hiển thị" : "Đang ẩn"}</span>
                  <button onClick={() => openForm(item)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Chỉnh sửa</button>
                  <button onClick={() => handleDeleteContent(item.bannerid || item.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Ẩn</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {showForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={handleSaveContent} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">{editingId ? "Chỉnh sửa banner" : "Tạo banner mới"}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100">✕</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Tiêu đề nhỏ<input value={formData.toptitle} onChange={(e) => setFormData({ ...formData, toptitle: e.target.value })} className={inputClass} /></label>
                <label className="text-sm font-semibold text-slate-700">Tiêu đề chính<input required value={formData.middletitle} onChange={(e) => setFormData({ ...formData, middletitle: e.target.value })} className={inputClass} /></label>
                <label className="text-sm font-semibold text-slate-700">Dòng mô tả ngắn<input value={formData.bottomtitle} onChange={(e) => setFormData({ ...formData, bottomtitle: e.target.value })} className={inputClass} /></label>
                <label className="text-sm font-semibold text-slate-700">Nút bấm<input value={formData.buttontitle} onChange={(e) => setFormData({ ...formData, buttontitle: e.target.value })} className={inputClass} /></label>
                <label className="text-sm font-semibold text-slate-700">Link khi bấm banner<input value={formData.redirect_link} onChange={(e) => setFormData({ ...formData, redirect_link: e.target.value })} className={inputClass} placeholder="/categories/lego hoặc /product/1" /></label>
                <label className="text-sm font-semibold text-slate-700">Giá bắt đầu<input type="number" min={0} value={formData.startprice} onChange={(e) => setFormData({ ...formData, startprice: Number(e.target.value) })} className={inputClass} /></label>
                <label className="text-sm font-semibold text-slate-700">Thứ tự hiển thị<input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} className={inputClass} /></label>
                <label className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.checked })} /> Đang hiển thị</label>
                <label className="text-sm font-semibold text-slate-700 md:col-span-2">Mô tả chi tiết<textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} rows={3} /></label>

                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-slate-700">Ảnh banner</p>
                  <div className="mt-2 grid gap-4 lg:grid-cols-[280px_1fr]">
                    {preview ? <img src={preview} alt="Xem trước banner" className="h-40 w-full rounded-2xl border object-cover" /> : <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-sm text-slate-400">Chưa có ảnh</div>}
                    <div className="space-y-3">
                      <input value={formData.imglink} onChange={(e) => { setFormData({ ...formData, imglink: e.target.value }); setPreview(e.target.value); }} className={inputClass} placeholder="Dán URL ảnh hoặc chọn file bên dưới" />
                      <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 px-4 py-5 text-center text-sm font-semibold text-rose-500 hover:bg-rose-100">📷 Chọn ảnh từ máy tính<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} /></label>
                      <p className="text-xs text-slate-500">Nếu dùng file ảnh trực tiếp, hãy chạy SQL bổ sung để cột ảnh là kiểu TEXT.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo"}</button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
