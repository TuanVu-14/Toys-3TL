
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "@/app/hooks";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/app/api/notifications";

type NotificationItem = {
  notificationid: number;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
  is_read: boolean;
  createdat: string;
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationBell() {
  const router = useRouter();
  const user = useAppSelector((state) => state.userState.defaultAccount);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  async function fetchData() {
    try {
const res = await getNotifications({
  userid: user?.userID,
  role: user?.role,
});      setItems(res.data?.data || []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [user?.userID, user?.userID, user?.role]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleOpen(item: NotificationItem) {
    if (!item.is_read) {
      await markNotificationRead(item.notificationid);
      setItems((prev) => prev.map((n) => n.notificationid === item.notificationid ? { ...n, is_read: true } : n));
    }
    if (item.action_url) router.push(item.action_url);
    setOpen(false);
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
        aria-label="Mở thông báo"
      >
        <BellIcon className="h-[28px] w-[28px]" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[80] w-[360px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Thông báo</p>
              <p className="text-xs text-slate-500">{unread} thông báo chưa đọc</p>
            </div>
            <button onClick={handleReadAll} className="text-xs font-semibold text-rose-500 hover:text-rose-600">Đọc tất cả</button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-5 text-center text-sm text-slate-500">Chưa có thông báo.</p>
            ) : items.map((item) => (
              <button
                key={item.notificationid}
                type="button"
                onClick={() => handleOpen(item)}
                className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-rose-50 ${!item.is_read ? "bg-rose-50/60" : "bg-white"}`}
              >
                <div className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${!item.is_read ? "bg-rose-500" : "bg-slate-200"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.message}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{timeAgo(item.createdat)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
