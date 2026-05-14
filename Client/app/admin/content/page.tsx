"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useState } from "react";
import {
  getAdminContent,
  createAdminContent,
  updateAdminContent,
  deleteAdminContent,
} from "@/app/api/admin";

type ContentItem = {
  id: number;
  title: string;
  type: string;
  location: string;
  status: boolean;
  created_at: string;
};

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("banner");
  const [location, setLocation] = useState("");
  const [contentData, setContentData] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminContent();
      setItems(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách nội dung. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!title.trim() || !location.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        type,
        location: location.trim(),
        content_data: contentData || null,
      };
      if (editingId) {
        await updateAdminContent(editingId, { ...data, status: true });
      } else {
        await createAdminContent(data);
      }
      setTitle("");
      setType("banner");
      setLocation("");
      setContentData("");
      setShowForm(false);
      setEditingId(null);
      await fetchContent();
    } catch (err) {
      setError("Không lưu được nội dung. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditContent = (item: ContentItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setType(item.type);
    setLocation(item.location);
    setShowForm(true);
  };

  const handleDeleteContent = async (itemId: number) => {
    if (!confirm("Bạn có chắc muốn xóa nội dung này không?")) return;
    try {
      await deleteAdminContent(itemId);
      await fetchContent();
    } catch (err) {
      setError("Không xóa được nội dung. Vui lòng thử lại.");
    }
  };

  const handleOpenForm = (item?: ContentItem) => {
    if (item) {
      handleEditContent(item);
    } else {
      setEditingId(null);
      setTitle("");
      setType("banner");
      setLocation("");
      setContentData("");
      setShowForm(true);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Nội dung website
              </h3>
              <p className="text-sm text-slate-500">
                Quản lý banner, nội dung trang chủ và nội dung bài viết hiển
                thị.
              </p>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tạo nội dung mới
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            {loading ? (
              <p className="text-center text-slate-500">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-slate-500">
                Không có nội dung nào.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:flex sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Loại: {item.type}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Vị trí: {item.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status ? "Đang hiển thị" : "Ẩn"}
                    </span>
                    <button
                      onClick={() => handleEditContent(item)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h2 className="mb-6 text-2xl font-semibold text-slate-900">
                {editingId ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="VD: Banner mùa hè"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Loại nội dung
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                  >
                    <option value="banner">Banner</option>
                    <option value="blog">Blog</option>
                    <option value="popup">Popup</option>
                    <option value="section">Phần nội dung</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Vị trí hiển thị
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="VD: Trang chủ, Blog, Toàn site"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Nội dung
                  </label>
                  <textarea
                    value={contentData}
                    onChange={(e) => setContentData(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="Nhập nội dung..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    disabled={saving || !title.trim() || !location.trim()}
                    className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
