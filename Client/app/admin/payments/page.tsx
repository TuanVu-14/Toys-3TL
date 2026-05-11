"use client";

import AdminLayout from "@/components/Admin/AdminLayout";

const paymentMethods = [
  { id: 1, name: "Thẻ Visa/Mastercard", status: "Đang hoạt động", icon: "💳" },
  { id: 2, name: "PayPal", status: "Đang hoạt động", icon: "🌐" },
  { id: 3, name: "COD", status: "Tắt", icon: "📦" },
];

export default function PaymentsPage() {
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
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Thêm phương thức
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-3xl">{method.icon}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${method.status === "Đang hoạt động" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                  >
                    {method.status}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">
                  {method.name}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Kiểm tra cấu hình cổng thanh toán, phí và hạn mức.
                </p>
                <button className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Chỉnh sửa
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
