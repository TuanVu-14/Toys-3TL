"use client";

import React, { useEffect, useState } from "react";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
  createAdminUser,
  updateAdminUser,
} from "@/app/api/admin";

type AdminUser = {
  userid: number;
  username: string;
  email: string;
  mobile_number: string;
  dob: string;
  role: string;
};

type UserFormData = {
  username: string;
  email: string;
  mobile_number: string;
  dob: string;
  password?: string;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    mobile_number: "",
    dob: "",
    password: "",
    role: "customer",
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers();
      setUsers(response.data?.data || []);
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      setError("Không xóa được người dùng. Vui lòng thử lại.");
    }
  };

  const handleOpenForm = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        mobile_number: user.mobile_number,
        dob: user.dob,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        email: "",
        mobile_number: "",
        dob: "",
        password: "",
        role: "customer",
      });
    }
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateAdminUser(editingUser.userid, formData);
      } else {
        await createAdminUser(formData as any);
      }
      await fetchUsers();
      setShowForm(false);
    } catch (err) {
      setError("Không lưu được người dùng. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Quản lý người dùng
            </h3>
            <p className="text-sm text-slate-600">
              Quản lý quyền truy cập tài khoản và vai trò của người dùng.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchUsers}
              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Tải lại
            </button>
            <button
              onClick={() => handleOpenForm()}
              className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Thêm người dùng
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        {error ? (
          <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên người dùng</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Điện thoại</th>
              <th className="px-4 py-3 font-semibold">Ngày sinh</th>
              <th className="px-4 py-3 font-semibold">Vai trò</th>
              <th className="px-4 py-3 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Không có người dùng nào.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userid} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {user.username}
                  </td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {user.mobile_number}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{user.dob}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 space-x-2 flex">
                    <button
                      onClick={() => handleOpenForm(user)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sửa
                    </button>
                    <select
                      value={user.role}
                      onChange={(event) =>
                        handleRoleChange(user.userid, event.target.value)
                      }
                      disabled={savingUserId === user.userid}
                      className="rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-500 disabled:opacity-50"
                    >
                      <option value="customer">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                    <button
                      type="button"
                      disabled={savingUserId === user.userid}
                      onClick={() => handleDelete(user.userid)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900">
              {editingUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Điện thoại
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile_number}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_number: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Vai trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 outline-none focus:border-rose-500"
                >
                  <option value="customer">Khách hàng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-600"
                >
                  {editingUser ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
