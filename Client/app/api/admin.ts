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

const adminClient = axios.create({
  baseURL: `${API_ORIGIN.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

adminClient.interceptors.request.use((config) => {
  const token = readSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.session = `Bearer ${token}`;
  }
  return config;
});

export async function getAdminStats() { return adminClient.get("/admin/stats"); }
export async function getAdminUsers() { return adminClient.get("/admin/users"); }
export async function createAdminUser(userData: any) { return adminClient.post("/admin/users", userData); }
export async function updateAdminUser(userID: number, userData: any) { return adminClient.put(`/admin/users/${userID}`, userData); }
export async function updateAdminUserRole(userID: number, role: string) { return adminClient.put(`/admin/users/${userID}/role`, { role }); }
export async function deleteAdminUser(userID: number) { return adminClient.delete(`/admin/users/${userID}`); }

export async function getAdminOrders() { return adminClient.get("/admin/orders"); }
export async function updateOrderStatus(orderID: number, status: string) { return adminClient.put(`/admin/orders/${orderID}/status`, { status }); }

export async function getAdminProducts() { return adminClient.get("/admin/products"); }
export async function createAdminProduct(productData: any) { return adminClient.post("/admin/products", productData); }
export async function updateAdminProduct(productID: number, productData: any) { return adminClient.put(`/admin/products/${productID}`, productData); }
export async function deleteAdminProduct(productID: number) { return adminClient.delete(`/admin/products/${productID}`); }

export async function getAdminCategories() { return adminClient.get("/admin/categories"); }
export async function createAdminCategory(data: any) { return adminClient.post("/admin/categories", data); }
export async function updateAdminCategory(categoryID: number, data: any) { return adminClient.put(`/admin/categories/${categoryID}`, data); }
export async function deleteAdminCategory(categoryID: number) { return adminClient.delete(`/admin/categories/${categoryID}`); }


export async function getAdminBrands() { return adminClient.get("/admin/brands"); }
export async function createAdminBrand(data: any) { return adminClient.post("/admin/brands", data); }
export async function updateAdminBrand(brandID: number, data: any) { return adminClient.put(`/admin/brands/${brandID}`, data); }
export async function deleteAdminBrand(brandID: number) { return adminClient.delete(`/admin/brands/${brandID}`); }

export async function getAdminCollections() { return adminClient.get("/admin/collections"); }
export async function createAdminCollection(data: any) { return adminClient.post("/admin/collections", data); }
export async function updateAdminCollection(collectionID: number, data: any) { return adminClient.put(`/admin/collections/${collectionID}`, data); }
export async function deleteAdminCollection(collectionID: number) { return adminClient.delete(`/admin/collections/${collectionID}`); }

export async function getAdminPromotions() { return adminClient.get("/admin/promotions"); }
export async function createAdminPromotion(data: any) { return adminClient.post("/admin/promotions", data); }
export async function toggleAdminPromotion(promotionID: number) { return adminClient.put(`/admin/promotions/${promotionID}/toggle`, {}); }
export async function deleteAdminPromotion(promotionID: number) { return adminClient.delete(`/admin/promotions/${promotionID}`); }

export async function getAdminPayments() { return adminClient.get("/admin/payments"); }
export async function createAdminPayment(data: any) { return adminClient.post("/admin/payments", data); }
export async function updateAdminPayment(paymentID: number, data: any) { return adminClient.put(`/admin/payments/${paymentID}`, data); }
export async function deleteAdminPayment(paymentID: number) { return adminClient.delete(`/admin/payments/${paymentID}`); }

export async function getAdminShipping() { return adminClient.get("/admin/shipping"); }
export async function createAdminShipping(data: any) { return adminClient.post("/admin/shipping", data); }
export async function updateAdminShipping(shippingID: number, data: any) { return adminClient.put(`/admin/shipping/${shippingID}`, data); }
export async function deleteAdminShipping(shippingID: number) { return adminClient.delete(`/admin/shipping/${shippingID}`); }

export async function getAdminContent() { return adminClient.get("/admin/content"); }
export async function createAdminContent(data: any) { return adminClient.post("/admin/content", data); }
export async function updateAdminContent(contentID: number, data: any) { return adminClient.put(`/admin/content/${contentID}`, data); }
export async function deleteAdminContent(contentID: number) { return adminClient.delete(`/admin/content/${contentID}`); }

export async function getAdminReviews() { return adminClient.get("/admin/reviews"); }
export async function updateAdminReviewStatus(reviewID: number, status: string) { return adminClient.put(`/admin/reviews/${reviewID}/status`, { status }); }
export async function deleteAdminReview(reviewID: number) { return adminClient.delete(`/admin/reviews/${reviewID}`); }

export async function getAdminSettings() { return adminClient.get("/admin/settings"); }
export async function updateAdminSettings(settings: any) { return adminClient.post("/admin/settings", { settings }); }

export default adminClient;
