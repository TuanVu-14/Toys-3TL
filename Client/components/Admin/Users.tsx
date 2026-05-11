"use client";

import React, { useEffect, useState } from "react";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
} from "@/app/api/admin";

type AdminUser = {
  userid: number;
  username: string;
  email: string;
  mobile_number: string;
  dob: string;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

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
            <button className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
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
                  <td className="px-4 py-4 space-x-2">
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
    </div>
  );
}
