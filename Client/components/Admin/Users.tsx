"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser, updateAdminUserRole } from "@/app/api/admin";

type AdminUser = {
  userid: number;
  username: string;
  email: string;
  mobile_number: string;
  dob: string;
  role: string;
  is_active?: boolean;
  createdat?: string;
};

type UserFormData = {
  username: string;
  email: string;
  mobile_number: string;
  dob: string;
  password?: string;
  role: string;
  is_active: boolean;
};

const roles = [
  { value: "customer", label: "Khách hàng" },
  { value: "sales_staff", label: "Nhân viên bán hàng" },
  { value: "warehouse_manager", label: "Quản lý kho" },
  { value: "admin", label: "Quản trị" },
];

const inputClass = "mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 text-sm outline-none focus:border-rose-500";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<UserFormData>({ username: "", email: "", mobile_number: "", dob: "", password: "", role: "customer", is_active: true });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers();
      setUsers(response.data?.data || []);
    } catch {
      setError("Không lấy được danh sách người dùng. Kiểm tra token admin hoặc server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) => [user.username, user.email, user.mobile_number, user.role].some((value) => String(value || "").toLowerCase().includes(keyword)));
  }, [users, search]);

  const handleRoleChange = async (userID: number, newRole: string) => {
    setSavingUserId(userID);
    setError(null);
    try {
      await updateAdminUserRole(userID, newRole);
      await fetchUsers();
    } catch {
      setError("Không cập nhật được quyền người dùng.");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDelete = async (userID: number) => {
    if (!confirm("Khóa tài khoản này? Lịch sử đơn hàng vẫn được giữ lại.")) return;
    try {
      await deleteAdminUser(userID);
      await fetchUsers();
    } catch {
      setError("Không khóa được người dùng.");
    }
  };

  const handleOpenForm = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || "",
        email: user.email || "",
        mobile_number: user.mobile_number || "",
        dob: user.dob || "",
        role: user.role || "customer",
        is_active: user.is_active !== false,
      });
    } else {
      setEditingUser(null);
      setFormData({ username: "", email: "", mobile_number: "", dob: "", password: "", role: "customer", is_active: true });
    }
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingUser) await updateAdminUser(editingUser.userid, formData);
      else await createAdminUser(formData);
      await fetchUsers();
      setShowForm(false);
    } catch {
      setError("Không lưu được người dùng. Email/số điện thoại có thể đã tồn tại.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-500">User Administration</p>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý người dùng & phân quyền</h2>
          <p className="mt-1 text-sm text-slate-500">Customer, Sales Staff, Warehouse Manager, Admin. Không xóa cứng để giữ lịch sử đơn hàng.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, email, vai trò..." className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-500" />
          <button onClick={fetchUsers} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Tải lại</button>
          <button onClick={() => handleOpenForm()} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">Thêm người dùng</button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-5 py-4">Người dùng</th><th className="px-5 py-4">Liên hệ</th><th className="px-5 py-4">Ngày sinh</th><th className="px-5 py-4">Vai trò</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Hành động</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Đang tải...</td></tr> : null}
            {!loading && filteredUsers.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Không có người dùng nào.</td></tr> : null}
            {filteredUsers.map((user) => (
              <tr key={user.userid} className={user.is_active === false ? "bg-slate-50 opacity-60" : ""}>
                <td className="px-5 py-4"><div className="font-semibold text-slate-900">{user.username}</div><div className="text-xs text-slate-400">ID #{user.userid}</div></td>
                <td className="px-5 py-4"><div>{user.email}</div><div className="text-xs text-slate-500">{user.mobile_number}</div></td>
                <td className="px-5 py-4 text-slate-600">{user.dob}</td>
                <td className="px-5 py-4"><select value={user.role || "customer"} onChange={(e) => handleRoleChange(user.userid, e.target.value)} disabled={savingUserId === user.userid} className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 disabled:opacity-50">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active === false ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>{user.is_active === false ? "Đã khóa" : "Đang hoạt động"}</span></td>
                <td className="px-5 py-4 text-right"><button onClick={() => handleOpenForm(user)} className="mr-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Sửa</button><button onClick={() => handleDelete(user.userid)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">Khóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={handleSubmitForm} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-bold text-slate-900">{editingUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}</h3><button type="button" onClick={() => setShowForm(false)} className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100">✕</button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Tên người dùng<input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={inputClass} required /></label>
              <label className="text-sm font-semibold text-slate-700">Email<input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} required /></label>
              <label className="text-sm font-semibold text-slate-700">Điện thoại<input value={formData.mobile_number} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} className={inputClass} required /></label>
              <label className="text-sm font-semibold text-slate-700">Ngày sinh<input value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className={inputClass} placeholder="YYYY-MM-DD" required /></label>
              {!editingUser ? <label className="text-sm font-semibold text-slate-700">Mật khẩu<input type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputClass} required /></label> : null}
              <label className="text-sm font-semibold text-slate-700">Vai trò<select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={inputClass}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> Đang hoạt động</label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-slate-50">Hủy</button><button type="submit" className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 font-semibold text-white hover:bg-rose-600">{editingUser ? "Cập nhật" : "Thêm"}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
