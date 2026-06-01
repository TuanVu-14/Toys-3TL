"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import { getAdminReports } from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import React, { useEffect, useState } from "react";

type ReportData = {
  revenue: number;
  weeklyRevenue: number;
  completedOrders: number;
  newCustomers: number;
  conversionRate: number;
  bestSeller?: string;
  paymentBreakdown: { paymentmethod: string; total: number; orders: number }[];
  topProducts: { title: string; sold_quantity: number; revenue: number }[];
  revenueByDay: { day: string; revenue: number; orders: number }[];
};

const emptyReport: ReportData = {
  revenue: 0,
  weeklyRevenue: 0,
  completedOrders: 0,
  newCustomers: 0,
  conversionRate: 0,
  paymentBreakdown: [],
  topProducts: [],
  revenueByDay: [],
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminReports();
      setData({ ...emptyReport, ...(response.data?.data || {}) });
    } catch {
      setError("Không tải được báo cáo. Kiểm tra API /api/admin/reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const lines = [
        [`Báo cáo quản trị`, new Date().toLocaleDateString("vi-VN")],
        ["Tổng doanh thu", data.revenue],
        ["Doanh thu 7 ngày", data.weeklyRevenue],
        ["Đơn hoàn tất", data.completedOrders],
        ["Khách hàng mới", data.newCustomers],
        ["Sản phẩm bán chạy", data.bestSeller || "—"],
        [],
        ["Top sản phẩm", "Đã bán", "Doanh thu"],
        ...data.topProducts.map((p) => [p.title, p.sold_quantity, p.revenue]),
      ];
      const csvContent = lines.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admin-report-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Không thể xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const reports = [
    { id: 1, title: "Tổng doanh thu", value: formatPrice(Number(data.revenue || 0)), note: "Tính từ các đơn đã hoàn tất/giao thành công" },
    { id: 2, title: "Doanh thu 7 ngày", value: formatPrice(Number(data.weeklyRevenue || 0)), note: "Dữ liệu trong 7 ngày gần nhất" },
    { id: 3, title: "Sản phẩm bán chạy", value: data.bestSeller || "—", note: "Theo số lượng bán trong orderitems" },
    { id: 4, title: "Khách hàng mới", value: String(data.newCustomers || 0), note: "Tài khoản tạo trong 30 ngày" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Báo cáo quản trị</h3>
            <p className="text-sm text-slate-500">Dữ liệu lấy trực tiếp từ orders, orderitems, products, users và payments.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadReports} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">Tải lại</button>
            <button onClick={handleExportReport} disabled={exporting} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{exporting ? "Đang xuất..." : "Xuất báo cáo"}</button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
        {loading ? <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">Đang tải báo cáo...</div> : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {reports.map((report) => (
            <div key={report.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-500">{report.title}</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{report.value}</p>
              <p className="mt-3 text-sm text-slate-500">{report.note}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportTable title="Top sản phẩm bán chạy" headers={["Sản phẩm", "Đã bán", "Doanh thu"]} rows={data.topProducts.map((p) => [p.title, p.sold_quantity, formatPrice(Number(p.revenue || 0))])} />
          <ReportTable title="Phương thức thanh toán" headers={["Phương thức", "Số đơn", "Tổng tiền"]} rows={data.paymentBreakdown.map((p) => [p.paymentmethod || "Không rõ", p.orders, formatPrice(Number(p.total || 0))])} />
        </div>

        <ReportTable title="Doanh thu theo ngày" headers={["Ngày", "Số đơn", "Doanh thu"]} rows={data.revenueByDay.map((d) => [new Date(d.day).toLocaleDateString("vi-VN"), d.orders, formatPrice(Number(d.revenue || 0))])} />
      </div>
    </AdminLayout>
  );
}

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h4 className="text-lg font-black text-slate-900">{title}</h4>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">{headers.map((header) => <th key={header} className="py-3 pr-4">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i} className="py-3 pr-4">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="py-6 text-center text-slate-400">Không có dữ liệu.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
