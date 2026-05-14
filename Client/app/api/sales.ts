import axios from "axios";

const salesClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export const getSalesSummary = () => salesClient.get("/sales/summary");
export const getSalesProducts = (params?: Record<string, string>) => salesClient.get("/sales/products/consult", { params });
export const getSalesOrders = () => salesClient.get("/sales/orders");
export const confirmSalesOrder = (orderID: number) => salesClient.put(`/sales/orders/${orderID}/confirm`);
export const createSalesOrder = (payload: any) => salesClient.post("/sales/orders", payload);
export const getSalesPromotions = () => salesClient.get("/sales/promotions");
export const createSalesPromotion = (payload: any) => salesClient.post("/sales/promotions", payload);
export const getSalesCoupons = () => salesClient.get("/sales/coupons");
export const createSalesCoupon = (payload: any) => salesClient.post("/sales/coupons", payload);
export const getWishlistSuggestions = () => salesClient.get("/sales/wishlist-suggestions");
export const getCustomerBirthdays = () => salesClient.get("/sales/customer-birthdays");
export const createStaffNote = (payload: any) => salesClient.post("/sales/staff-notes", payload);
