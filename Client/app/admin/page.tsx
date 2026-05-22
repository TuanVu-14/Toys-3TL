"use client";

import AdminLayout from "@/components/Admin/AdminLayout";
import Dashboard from "@/components/Admin/Dashboard";

export default function AdminHome() {
  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
}
