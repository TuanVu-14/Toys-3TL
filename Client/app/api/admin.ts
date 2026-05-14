import axios from "axios"; // thư viện gửi request HTTP

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

export async function createAdminUser(userData: {
  username: string;
  email: string;
  mobile_number: string;
  dob: string;
  password: string;
  role?: string;
}) {
  return adminClient.post("/admin/users", userData);
}

export async function updateAdminUser(userID: number, userData: any) {
  return adminClient.put(`/admin/users/${userID}`, userData);
}

export async function createAdminProduct(productData: any) {
  return adminClient.post("/admin/products", productData);
}

export async function updateAdminProduct(productID: number, productData: any) {
  return adminClient.put(`/admin/products/${productID}`, productData);
}

export async function updateAdminCategory(
  categoryID: number,
  categoryData: any,
) {
  return adminClient.put(`/admin/categories/${categoryID}`, categoryData);
}

// Promotions
export async function getAdminPromotions() {
  return adminClient.get("/admin/promotions");
}

export async function createAdminPromotion(data: any) {
  return adminClient.post("/admin/promotions", data);
}

export async function toggleAdminPromotion(promotionID: number) {
  return adminClient.put(`/admin/promotions/${promotionID}/toggle`, {});
}

export async function deleteAdminPromotion(promotionID: number) {
  return adminClient.delete(`/admin/promotions/${promotionID}`);
}

// Payments
export async function getAdminPayments() {
  return adminClient.get("/admin/payments");
}

export async function createAdminPayment(data: any) {
  return adminClient.post("/admin/payments", data);
}

export async function updateAdminPayment(paymentID: number, data: any) {
  return adminClient.put(`/admin/payments/${paymentID}`, data);
}

export async function deleteAdminPayment(paymentID: number) {
  return adminClient.delete(`/admin/payments/${paymentID}`);
}

// Shipping
export async function getAdminShipping() {
  return adminClient.get("/admin/shipping");
}

export async function createAdminShipping(data: any) {
  return adminClient.post("/admin/shipping", data);
}

export async function updateAdminShipping(shippingID: number, data: any) {
  return adminClient.put(`/admin/shipping/${shippingID}`, data);
}

export async function deleteAdminShipping(shippingID: number) {
  return adminClient.delete(`/admin/shipping/${shippingID}`);
}

// Content
export async function getAdminContent() {
  return adminClient.get("/admin/content");
}

export async function createAdminContent(data: any) {
  return adminClient.post("/admin/content", data);
}

export async function updateAdminContent(contentID: number, data: any) {
  return adminClient.put(`/admin/content/${contentID}`, data);
}

export async function deleteAdminContent(contentID: number) {
  return adminClient.delete(`/admin/content/${contentID}`);
}

// Reviews
export async function getAdminReviews() {
  return adminClient.get("/admin/reviews");
}

export async function updateAdminReviewStatus(
  reviewID: number,
  status: string,
) {
  return adminClient.put(`/admin/reviews/${reviewID}/status`, { status });
}

export async function deleteAdminReview(reviewID: number) {
  return adminClient.delete(`/admin/reviews/${reviewID}`);
}

// Settings
export async function getAdminSettings() {
  return adminClient.get("/admin/settings");
}

export async function updateAdminSettings(settings: any) {
  return adminClient.post("/admin/settings", { settings });
}

// Brands
export async function getAdminBrands() {
  return adminClient.get("/brands");
}

export async function createAdminBrand(data: {
  name: string;
  description?: string;
  logo_url?: string;
  manufacturer_info?: string;
  certification_details?: string;
}) {
  return adminClient.post("/brands", data);
}

export async function updateAdminBrand(brandID: number, data: any) {
  return adminClient.put(`/brands/${brandID}`, data);
}

export async function deleteAdminBrand(brandID: number) {
  return adminClient.delete(`/brands/${brandID}`);
}

export async function getAdminBrandDetails(brandID: number) {
  return adminClient.get(`/brands/${brandID}`);
}

// Collections
export async function getAdminCollections() {
  return adminClient.get("/collections");
}

export async function createAdminCollection(data: {
  name: string;
  slug: string;
  description?: string;
  banner_url?: string;
  icon_url?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  return adminClient.post("/collections", data);
}

export async function updateAdminCollection(collectionID: number, data: any) {
  return adminClient.put(`/collections/${collectionID}`, data);
}

export async function deleteAdminCollection(collectionID: number) {
  return adminClient.delete(`/collections/${collectionID}`);
}

export async function getAdminCollectionDetails(collectionID: number) {
  return adminClient.get(`/collections/${collectionID}`);
}

export async function addProductToCollection(
  collectionID: number,
  productID: number,
) {
  return adminClient.post(
    `/collections/${collectionID}/products/${productID}`,
    {},
  );
}

export async function removeProductFromCollection(
  collectionID: number,
  productID: number,
) {
  return adminClient.delete(
    `/collections/${collectionID}/products/${productID}`,
  );
}
