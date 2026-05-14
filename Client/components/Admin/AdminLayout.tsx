"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/hooks";
import useAuth from "@/controllers/Authentication";

type MenuItem = { label: string; href: string; roles: string[]; group: "system" | "sales" | "warehouse" | "common" };

const sidebarItems: MenuItem[] = [
  { label: "Dashboard", href: "/admin", roles: ["admin", "sales_staff", "warehouse_manager"], group: "common" },
  { label: "Sales Management", href: "/admin/sales", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Warehouse Management", href: "/admin/warehouse", roles: ["admin", "warehouse_manager"], group: "warehouse" },
  { label: "Users", href: "/admin/users", roles: ["admin"], group: "system" },
  { label: "Orders", href: "/admin/orders", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Products", href: "/admin/products", roles: ["admin"], group: "system" },
  { label: "Categories", href: "/admin/categories", roles: ["admin"], group: "system" },
  { label: "Promotions", href: "/admin/promotions", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Payments", href: "/admin/payments", roles: ["admin"], group: "system" },
  { label: "Shipping", href: "/admin/shipping", roles: ["admin", "warehouse_manager"], group: "warehouse" },
  { label: "Content", href: "/admin/content", roles: ["admin"], group: "system" },
  { label: "Reports", href: "/admin/reports", roles: ["admin"], group: "system" },
  { label: "Reviews", href: "/admin/reviews", roles: ["admin", "sales_staff"], group: "sales" },
  { label: "Settings", href: "/admin/settings", roles: ["admin"], group: "system" },
];

const roleNames: Record<string, string> = {
  admin: "System Admin",
  sales_staff: "Sales Staff",
  warehouse_manager: "Warehouse Manager",
};

const fallbackByRole: Record<string, string> = {
  admin: "/admin",
  sales_staff: "/admin/sales",
  warehouse_manager: "/admin/warehouse",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { checkSession } = useAuth();
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
    const currentItem = sidebarItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    if (currentItem && !currentItem.roles.includes(role)) router.replace(fallbackByRole[role] || "/admin");
  }, [loading, pathname, role, router]);

  if (loading) {
    return <main className="min-h-screen bg-rose-50 flex items-center justify-center text-rose-500"><div className="rounded-3xl bg-white px-10 py-8 shadow-sm border border-rose-100 text-center"><p className="text-sm uppercase tracking-[0.3em]">Checking access</p><h1 className="text-2xl font-bold text-slate-900 mt-2">Please wait...</h1></div></main>;
  }

  return (
    <div className="min-h-screen bg-rose-50 text-slate-900 flex">
      <aside className="w-[260px] bg-white/70 border-r border-rose-100 min-h-screen flex flex-col fixed left-0 top-0 bottom-0">
        <div className="h-[150px] flex items-center gap-3 px-7 border-b border-rose-100">
          <div className="w-11 h-11 rounded-2xl bg-rose-400 text-white flex items-center justify-center font-black shadow-lg shadow-rose-200">3TL</div>
          <div><h2 className="text-lg font-black">3TL-Store</h2><p className="text-[11px] tracking-[0.24em] uppercase text-rose-400">{roleNames[role] || "Admin"}</p></div>
        </div>
        <nav className="py-5 px-3 flex-1 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-[0.3em] text-rose-300 mb-3">Menu theo phân quyền</p>
          {menu.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return <Link key={item.href} href={item.href} className={`flex items-center justify-between rounded-xl px-4 py-3 mb-1 text-sm transition ${active ? "bg-rose-100 text-rose-500 font-semibold" : "text-rose-900/70 hover:bg-rose-50 hover:text-rose-500"}`}><span>{item.label}</span>{active ? <span className="w-1.5 h-1.5 rounded-full bg-rose-300" /> : null}</Link>;
          })}
          {role !== "admin" ? <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-600">Bạn chỉ thấy các chức năng được cấp quyền. Các mục Admin khác sẽ không hiển thị và không truy cập được.</div> : null}
        </nav>
        <div className="border-t border-rose-100 p-4 space-y-3 text-sm text-rose-900/60"><Link href="/signed-out" className="block hover:text-rose-500">↪ Đăng xuất</Link><Link href="/" className="block hover:text-rose-500">⌂ Về trang chính</Link></div>
      </aside>
      <section className="ml-[260px] flex-1 min-h-screen">
        <header className="h-[132px] bg-white/70 border-b border-rose-100 flex items-center justify-between px-7">
          <div><p className="text-sm text-rose-300">Admin Console › <span className="text-slate-900 font-semibold">{roleNames[role]}</span></p><p className="text-sm text-rose-400 font-semibold mt-8">✦ Welcome back</p><h1 className="text-2xl font-black mt-2">Management Dashboard</h1></div>
          <div className="flex items-center gap-3"><div className="rounded-xl bg-white border border-rose-100 px-5 py-3 text-center shadow-sm"><p className="text-[10px] uppercase tracking-[0.25em] text-rose-400 font-bold">Role</p><p className="font-bold text-sm">{role}</p></div><div className="w-10 h-10 rounded-xl bg-rose-400 text-white flex items-center justify-center font-black">{role === "sales_staff" ? "S" : role === "warehouse_manager" ? "W" : "A"}</div></div>
        </header>
        <main className="p-7">{children}</main>
      </section>
    </div>
  );
}
