"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import React, { useState } from "react";

export default function ReportsPage() {
  const [exporting, setExporting] = useState(false);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      // Simulate export
      const csvContent = `Báo cáo Quản trị - ${new Date().toLocaleDateString("vi-VN")}
Doanh thu theo tuần,148.450.000đ,+18%
Sản phẩm bán chạy,Áo thun nam,+12%
Khách hàng mới,324,+22%
Tỷ lệ chuyển đổi,4.7%,-
Số lượng đơn hoàn tất,1.280,-`;

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Không thể xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const reports = [
    {
      id: 1,
      title: "Doanh thu theo tuần",
      value: "148.450.000đ",
      trend: "+18%",
    },
    { id: 2, title: "Sản phẩm bán chạy", value: "Áo thun nam", trend: "+12%" },
    { id: 3, title: "Khách hàng mới", value: "324", trend: "+22%" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Báo cáo quản trị
              </h3>
              <p className="text-sm text-slate-500">
                Tối ưu quyết định bằng các chỉ số hiệu suất quan trọng.
              </p>
            </div>
            <button
              onClick={handleExportReport}
              disabled={exporting}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {exporting ? "Đang xuất..." : "Xuất báo cáo"}
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-500">
                {report.title}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {report.value}
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                {report.trend} so với kỳ trước
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-base font-semibold text-slate-900">
            Phân tích sâu
          </h4>
          <p className="mt-2 text-sm text-slate-500">
            Xem các xu hướng thanh toán, sản phẩm và khách hàng trong thời gian
            thực.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <h5 className="text-sm font-semibold text-slate-900">
                Tỷ lệ chuyển đổi
              </h5>
              <p className="mt-3 text-2xl font-semibold text-slate-900">4.7%</p>
              <p className="mt-2 text-sm text-slate-500">
                Tăng 0.4% so với tuần trước.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <h5 className="text-sm font-semibold text-slate-900">
                Số lượng đơn hoàn tất
              </h5>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                1.280
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Đơn hàng giao thành công trong tháng.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
