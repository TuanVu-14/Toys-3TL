"use client";

import AdminLayout from "@/components/Admin/AdminLayout";

const zones = [
  { id: 1, name: "Hồ Chí Minh", rate: "25.000đ", delivery: "2-3 ngày" },
  { id: 2, name: "Hà Nội", rate: "30.000đ", delivery: "3-4 ngày" },
  { id: 3, name: "Toàn quốc", rate: "45.000đ", delivery: "4-6 ngày" },
];

export default function ShippingPage() {
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
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Thêm vùng mới
            </button>
          </div>
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
                {zones.map((zone) => (
                  <tr key={zone.id}>
                    <td className="px-4 py-4 text-slate-900">{zone.name}</td>
                    <td className="px-4 py-4 text-slate-700">{zone.rate}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {zone.delivery}
                    </td>
                    <td className="px-4 py-4">
                      <button className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
