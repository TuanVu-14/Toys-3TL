"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useState } from "react";
import {
  getAdminShipping,
  createAdminShipping,
  updateAdminShipping,
  deleteAdminShipping,
} from "@/app/api/admin";

type ShippingZone = {
  id: number;
  zone_name: string;
  delivery_time: string;
  shipping_cost: number;
  status: boolean;
  created_at: string;
};

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchShipping = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminShipping();
      setZones(response.data?.data || []);
    } catch (err) {
      setError("Không lấy được danh sách vận chuyển. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim() || !deliveryTime.trim() || !shippingCost.trim())
      return;
    setSaving(true);
    try {
      const data = {
        zone_name: zoneName.trim(),
        delivery_time: deliveryTime.trim(),
        shipping_cost: parseFloat(shippingCost),
      };
      if (editingId) {
        await updateAdminShipping(editingId, data);
      } else {
        await createAdminShipping(data);
      }
      setZoneName("");
      setDeliveryTime("");
      setShippingCost("");
      setShowForm(false);
      setEditingId(null);
      await fetchShipping();
    } catch (err) {
      setError("Không lưu được vùng vận chuyển. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditZone = (zone: ShippingZone) => {
    setEditingId(zone.id);
    setZoneName(zone.zone_name);
    setDeliveryTime(zone.delivery_time);
    setShippingCost(zone.shipping_cost.toString());
    setShowForm(true);
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm("Bạn có chắc muốn xóa vùng vận chuyển này không?")) return;
    try {
      await deleteAdminShipping(zoneId);
      await fetchShipping();
    } catch (err) {
      setError("Không xóa được vùng vận chuyển. Vui lòng thử lại.");
    }
  };

  const handleOpenForm = (zone?: ShippingZone) => {
    if (zone) {
      handleEditZone(zone);
    } else {
      setEditingId(null);
      setZoneName("");
      setDeliveryTime("");
      setShippingCost("");
      setShowForm(true);
    }
  };

  useEffect(() => {
    fetchShipping();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Vận chuyển
              </h3>
              <p className="text-sm text-slate-500">
                Thiết lập phí và vùng vận chuyển phù hợp với chiến lược giao
                hàng.
              </p>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Thêm vùng mới
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">Phí giao hàng</th>
                  <th className="px-4 py-3">Thời gian giao</th>
                  <th className="px-4 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : zones.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Không có vùng vận chuyển nào.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="px-4 py-4 text-slate-900">
                        {zone.zone_name}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {zone.shipping_cost.toLocaleString()}đ
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {zone.delivery_time}
                      </td>
                      <td className="px-4 py-4 space-x-2 flex">
                        <button
                          onClick={() => handleEditZone(zone)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
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
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="mb-6 text-2xl font-semibold text-slate-900">
                {editingId
                  ? "Chỉnh sửa vùng vận chuyển"
                  : "Thêm vùng vận chuyển mới"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Tên vùng
                  </label>
                  <input
                    type="text"
                    required
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="VD: Hồ Chí Minh"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Thời gian giao
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="VD: 2-3 ngày"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Phí vận chuyển (VNĐ)
                  </label>
                  <input
                    type="number"
                    required
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="VD: 25000"
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
                    onClick={handleSaveZone}
                    disabled={
                      saving ||
                      !zoneName.trim() ||
                      !deliveryTime.trim() ||
                      !shippingCost.trim()
                    }
                    className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm"}
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
