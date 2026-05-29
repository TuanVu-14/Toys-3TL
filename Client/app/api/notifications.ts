
import axios from "axios";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:3500";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const item = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : "";
}

function readSessionToken() {
  if (typeof window === "undefined") return "";
  return (
    readCookie("sessionhold") ||
    readCookie("session") ||
    window.localStorage.getItem("sessionhold") ||
    window.localStorage.getItem("session") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

const notificationClient = axios.create({
  baseURL: `${API_ORIGIN.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

notificationClient.interceptors.request.use((config) => {
  const token = readSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.session = `Bearer ${token}`;
  }
  return config;
});

export function getNotifications(params?: { userid?: number | string; role?: string }) {
  return notificationClient.get("/notifications", { params });
}

export function markNotificationRead(notificationID: number) {
  return notificationClient.put(`/notifications/${notificationID}/read`, {});
}

export function markAllNotificationsRead(body?: { userid?: number | string; role?: string }) {
  return notificationClient.put("/notifications/read-all", body || {});
}

export function deleteNotification(notificationID: number) {
  return notificationClient.delete(`/notifications/${notificationID}`);
}
