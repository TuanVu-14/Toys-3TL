"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useEffect, useState } from "react";
import {
  getAdminPayments,
  createAdminPayment,
  updateAdminPayment,
  deleteAdminPayment,
} from "@/app/api/admin";

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  status: boolean;
  config?: any;
  created_at: string;
};

export default function PaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("card");
  const [saving, setSaving] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminPayments();
      setMethods(response.data?.data || []);
    } catch (err) {
      setError(
        "Không lấy được danh sách phương thức thanh toán. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMethod = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateAdminPayment(editingId, { name: name.trim(), type });
      } else {
        await createAdminPayment({ name: name.trim(), type });
      }
      setName("");
      setType("card");
      setShowForm(false);
      setEditingId(null);
      await fetchPayments();
    } catch (err) {
      setError("Không lưu được phương thức thanh toán. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingId(method.id);
    setName(method.name);
    setType(method.type);
    setShowForm(true);
  };

  const handleDeleteMethod = async (methodId: number) => {
    if (!confirm("Bạn có chắc muốn xóa phương thức thanh toán này không?"))
      return;
    try {
      await deleteAdminPayment(methodId);
      await fetchPayments();
    } catch (err) {
      setError("Không xóa được phương thức thanh toán. Vui lòng thử lại.");
    }
  };

  const handleOpenForm = (method?: PaymentMethod) => {
    if (method) {
      handleEditMethod(method);
    } else {
      setEditingId(null);
      setName("");
      setType("card");
      setShowForm(true);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Cấu hình phương thức thanh toán
              </h3>
              <p className="text-sm text-slate-500">
                Giữ các phương thức thanh toán quan trọng luôn hoạt động ổn
                định.
              </p>
            </div>
            <button
              onClick={() => handleOpenForm()}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Thêm phương thức
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-3 text-center text-slate-500">
                Đang tải...
              </p>
            ) : methods.length === 0 ? (
              <p className="col-span-3 text-center text-slate-500">
                Không có phương thức thanh toán nào.
              </p>
            ) : (
              methods.map((method) => (
                <div
                  key={method.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {method.name}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Loại: {method.type}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        method.status
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {method.status ? "Đang hoạt động" : "Tắt"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Kiểm tra cấu hình cổng thanh toán, phí và hạn mức.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEditMethod(method)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
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
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="mb-6 text-2xl font-semibold text-slate-900">
                {editingId
                  ? "Chỉnh sửa phương thức thanh toán"
                  : "Thêm phương thức thanh toán mới"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Tên phương thức
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                    placeholder="VD: Thẻ Visa/Mastercard"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Loại phương thức
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-900"
                  >
                    <option value="card">Thẻ ngân hàng</option>
                    <option value="digital_wallet">Ví điện tử</option>
                    <option value="cod">Thanh toán khi nhận</option>
                    <option value="bank_transfer">
                      Chuyển khoản ngân hàng
                    </option>
                  </select>
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
                    onClick={handleSaveMethod}
                    disabled={saving || !name.trim()}
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
