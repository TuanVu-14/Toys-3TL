"use client";

import AdminLayout from "@/components/Admin/AdminLayout";

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Cài đặt hệ thống
              </h3>
              <p className="text-sm text-slate-600">
                Điều chỉnh quyền truy cập, bảo mật và cấu hình chung của trang
                quản trị.
              </p>
            </div>
            <button className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
              Lưu thay đổi
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">
              Bảo mật & quyền
            </h4>
            <div className="mt-5 space-y-4">
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-rose-300 text-rose-500"
                    defaultChecked
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Yêu cầu mật khẩu mạnh
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Bắt buộc người dùng tạo mật khẩu với ký tự đặc biệt
                    </p>
                  </div>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-rose-300 text-rose-500"
                    defaultChecked
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Giới hạn đăng nhập thất bại
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Tự động khóa tài khoản sau 5 lần thử đăng nhập sai
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">
              Thiết lập cửa hàng
            </h4>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Ngôn ngữ mặc định
                </p>
                <select className="mt-2 w-full rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-500">
                  <option>Tiếng Việt</option>
                  <option>English</option>
                  <option>中文</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Múi giờ</p>
                <select className="mt-2 w-full rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-500">
                  <option>Asia/Ho_Chi_Minh (UTC+7)</option>
                  <option>Asia/Bangkok (UTC+7)</option>
                  <option>Asia/Shanghai (UTC+8)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">
              Thông báo & Email
            </h4>
            <div className="mt-5 space-y-4">
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-rose-300 text-rose-500"
                    defaultChecked
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Email thông báo đơn hàng
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Gửi email khi có đơn hàng mới
                    </p>
                  </div>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-rose-300 text-rose-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Email báo cáo hàng ngày
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Nhận báo cáo tóm tắt hàng ngày
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">
              Công cụ & Phát triển
            </h4>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                Khóa lại API
              </button>
              <button className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                Xem logs
              </button>
              <button className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                Xuất dữ liệu
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
