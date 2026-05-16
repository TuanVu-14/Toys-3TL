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

const salesClient = axios.create({
  baseURL: `${API_ORIGIN.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

salesClient.interceptors.request.use((config) => {
  const token = readSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.session = `Bearer ${token}`;
  }
  return config;
});

export const getSalesSummary = () => salesClient.get("/sales/summary");
export const getSalesProducts = (params?: Record<string, any>) => salesClient.get("/sales/products/consult", { params });
export const getSalesOrders = () => salesClient.get("/sales/orders");
export const confirmSalesOrder = (orderID: number) => salesClient.put(`/sales/orders/${orderID}/confirm`);
export const updateSalesOrderStatus = (orderID: number, status: string) => salesClient.put(`/sales/orders/${orderID}/status`, { status });
export const createSalesOrder = (payload: any) => salesClient.post("/sales/orders", payload);
export const getSalesPromotions = () => salesClient.get("/sales/promotions");
export const createSalesPromotion = (payload: any) => salesClient.post("/sales/promotions", payload);
export const getSalesCoupons = () => salesClient.get("/sales/coupons");
export const createSalesCoupon = (payload: any) => salesClient.post("/sales/coupons", payload);
export const getWishlistSuggestions = () => salesClient.get("/sales/wishlist-suggestions");
export const getCustomerBirthdays = () => salesClient.get("/sales/customer-birthdays");
export const createStaffNote = (payload: any) => salesClient.post("/sales/staff-notes", payload);

export default salesClient;
