"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useState } from "react";
import {
  getAdminBrands,
  createAdminBrand,
  deleteAdminBrand,
  updateAdminBrand,
} from "@/app/api/admin";

type Brand = {
  brandid: number;
  name: string;
  description?: string;
  logo_url?: string;
  manufacturer_info?: string;
  certification_details?: string;
  product_count?: number;
};

function BrandsContent() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturerInfo, setManufacturerInfo] = useState("");
  const [certifications, setCertifications] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminBrands();
      setBrands(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách thương hiệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên thương hiệu");
      return;
    }
    setIsAdding(true);
    try {
      if (editingId) {
        await updateAdminBrand(editingId, {
          name: name.trim(),
          description: description.trim() || undefined,
          manufacturer_info: manufacturerInfo.trim() || undefined,
          certification_details: certifications.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
        });
        setEditingId(null);
      } else {
        await createAdminBrand({
          name: name.trim(),
          description: description.trim() || undefined,
          manufacturer_info: manufacturerInfo.trim() || undefined,
          certification_details: certifications.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
        });
      }
      resetForm();
      await fetchBrands();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Không lưu được thương hiệu. Vui lòng thử lại.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingId(brand.brandid);
    setName(brand.name);
    setDescription(brand.description || "");
    setManufacturerInfo(brand.manufacturer_info || "");
    setCertifications(brand.certification_details || "");
    setLogoUrl(brand.logo_url || "");
  };

  const handleDeleteBrand = async (brandID: number) => {
    if (!confirm("Bạn có chắc muốn xóa thương hiệu này không?")) return;
    try {
      await deleteAdminBrand(brandID);
      await fetchBrands();
    } catch (err) {
      setError("Không xóa được thương hiệu. Vui lòng thử lại.");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setManufacturerInfo("");
    setCertifications("");
    setLogoUrl("");
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    resetForm();
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                🏭 Quản lý thương hiệu
              </h3>
              <p className="text-sm text-slate-500">
                Quản lý nhà sản xuất, thông tin chứng chỉ an toàn và logo thương
                hiệu.
              </p>
            </div>
            <button
              onClick={fetchBrands}
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
              Danh sách thương hiệu
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Hiển thị các nhà sản xuất hiện có.
            </p>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-center text-slate-500">Đang tải...</p>
              ) : brands.length === 0 ? (
                <p className="text-center text-slate-500">
                  Không có thương hiệu nào.
                </p>
              ) : (
                brands.map((brand) => (
                  <div
                    key={brand.brandid}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-3">
                      {brand.logo_url && (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {brand.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {brand.product_count || 0} sản phẩm
                          {brand.certification_details &&
                            ` • ${brand.certification_details}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEditBrand(brand)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand.brandid)}
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
              {editingId ? "Sửa thương hiệu" : "Thêm thương hiệu"}
            </h4>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Tên thương hiệu <span className="text-rose-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="VD: LEGO, Hasbro..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Logo URL
                </label>
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Mô tả ngắn
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  rows={2}
                  placeholder="Mô tả về thương hiệu..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Thông tin nhà sản xuất
                </label>
                <textarea
                  value={manufacturerInfo}
                  onChange={(e) => setManufacturerInfo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  rows={2}
                  placeholder="Địa chỉ, liên hệ nhà sản xuất..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Chứng chỉ an toàn
                </label>
                <input
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="VD: CE, ASTM, ISO 8124"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddBrand}
                  disabled={isAdding || !name.trim()}
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

export default BrandsContent;
