"use client";

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/hooks";
import useAuth from "@/controllers/Authentication";

const sidebarItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Promotions", href: "/admin/promotions" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Shipping", href: "/admin/shipping" },
  { label: "Content", href: "/admin/content" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { checkSession } = useAuth();
  const role = useAppSelector((state) => state.userState.defaultAccount.role);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (role === "admin") {
        setLoading(false);
        return;
      }

      const session = await checkSession();

      if (!session?.success || session.data?.role !== "admin") {
        router.replace("/");
      } else {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [checkSession, role, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 text-slate-900">
        <div className="mx-auto flex h-screen w-full max-w-4xl items-center justify-center px-6">
          <div className="rounded-3xl border border-rose-200 bg-white px-8 py-10 text-center shadow-lg">
            <p className="text-sm text-rose-500">Checking admin access</p>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              Please wait...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 text-slate-900">
      <div className="flex flex-col md:flex-row">
        <aside className="w-full md:w-80 bg-white border-r border-rose-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-rose-500">
                Admin Console
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                3-TL
              </h1>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-rose-500 text-white shadow"
                      : "text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-rose-600">Welcome back, Admin</p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Management Dashboard
              </h2>
            </div>
            <div className="rounded-2xl bg-white border border-rose-200 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-rose-400">
                Today
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
