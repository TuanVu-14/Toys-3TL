"use client";

import dynamic from "next/dynamic";
import AdminLayout from "@/components/Admin/AdminLayout";

const ProductsPage = dynamic(() => import("@/components/Admin/Products"), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <p className="text-gray-500">Đang tải danh sách sản phẩm...</p>
    </div>
  ),
});

export default function AdminProducts() {
  return (
    <AdminLayout>
      <ProductsPage />
    </AdminLayout>
  );
}
