"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminProducts,
  deleteAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  getAdminCategories,
} from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

type AdminProduct = {
  productid: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  discount: number;
  stock: number;
  stars?: number;
  isnew?: boolean;
  issale?: boolean;
  isdiscount?: boolean;
};

type Category = {
  categoryid: number;
  name: string;
};

type ProductFormData = {
  title: string;
  description: string;
  categoryid: number;
  price: number;
  discount: number;
  stock: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    categoryid: 0,
    price: 0,
    discount: 0,
    stock: 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);
      setProducts(productsRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
    } catch (err) {
      setError("Không lấy được sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productID: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;
    try {
      await deleteAdminProduct(productID);
      setProducts((current) =>
        current.filter((product) => product.productid !== productID),
      );
    } catch (err) {
      setError("Không xóa được sản phẩm. Vui lòng thử lại.");
    }
  };

  const handleOpenForm = (product?: AdminProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description || "",
        categoryid: 0,
        price: product.price,
        discount: product.discount,
        stock: product.stock,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        categoryid: categories[0]?.categoryid || 0,
        price: 0,
        discount: 0,
        stock: 0,
      });
    }
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.productid, formData);
      } else {
        await createAdminProduct(formData);
      }
      await fetchProducts();
      setShowForm(false);
    } catch (err) {
      setError("Không lưu được sản phẩm. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const salePrice = (product: AdminProduct) => {
    return product.price * (1 - product.discount / 100);
  };

  const stockColor = (stock: number) => {
    if (stock > 50) return "bg-green-100 text-green-700";
    if (stock > 10) return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Danh mục sản phẩm
            </h3>
            <p className="text-sm text-slate-600">
              Quản lý kho, giá cả và thông tin sản phẩm LEGO.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchProducts}
              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Tải lại
            </button>
            <button
              onClick={() => handleOpenForm()}
              className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Thêm sản phẩm
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-rose-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Sản phẩm</th>
              <th className="px-4 py-3 font-semibold">Danh mục</th>
              <th className="px-4 py-3 font-semibold">Giá gốc</th>
              <th className="px-4 py-3 font-semibold">Giá sau giảm</th>
              <th className="px-4 py-3 font-semibold">Kho hàng</th>
              <th className="px-4 py-3 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  Đang tải...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.productid} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {product.title}
                      </p>
                      {product.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-green-600">
                        {formatPrice(salePrice(product))}
                      </p>
                      {product.discount > 0 && (
                        <p className="text-xs text-rose-600">
                          -{product.discount}%
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${stockColor(
                        product.stock,
                      )}`}
                    >
                      {product.stock} sản phẩm
                    </span>
                  </td>
                  <td className="px-4 py-4 space-x-2 flex">
                    <button
                      onClick={() => handleOpenForm(product)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product.productid)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg max-h-96 overflow-y-auto">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900">
              {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Danh mục
                </label>
                <select
                  required
                  value={formData.categoryid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryid: Number(e.target.value),
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                >
                  <option value={0}>Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryid} value={cat.categoryid}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Giá
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: Number(e.target.value),
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Số lượng trong kho
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-600"
                >
                  {editingProduct ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
