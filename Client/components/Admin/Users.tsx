"use client";

import React, { useEffect, useState } from "react";
import { createAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser, updateAdminUserRole } from "@/app/api/admin";

type AdminUser = { userid: number; username: string; email: string; mobile_number: string; dob: string; role: string };
type UserFormData = { username: string; email: string; mobile_number: string; dob: string; password?: string; role: string };

const roles = [
  { value: "customer", label: "Customer" },
  { value: "sales_staff", label: "Sales Staff" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
  { value: "admin", label: "Admin" },
];

const inputClass = "mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ username: "", email: "", mobile_number: "", dob: "", password: "", role: "customer" });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers();
      setUsers(response.data?.data || []);
    } catch {
      setError("Không lấy được danh sách người dùng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userID: number, newRole: string) => {
    setSavingUserId(userID);
    try {
      await updateAdminUserRole(userID, newRole);
      await fetchUsers();
    } catch {
      setError("Không cập nhật được quyền. Vui lòng thử lại.");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDelete = async (userID: number) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này không?")) return;
    try {
      await deleteAdminUser(userID);
      setUsers((current) => current.filter((user) => user.userid !== userID));
    } catch {
      setError("Không xóa được người dùng. Vui lòng thử lại.");
    }
  };

  const handleOpenForm = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, email: user.email, mobile_number: user.mobile_number, dob: user.dob, role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ username: "", email: "", mobile_number: "", dob: "", password: "", role: "customer" });
    }
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) await updateAdminUser(editingUser.userid, formData);
      else await createAdminUser(formData as any);
      await fetchUsers();
      setShowForm(false);
    } catch {
      setError("Không lưu được người dùng. Vui lòng thử lại.");
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black">Quản lý người dùng</h3>
          <p className="text-sm text-slate-500 mt-1">Phân quyền: Customer, Sales Staff, Warehouse Manager, Admin.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">Tải lại</button>
          <button onClick={() => handleOpenForm()} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">Thêm người dùng</button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-rose-50 text-left text-xs uppercase tracking-wide text-rose-500"><tr><th className="p-4">Tên</th><th>Email</th><th>Điện thoại</th><th>Ngày sinh</th><th>Vai trò</th><th>Hành động</th></tr></thead>
          <tbody className="divide-y divide-rose-50">
            {loading ? <tr><td colSpan={6} className="p-5 text-center">Đang tải...</td></tr> : null}
            {!loading && users.length === 0 ? <tr><td colSpan={6} className="p-5 text-center">Không có người dùng nào.</td></tr> : null}
            {users.map((user) => (
              <tr key={user.userid} className="hover:bg-rose-50/40">
                <td className="p-4 font-semibold">{user.username}</td><td>{user.email}</td><td>{user.mobile_number}</td><td>{user.dob}</td>
                <td><select value={user.role || "customer"} onChange={(e) => handleRoleChange(user.userid, e.target.value)} disabled={savingUserId === user.userid} className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 disabled:opacity-50">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></td>
                <td className="space-x-2"><button onClick={() => handleOpenForm(user)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50">Sửa</button><button onClick={() => handleDelete(user.userid)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmitForm} className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-black">{editingUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-semibold">Tên người dùng<input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={inputClass} required /></label>
            <label className="text-sm font-semibold">Email<input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} required /></label>
            <label className="text-sm font-semibold">Điện thoại<input value={formData.mobile_number} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} className={inputClass} required /></label>
            <label className="text-sm font-semibold">Ngày sinh<input value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className={inputClass} placeholder="YYYY-MM-DD" required /></label>
            {!editingUser ? <label className="text-sm font-semibold">Mật khẩu<input type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputClass} required /></label> : null}
            <label className="text-sm font-semibold">Vai trò<select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={inputClass}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
          </div>
          <div className="flex gap-3"><button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold hover:bg-slate-50">Hủy</button><button type="submit" className="flex-1 rounded-2xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-rose-500">{editingUser ? "Cập nhật" : "Thêm"}</button></div>
        </form>
      ) : null}
    </section>
  );
}
