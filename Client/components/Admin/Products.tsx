"use client";

import React, { useEffect, useState } from "react";
import { getAdminProducts, deleteAdminProduct } from "@/app/api/admin";

type AdminProduct = {
  productid: number;
  title: string;
  description?: string;
  category: string;
   price: string | number;      // ← đổi
  discount: string | number; 
  stock: number;
  stars?: number;
  isnew?: boolean;
  issale?: boolean;
  isdiscount?: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminProducts();
      setProducts(response.data?.data || []);
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

  useEffect(() => {
    fetchProducts();
  }, []);

 const salePrice = (product: AdminProduct) => {
  return Number(product.price) * (1 - Number(product.discount) / 100);
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
            <button className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
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
                   ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-green-600">
                       ${Number(salePrice(product)).toFixed(2)}
                      </p>
                      {Number(product.discount) > 0 && (
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
                  <td className="px-4 py-4 space-x-2">
                    <button className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
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
    </div>
  );
}
