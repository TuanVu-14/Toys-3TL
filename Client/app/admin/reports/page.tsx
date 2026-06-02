"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import { getAdminReports } from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import React, { useEffect, useState } from "react";

type TopProduct = { title: string; sold_quantity: number; revenue: number };
type PaymentItem = { paymentmethod: string; total: number; orders: number };
type RevenueDay = { day: string; revenue: number; orders: number };
type SeasonalTrend = {
  season_order: number;
  season_name: string;
  toy_type: string;
  sold_quantity: number;
  revenue: number;
  hot_product?: string;
};
type KeyProductAlert = {
  productid: number;
  title: string;
  brand?: string;
  stock: number;
  low_stock_threshold: number;
  sold_quantity: number;
  revenue: number;
  alert_level: string;
  key_reason: string;
};

type ReportData = {
  revenue: number;
  weeklyRevenue: number;
  completedOrders: number;
  newCustomers: number;
  conversionRate: number;
  bestSeller?: string | null;
  paymentBreakdown: PaymentItem[];
  topProducts: TopProduct[];
  revenueByDay: RevenueDay[];
  seasonalTrends: SeasonalTrend[];
  keyProductAlerts: KeyProductAlert[];
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
  seasonalTrends: [],
  keyProductAlerts: [],
};

const cardClass = "rounded-3xl border border-rose-100 bg-white p-6 shadow-sm";

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

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const lines = [
        ["Báo cáo quản trị", new Date().toLocaleDateString("vi-VN")],
        ["Tổng doanh thu", data.revenue],
        ["Doanh thu 7 ngày", data.weeklyRevenue],
        ["Đơn hoàn tất", data.completedOrders],
        ["Khách hàng mới", data.newCustomers],
        ["Sản phẩm bán chạy nhất", data.bestSeller || ""],
        [],
        ["Xu hướng đồ chơi hot theo mùa"],
        ["Mùa", "Loại đồ chơi", "Đã bán", "Doanh thu", "Sản phẩm nổi bật"],
        ...data.seasonalTrends.map((item) => [
          item.season_name,
          item.toy_type,
          item.sold_quantity,
          item.revenue,
          item.hot_product || "",
        ]),
        [],
        ["Cảnh báo mặt hàng chủ lực sắp hết"],
        ["Sản phẩm", "Thương hiệu", "Tồn", "Ngưỡng", "Đã bán", "Mức cảnh báo"],
        ...data.keyProductAlerts.map((item) => [
          item.title,
          item.brand || "",
          item.stock,
          item.low_stock_threshold,
          item.sold_quantity,
          item.alert_level,
        ]),
      ];

      const csv = lines.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao-cao-quan-tri-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-400">Báo cáo quản trị</p>
            <h1 className="text-3xl font-black text-slate-950">Phân tích doanh thu, xu hướng và tồn kho</h1>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi sản phẩm bán chạy, đồ chơi hot theo mùa và mặt hàng chủ lực sắp hết.
            </p>
          </div>
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-60"
          >
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </button>
        </div>

        {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div> : null}
        {loading ? <div className={cardClass}>Đang tải báo cáo...</div> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Tổng doanh thu" value={formatPrice(Number(data.revenue || 0))} />
          <MetricCard label="Doanh thu 7 ngày" value={formatPrice(Number(data.weeklyRevenue || 0))} />
          <MetricCard label="Đơn hoàn tất" value={data.completedOrders} />
          <MetricCard label="Khách hàng mới" value={data.newCustomers} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <TableCard title="Sản phẩm bán chạy">
            <Table
              headers={["Sản phẩm", "Đã bán", "Doanh thu"]}
              rows={data.topProducts.map((item) => [
                item.title,
                Number(item.sold_quantity || 0),
                formatPrice(Number(item.revenue || 0)),
              ])}
            />
          </TableCard>

          <TableCard title="Phương thức thanh toán">
            <Table
              headers={["Phương thức", "Số đơn", "Tổng tiền"]}
              rows={data.paymentBreakdown.map((item) => [
                item.paymentmethod,
                Number(item.orders || 0),
                formatPrice(Number(item.total || 0)),
              ])}
            />
          </TableCard>
        </div>

        <TableCard
          title="Thống kê xu hướng đồ chơi hot theo mùa"
          description="Tự động nhóm đơn hàng 365 ngày gần nhất theo mùa, loại đồ chơi và sản phẩm nổi bật."
        >
          <Table
            headers={["Mùa", "Loại đồ chơi", "Đã bán", "Doanh thu", "Sản phẩm hot"]}
            rows={data.seasonalTrends.map((item) => [
              item.season_name,
              item.toy_type,
              Number(item.sold_quantity || 0),
              formatPrice(Number(item.revenue || 0)),
              item.hot_product || "—",
            ])}
          />
        </TableCard>

        <TableCard
          title="Cảnh báo mặt hàng chủ lực sắp hết"
          description="Ưu tiên các sản phẩm bán chạy hoặc tồn kho thấp hơn ngưỡng để kịp nhập hàng."
        >
          <Table
            headers={["Sản phẩm", "Thương hiệu", "Tồn", "Ngưỡng", "Đã bán", "Mức cảnh báo", "Gợi ý"]}
            rows={data.keyProductAlerts.map((item) => [
              item.title,
              item.brand || "—",
              Number(item.stock || 0),
              Number(item.low_stock_threshold || 10),
              Number(item.sold_quantity || 0),
              <span key={`level-${item.productid}`} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                {item.alert_level}
              </span>,
              item.key_reason || "Cần nhập thêm",
            ])}
          />
        </TableCard>

        <TableCard title="Doanh thu theo ngày">
          <Table
            headers={["Ngày", "Số đơn", "Doanh thu"]}
            rows={data.revenueByDay.map((item) => [
              String(item.day).slice(0, 10),
              Number(item.orders || 0),
              formatPrice(Number(item.revenue || 0)),
            ])}
          />
        </TableCard>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cardClass}>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function TableCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className={cardClass}>
      <div className="mb-4">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-rose-400">
            {headers.map((header) => (
              <th key={header} className="py-3 pr-4 font-black">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rose-50">
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-3 pr-4 text-slate-700">{cell}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} className="py-5 text-center text-slate-400">Không có dữ liệu.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
