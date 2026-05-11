import axios from "axios";// thư viện gửi request HTTP

const url = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

const adminClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export async function getAdminStats() {
  return adminClient.get("/admin/stats");
}

export async function getAdminUsers() {
  return adminClient.get("/admin/users");
}

export async function updateAdminUserRole(userID: number, role: string) {
  return adminClient.put(`/admin/users/${userID}/role`, { role });
}

export async function deleteAdminUser(userID: number) {
  return adminClient.delete(`/admin/users/${userID}`);
}

export async function getAdminOrders() {
  return adminClient.get("/admin/orders");
}

export async function updateOrderStatus(orderID: number, status: string) {
  return adminClient.put(`/admin/orders/${orderID}/status`, { status });
}

export async function getAdminProducts() {
  return adminClient.get("/admin/products");
}

export async function deleteAdminProduct(productID: number) {
  return adminClient.delete(`/admin/products/${productID}`);
}

export async function getAdminCategories() {
  return adminClient.get("/admin/categories");
}

export async function createAdminCategory(
  name: string,
  parentcategoryid?: number,
) {
  return adminClient.post("/admin/categories", {
    name,
    parentcategoryid: parentcategoryid || null,
  });
}

export async function deleteAdminCategory(categoryID: number) {
  return adminClient.delete(`/admin/categories/${categoryID}`);
}
