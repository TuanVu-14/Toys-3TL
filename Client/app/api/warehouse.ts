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

const warehouseClient = axios.create({
  baseURL: `${API_ORIGIN.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

warehouseClient.interceptors.request.use((config) => {
  const token = readSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.session = `Bearer ${token}`;
  }
  return config;
});

export function getWarehouseSummary() {
  return warehouseClient.get("/warehouse/summary");
}

export function getWarehouseProducts() {
  return warehouseClient.get("/warehouse/products");
}

export function getLowStockProducts() {
  return warehouseClient.get("/warehouse/low-stock");
}

export function getTopWarehouseProducts() {
  return warehouseClient.get("/warehouse/top-products");
}

export function getKeyProductAlerts() {
  return warehouseClient.get("/warehouse/key-product-alerts");
}

export function getProductBatches() {
  return warehouseClient.get("/warehouse/batches");
}

export function stockIn(payload: {
  productID: number;
  quantity: number;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  supplierID?: number;
  note?: string;
}) {
  return warehouseClient.post("/warehouse/stock-in", payload);
}

export function stockOut(payload: {
  productID: number;
  quantity: number;
  batchNumber?: string;
  note?: string;
}) {
  return warehouseClient.post("/warehouse/stock-out", payload);
}

export function getWarehouseReturns() {
  return warehouseClient.get("/warehouse/returns");
}

export function updateReturnStatus(returnID: number, status: string) {
  return warehouseClient.put(`/warehouse/returns/${returnID}/status`, { status });
}

export function getWarehouseOrders() {
  return warehouseClient.get("/warehouse/orders");
}

export function updateFulfillmentStatus(orderID: number, status: string, trackingNumber?: string) {
  return warehouseClient.put(`/warehouse/orders/${orderID}/status`, { status, trackingNumber });
}
