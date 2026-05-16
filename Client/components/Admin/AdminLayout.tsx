"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/hooks";
import useAuth from "@/controllers/Authentication";

type MenuItem = { label: string; href: string; roles: string[]; group: "common" | "sales" | "warehouse" | "system" };

const sidebarItems: MenuItem[] = [
  { label: "Dashboard", href: "/admin", roles: ["admin", "sales_staff", "warehouse_manager"], group: "common" },
  { label: "Sales Management", href: "/admin/sales", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Warehouse Management", href: "/admin/warehouse", roles: ["admin", "warehouse_manager"], group: "warehouse" },
  { label: "Orders", href: "/admin/orders", roles: ["admin", "sales_staff", "warehouse_manager"], group: "sales" },
  { label: "Products", href: "/admin/products", roles: ["admin"], group: "system" },
  { label: "Users", href: "/admin/users", roles: ["admin"], group: "system" },
  { label: "Categories", href: "/admin/categories", roles: ["admin"], group: "system" },
  { label: "Brands", href: "/admin/brands", roles: ["admin"], group: "system" },
  { label: "Collections", href: "/admin/collections", roles: ["admin"], group: "system" },
  { label: "Reviews", href: "/admin/reviews", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Shipping", href: "/admin/shipping", roles: ["admin", "warehouse_manager"], group: "warehouse" },
  { label: "Payments", href: "/admin/payments", roles: ["admin"], group: "system" },
  { label: "Content", href: "/admin/content", roles: ["admin"], group: "system" },
  { label: "Reports", href: "/admin/reports", roles: ["admin"], group: "system" },
  { label: "Settings", href: "/admin/settings", roles: ["admin"], group: "system" },
];

const roleNames: Record<string, string> = {
  admin: "System Admin",
  sales_staff: "Sales Staff",
  warehouse_manager: "Warehouse Manager",
  customer: "Customer",
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

    verifyBackOffice();
  }, [checkSession, roleFromStore, router]);

  const menu = useMemo(() => sidebarItems.filter((item) => item.roles.includes(role)), [role]);

  useEffect(() => {
    if (loading || !role) return;
    const currentItem = sidebarItems.find((item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)));
    if (currentItem && !currentItem.roles.includes(role)) router.replace(fallbackByRole[role] || "/admin");
  }, [loading, pathname, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500" />
          <h1 className="text-lg font-bold text-slate-900">Checking access</h1>
          <p className="mt-1 text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-rose-100 bg-white p-5 shadow-sm lg:block">
        <Link href="/admin" className="flex items-center gap-3 rounded-3xl bg-rose-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 font-black text-white">3TL</div>
          <div>
            <h2 className="font-bold text-slate-900">3TL-Store</h2>
            <p className="text-xs text-slate-500">{roleNames[role] || "Admin"}</p>
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

        <div className="absolute bottom-5 left-5 right-5 space-y-2">
          <button onClick={logout} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">↪ Đăng xuất</button>
          <Link href="/" className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">⌂ Về trang chính</Link>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-rose-100 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Admin Console › {roleNames[role]}</p>
              <h1 className="text-xl font-bold text-slate-900">Management Dashboard</h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 font-bold text-white">{roleInitial(role)}</div>
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
