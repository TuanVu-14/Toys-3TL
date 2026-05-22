"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useMemo, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
} from "@/app/api/admin";

type Category = {
  categoryid: number;
  name: string;
  parentcategoryid: number | null;
  products: number;
};

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parent, setParent] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminCategories();
      setCategories(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách danh mục. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!name.trim()) return;
    setIsAdding(true);
    try {
      if (editingId) {
        await updateAdminCategory(editingId, {
          name: name.trim(),
          parentcategoryid: parent || undefined,
        });
        setEditingId(null);
      } else {
        await createAdminCategory({
          name: name.trim(),
          parentcategoryid: parent || undefined,
        });
      }
      setName("");
      setParent(null);
      await fetchCategories();
    } catch (err) {
      setError("Không lưu được danh mục. Vui lòng thử lại.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingId(category.categoryid);
    setName(category.name);
    setParent(category.parentcategoryid);
  };

  const handleDeleteCategory = async (categoryID: number) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này không?")) return;
    try {
      await deleteAdminCategory(categoryID);
      await fetchCategories();
    } catch (err) {
      setError("Không xóa được danh mục. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(kw));
  }, [categories, search]);

  const parentCategories = categories.filter((cat) => !cat.parentcategoryid);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Quản lý danh mục
            </h3>
            <p className="text-sm text-slate-500">
              Thêm, sửa và quản lý cấu trúc danh mục cha/con cho cửa hàng.
            </p>
          </div>
<div className="flex gap-2 flex-wrap">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên danh mục..." className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-400" />
            <button onClick={fetchCategories} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Tải lại</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">
            Danh sách danh mục
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Xem nhanh số lượng sản phẩm trong mỗi danh mục.
          </p>
          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-center text-slate-500">Đang tải...</p>
            ) : categories.length === 0 ? (
              <p className="text-center text-slate-500">
                Không có danh mục nào.
              </p>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.categoryid}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {category.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {category.parentcategoryid
                        ? "Danh mục con"
                        : "Danh mục cha"}{" "}
                      • {category.products} sản phẩm
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.categoryid)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
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
            Tạo danh mục mới
          </h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tên danh mục
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                placeholder="Nhập tên danh mục"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Danh mục cha
              </label>
              <select
                value={parent ?? ""}
                onChange={(event) =>
                  setParent(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              >
                <option value="">Không có</option>
                {parentCategories.map((cat) => (
                  <option key={cat.categoryid} value={cat.categoryid}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={isAdding || !name.trim()}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isAdding
                ? editingId
                  ? "Đang cập nhật..."
                  : "Đang thêm..."
                : editingId
                  ? "Cập nhật danh mục"
                  : "Thêm danh mục"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setParent(null);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  return (
    <AdminLayout>
      <CategoriesContent />
    </AdminLayout>
  );
}
