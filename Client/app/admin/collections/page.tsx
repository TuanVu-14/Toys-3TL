"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useState } from "react";
import {
  getAdminCollections,
  createAdminCollection,
  deleteAdminCollection,
  updateAdminCollection,
} from "@/app/api/admin";

type Collection = {
  collectionid: number;
  name: string;
  slug: string;
  description?: string;
  banner_url?: string;
  icon_url?: string;
  sort_order?: number;
  is_active?: boolean;
  product_count?: number;
};

function CollectionsContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminCollections();
      setCollections(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách bộ sưu tập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingId) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddCollection = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Vui lòng nhập tên và slug");
      return;
    }
    setIsAdding(true);
    try {
      if (editingId) {
        await updateAdminCollection(editingId, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          banner_url: bannerUrl.trim() || undefined,
          icon_url: iconUrl.trim() || undefined,
          sort_order: sortOrder,
          is_active: isActive,
        });
        setEditingId(null);
      } else {
        await createAdminCollection({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          banner_url: bannerUrl.trim() || undefined,
          icon_url: iconUrl.trim() || undefined,
          sort_order: sortOrder,
          is_active: isActive,
        });
      }
      resetForm();
      await fetchCollections();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Không lưu được bộ sưu tập. Vui lòng thử lại.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingId(collection.collectionid);
    setName(collection.name);
    setSlug(collection.slug);
    setDescription(collection.description || "");
    setBannerUrl(collection.banner_url || "");
    setIconUrl(collection.icon_url || "");
    setSortOrder(collection.sort_order || 0);
    setIsActive(collection.is_active !== false);
  };

  const handleDeleteCollection = async (collectionID: number) => {
    if (
      !confirm(
        "Bạn có chắc muốn xóa bộ sưu tập này không? Các liên kết sản phẩm sẽ bị xóa.",
      )
    )
      return;
    try {
      await deleteAdminCollection(collectionID);
      await fetchCollections();
    } catch (err) {
      setError("Không xóa được bộ sưu tập. Vui lòng thử lại.");
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setBannerUrl("");
    setIconUrl("");
    setSortOrder(0);
    setIsActive(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    resetForm();
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                📚 Quản lý bộ sưu tập
              </h3>
              <p className="text-sm text-slate-500">
                Nhóm sản phẩm theo chủ đề (STEM, mô hình, nhà bếp...).
              </p>
            </div>
            <button
              onClick={fetchCollections}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">
              Danh sách bộ sưu tập
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Các bộ sưu tập sản phẩm hiện có.
            </p>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-center text-slate-500">Đang tải...</p>
              ) : collections.length === 0 ? (
                <p className="text-center text-slate-500">
                  Không có bộ sưu tập nào.
                </p>
              ) : (
                collections.map((collection) => (
                  <div
                    key={collection.collectionid}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-3">
                      {collection.icon_url && (
                        <img
                          src={collection.icon_url}
                          alt={collection.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {collection.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {collection.product_count || 0} sản phẩm{" "}
                          {!collection.is_active && "• Ẩn"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEditCollection(collection)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteCollection(collection.collectionid)
                        }
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">
              {editingId ? "Sửa bộ sưu tập" : "Thêm bộ sưu tập"}
            </h4>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Tên bộ sưu tập <span className="text-rose-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="VD: Đồ chơi STEM..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="stem-toys"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Icon URL
                </label>
                <input
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Banner URL
                </label>
                <input
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  rows={2}
                  placeholder="Mô tả bộ sưu tập..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Thứ tự sắp xếp
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-200"
                />
                <label
                  htmlFor="isActive"
                  className="text-xs font-medium text-slate-700"
                >
                  Hiển thị công khai
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddCollection}
                  disabled={isAdding || !name.trim() || !slug.trim()}
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isAdding ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm"}
                </button>
                {editingId && (
                  <button
                    onClick={handleCancel}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

export default CollectionsContent;
