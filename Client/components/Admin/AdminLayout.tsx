"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/hooks";
import useAuth from "@/controllers/Authentication";
import NotificationBell from "@/components/Notifications/NotificationBell";

type MenuItem = { label: string; href: string; roles: string[]; group: "common" | "sales" | "warehouse" | "system" };

const sidebarItems: MenuItem[] = [
  { label: "Tổng quan", href: "/admin", roles: ["admin", "sales_staff", "warehouse_manager"], group: "common" },
  { label: "Quản lý bán hàng", href: "/admin/sales", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Quản lý kho", href: "/admin/warehouse", roles: ["admin", "warehouse_manager"], group: "warehouse" },
  { label: "Đơn hàng", href: "/admin/orders", roles: ["admin", "sales_staff", "warehouse_manager"], group: "sales" },
  { label: "Sản phẩm", href: "/admin/products", roles: ["admin"], group: "system" },
  { label: "Người dùng", href: "/admin/users", roles: ["admin"], group: "system" },
  { label: "Danh mục", href: "/admin/categories", roles: ["admin"], group: "system" },
  { label: "Thương hiệu", href: "/admin/brands", roles: ["admin"], group: "system" },
  { label: "Bộ sưu tập", href: "/admin/collections", roles: ["admin"], group: "system" },
  { label: "Đánh giá", href: "/admin/reviews", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Vận chuyển", href: "/admin/shipping", roles: ["admin", "warehouse_manager"], group: "warehouse" },
  { label: "Thanh toán", href: "/admin/payments", roles: ["admin"], group: "system" },
  { label: "Nội dung", href: "/admin/content", roles: ["admin"], group: "system" },
  { label: "Báo cáo", href: "/admin/reports", roles: ["admin"], group: "system" },
  { label: "Cài đặt", href: "/admin/settings", roles: ["admin"], group: "system" },
];

const roleNames: Record<string, string> = {
  admin: "Quản trị hệ thống",
  sales_staff: "Nhân viên bán hàng",
  warehouse_manager: "Quản trị kho",
  customer: "Khách hàng",
};

const fallbackByRole: Record<string, string> = {
  admin: "/admin",
  sales_staff: "/admin/sales",
  warehouse_manager: "/admin/warehouse",
};

function roleInitial(role: string) {
  if (role === "sales_staff") return "S";
  if (role === "warehouse_manager") return "W";
  return "A";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { checkSession, logout } = useAuth();
  const roleFromStore = useAppSelector((state) => state.userState.defaultAccount.role);
  const [role, setRole] = useState(roleFromStore || "");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const verifyBackOffice = async () => {
      const allowedRoles = ["admin", "sales_staff", "warehouse_manager"];
      if (allowedRoles.includes(roleFromStore)) {
        setRole(roleFromStore);
        setLoading(false);
        return;
      }

      const session = await checkSession();
      const sessionRole = session?.data?.role || "";
      if (!session?.success || !allowedRoles.includes(sessionRole)) {
        router.replace("/");
        return;
      }
      setRole(sessionRole);
      setLoading(false);
    };

    if (mounted) verifyBackOffice();
  }, [checkSession, mounted, roleFromStore, router]);

  const menu = useMemo(() => sidebarItems.filter((item) => item.roles.includes(role)), [role]);

  useEffect(() => {
    if (!mounted) return;
    const saved = Number(window.sessionStorage.getItem("adminSidebarScroll") || 0);
    if (sidebarScrollRef.current) sidebarScrollRef.current.scrollTop = saved;
  }, [mounted, pathname]);

  const rememberSidebarScroll = () => {
    if (sidebarScrollRef.current) {
      window.sessionStorage.setItem("adminSidebarScroll", String(sidebarScrollRef.current.scrollTop));
    }
  };

  useEffect(() => {
    if (loading || !role) return;
    const currentItem = sidebarItems.find((item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)));
    if (currentItem && !currentItem.roles.includes(role)) router.replace(fallbackByRole[role] || "/admin");
  }, [loading, pathname, role, router]);

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500" />
          <h1 className="text-lg font-bold text-slate-900">Đang kiểm tra quyền truy cập</h1>
          <p className="mt-1 text-sm">Vui lòng đợi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-rose-100 bg-white shadow-sm lg:flex">
        <div ref={sidebarScrollRef} onScroll={rememberSidebarScroll} className="flex-1 overflow-y-auto p-5 pb-2">
        <Link href="/admin" className="flex items-center gap-3 rounded-3xl bg-rose-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 font-black text-white">3TL</div>
          <div>
            <h2 className="font-bold text-slate-900">3TL-Store</h2>
            <p className="text-xs text-slate-500">{roleNames[role] || "Quản trị"}</p>
          </div>
        </Link>

        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Menu theo phân quyền</div>
        <nav className="mt-3 space-y-1">
          {menu.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-rose-500 text-white shadow-sm" : "text-slate-600 hover:bg-rose-50 hover:text-rose-600"}`}>
                <span>{item.label}</span>
                {active ? <span>›</span> : null}
              </Link>
            );
          })}
        </nav>

        {role !== "admin" ? <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs text-amber-700">Bạn chỉ thấy các chức năng được cấp quyền.</div> : null}
        </div>

        <div className="border-t border-slate-100 p-5 space-y-2 shrink-0">
          <button onClick={logout} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">↪ Đăng xuất</button>
          <Link href="/" className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">⌂ Về trang chính</Link>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-rose-100 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Bảng quản trị › {roleNames[role]}</p>
              <h1 className="text-xl font-bold text-slate-900">{sidebarItems.find((item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)))?.label || "Tổng quan"}</h1>
            </div>
            <div className="flex items-center gap-3"><NotificationBell /><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 font-bold text-white">{roleInitial(role)}</div></div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {menu.map((item) => <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-semibold ${pathname === item.href ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"}`}>{item.label}</Link>)}
          </div>
        </header>
        <section className="p-4 lg:p-8">{children}</section>
      </main>
    </div>
  );
}
