"use client";

import AdminLayout from "@/components/Admin/AdminLayout";

const widgets = [
  {
    id: 1,
    title: "Banner mùa hè",
    type: "Banner",
    audience: "Trang chủ",
    status: "Đang hiển thị",
  },
  {
    id: 2,
    title: "Bài blog mới",
    type: "Blog",
    audience: "Blog",
    status: "Chờ duyệt",
  },
  {
    id: 3,
    title: "Popup sự kiện",
    type: "Popup",
    audience: "Toàn site",
    status: "Đang hiển thị",
  },
];

export default function ContentPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Nội dung website
              </h3>
              <p className="text-sm text-slate-500">
                Quản lý banner, nội dung trang chủ và nội dung bài viết hiển
                thị.
              </p>
            </div>
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Tạo nội dung mới
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:flex sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {widget.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Loại: {widget.type}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Vị trí: {widget.audience}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {widget.status}
                  </span>
                  <button className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
