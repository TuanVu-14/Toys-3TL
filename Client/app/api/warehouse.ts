import axios from "axios";

const warehouseClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
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
