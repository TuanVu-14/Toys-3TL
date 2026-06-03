"use client";

import { orderDetailHandler } from "@/app/api/orders";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import Loading from "../Loading";
import NotLoggedin from "./NotLoggedin";
import OrderNotFound from "./OrderNotFound";

type Address = {
  username?: string;
  contactnumber?: string;
  addressline1?: string;
  addressline2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalcode?: string;
};

type OrderItem = {
  orderitemid?: number;
  productid: number;
  title: string;
  quantity: number;
  price: string | number;
  discount?: string | number | null;
  discountedprice?: string | number | null;
  imglink?: string | null;
  imgalt?: string | null;
  gift_wrapping?: boolean;
  gift_wrap_style?: string | null;
  gift_message?: string | null;
  line_subtotal?: string | number;
};

type OrderDetailData = {
  orderid: number;
  createdat: string;
  deliveredat?: string | null;
  delivered_at?: string | null;
  orderstatus: string;
  paymentstatus: string;
  paymentmethod: string;
  username: string;
  email: string;
  mobile_number: string;
  billingaddress?: Address;
  shippingaddress?: Address;
  addressid?: number;
  order_code?: string;
  totalamount: string | number;
  shippingcost?: string | number;
  trackingnumber?: string | null;
  tracking_number?: string | null;
  is_gift?: boolean;
  gift_message?: string | null;
  gift_wrapping_type?: string | null;
  items: OrderItem[];
};

type PageState = "loading" | "loaded" | "not-found" | "not-login";

const emptyAddress: Address = {};

const safeNumber = (value: unknown) => {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatDateVN = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
};

const fullAddress = (address?: Address) =>
  [
    address?.addressline1,
    address?.addressline2,
    address?.city,
    address?.state,
    address?.postalcode,
    address?.country,
  ]
    .filter(Boolean)
    .join(", ") || "Chưa cập nhật";

const mapUrl = (address?: Address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(address))}`;

const safeImage = (src?: string | null) => {
  const value = String(src || "").trim();
  if (!value || ["im", "img", "/im", "/img"].includes(value.toLowerCase())) {
    return "/images/no-image.png";
  }
  if (value.startsWith("/images/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return "/images/no-image.png";
};

const statusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    Pending: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    Preparing: "Đang chuẩn bị hàng",
    Prepared: "Đã chuẩn bị",
    Packed: "Đã đóng gói",
    Shipping: "Đang giao hàng",
    Shipped: "Đang giao hàng",
    Delivered: "Đã giao hàng",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
    Returned: "Đã hoàn trả",
    Failed: "Giao thất bại",
  };

  return labels[status || ""] || status || "Chưa cập nhật";
};

const paymentMethodLabel = (method?: string) => {
  const labels: Record<string, string> = {
    "Payment on Delivery": "Thanh toán khi nhận hàng",
    COD: "Thanh toán khi nhận hàng",
    Online: "Thanh toán trực tuyến",
    MoMo: "Ví MoMo",
    Momo: "Ví MoMo",
    Bank: "Chuyển khoản ngân hàng",
    QR: "Thanh toán QR",
  };

  return labels[method || ""] || method || "Chưa cập nhật";
};

const paymentStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    Completed: "Đã thanh toán",
    Cancelled: "Đã hủy thanh toán",
    Failed: "Thanh toán thất bại",
    Refunded: "Đã hoàn tiền",
  };

  return labels[status || ""] || status || "Chưa cập nhật";
};

const getDiscountedUnitPrice = (item: OrderItem) => {
  const price = safeNumber(item.price);
  const explicitDiscountedPrice = safeNumber(item.discountedprice);
  if (explicitDiscountedPrice > 0) return explicitDiscountedPrice;

  const discount = safeNumber(item.discount);
  if (discount > 0) return Math.round((price * (100 - discount)) / 100);

  return price;
};

const getOrderCode = (order: OrderDetailData) => `${order.order_code || "#"}${order.orderid}`;

const ORDER_STEPS = [
  { key: "Pending", label: "Chờ xác nhận" },
  { key: "Confirmed", label: "Đã xác nhận" },
  { key: "Packed", label: "Đã đóng gói" },
  { key: "Shipped", label: "Đang giao" },
  { key: "Delivered", label: "Đã giao" },
];

function TrackingBar({ status }: { status: string }) {
  const normalizedStatus = status === "Completed" ? "Delivered" : status;
  const stepIndex = Math.max(
    0,
    ORDER_STEPS.findIndex((step) => step.key === normalizedStatus),
  );
  const stopped = ["Cancelled", "Returned", "Failed"].includes(status);

  if (stopped) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        Đơn hàng đang ở trạng thái: {statusLabel(status)}
      </div>
    );
  }

  return (
    <div className="mt-5 flex items-center justify-between gap-2 print:hidden">
      {ORDER_STEPS.map((step, index) => {
        const done = index <= stepIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  done ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={`text-xs ${done ? "font-semibold text-indigo-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {index < ORDER_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${index < stepIndex ? "bg-indigo-300" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const params = useParams<{ orderid: string }>();
  const pathname = usePathname();
  const isInvoice = pathname?.startsWith("/invoice");

  const [state, setState] = useState<PageState>("loading");
  const [order, setOrder] = useState<OrderDetailData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setState("loading");
      const response = await orderDetailHandler(params.orderid);
      if (cancelled) return;

      if (response.status === 200 && response.data?.data) {
        const raw = response.data.data;
        const items = Array.isArray(raw.items)
          ? raw.items
          : [
              {
                orderitemid: raw.orderitemid,
                productid: raw.productid,
                title: raw.title,
                quantity: raw.quantity,
                price: raw.price,
                discount: raw.discount,
                discountedprice: raw.discountedprice,
                imglink: raw.imglink,
                imgalt: raw.imgalt,
                gift_wrapping: raw.gift_wrapping,
                gift_wrap_style: raw.gift_wrap_style,
                gift_message: raw.gift_message,
              },
            ].filter((item) => item.productid);

        setOrder({ ...raw, items });
        setState("loaded");
        return;
      }

      if (response.status === 250 || response.status === 500) {
        setState("not-login");
        return;
      }

      setState("not-found");
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [params.orderid]);

  const totals = useMemo(() => {
    const items = order?.items || [];
    const originalSubtotal = items.reduce(
      (sum, item) => sum + safeNumber(item.price) * safeNumber(item.quantity || 1),
      0,
    );
    const productSubtotal = items.reduce(
      (sum, item) => sum + getDiscountedUnitPrice(item) * safeNumber(item.quantity || 1),
      0,
    );
    const productDiscount = Math.max(originalSubtotal - productSubtotal, 0);
    const shipping = safeNumber(order?.shippingcost);
    const finalTotal = safeNumber(order?.totalamount) || productSubtotal + shipping;

    return {
      originalSubtotal,
      productSubtotal,
      productDiscount,
      shipping,
      finalTotal,
    };
  }, [order]);

  if (state === "loading") return <Loading />;
  if (state === "not-login") return <NotLoggedin />;
  if (state === "not-found" || !order) return <OrderNotFound />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="space-y-8 rounded-3xl bg-white print:rounded-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:border-b print:pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-500 print:text-gray-500">
              3TL-Store
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              {isInvoice ? "Hóa đơn bán hàng" : "Chi tiết đơn hàng"}
            </h1>
            <p className="mt-2 text-gray-500">Mã đơn hàng {getOrderCode(order)}</p>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            {isInvoice ? (
              <>
                <Link
                  href={`/order-details/${order.orderid}`}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Xem chi tiết đơn
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  In hóa đơn
                </button>
              </>
            ) : (
              <Link
                href={`/invoice/${order.orderid}`}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Xem hóa đơn
              </Link>
            )}
          </div>
        </div>

        {!isInvoice && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Theo dõi trạng thái</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Trạng thái hiện tại: <span className="font-semibold text-gray-900">{statusLabel(order.orderstatus)}</span>
                </p>
              </div>
              {(order.trackingnumber || order.tracking_number) && (
                <p className="rounded-xl bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                  Mã vận đơn: {order.trackingnumber || order.tracking_number}
                </p>
              )}
            </div>
            <TrackingBar status={order.orderstatus} />
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="text-xl font-bold text-gray-900">Thông tin đơn hàng</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Ngày đặt hàng</p>
              <p className="font-semibold">{formatDateVN(order.createdat)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày giao hàng</p>
              <p className="font-semibold">{formatDateVN(order.deliveredat || order.delivered_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <p className="font-semibold">{statusLabel(order.orderstatus)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái thanh toán</p>
              <p className="font-semibold">{paymentStatusLabel(order.paymentstatus)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phương thức thanh toán</p>
              <p className="font-semibold">{paymentMethodLabel(order.paymentmethod)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Loại chứng từ</p>
              <p className="font-semibold">{isInvoice ? "Hóa đơn bán hàng" : "Phiếu chi tiết đơn hàng"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="text-xl font-bold text-gray-900">Khách hàng</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Tên</p>
              <p className="font-semibold">{order.username || "Chưa cập nhật"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{order.email || "Chưa cập nhật"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số điện thoại</p>
              <p className="font-semibold">{order.mobile_number || "Chưa cập nhật"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="text-xl font-bold text-gray-900">Địa chỉ</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-gray-500">Địa chỉ giao hàng</p>
              <p className="mt-2 font-semibold">{fullAddress(order.shippingaddress || emptyAddress)}</p>
              <a
                href={mapUrl(order.shippingaddress || emptyAddress)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 print:hidden"
              >
                Xem trên bản đồ
              </a>
            </div>
            <div>
              <p className="text-gray-500">Địa chỉ thanh toán</p>
              <p className="mt-2 font-semibold">{fullAddress(order.billingaddress || order.shippingaddress || emptyAddress)}</p>
              <a
                href={mapUrl(order.billingaddress || order.shippingaddress || emptyAddress)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 print:hidden"
              >
                Xem trên bản đồ
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm trong đơn</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                  <th className="px-4 py-3 text-center font-semibold">SL</th>
                  <th className="px-4 py-3 text-right font-semibold">Đơn giá</th>
                  <th className="px-4 py-3 text-right font-semibold">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => {
                  const unitPrice = getDiscountedUnitPrice(item);
                  const originalPrice = safeNumber(item.price);
                  const quantity = safeNumber(item.quantity || 1);
                  const lineTotal = unitPrice * quantity;

                  return (
                    <tr key={`${item.orderitemid || item.productid}-${item.title}`}>
                      <td className="px-4 py-4">
                        <div className="flex gap-4">
                          <img
                            src={safeImage(item.imglink)}
                            alt={item.imgalt || item.title}
                            className="h-16 w-20 rounded-xl object-cover print:hidden"
                            onError={(event) => {
                              event.currentTarget.src = "/images/no-image.png";
                            }}
                          />
                          <div>
                            <p className="font-bold text-gray-900">{item.title}</p>
                            {originalPrice > unitPrice && (
                              <p className="mt-1 text-xs text-gray-400 line-through">Giá gốc: {formatPrice(originalPrice)}</p>
                            )}
                            {item.gift_wrapping && (
                              <p className="mt-1 text-xs font-semibold text-pink-600">
                                Gói quà: {item.gift_wrap_style || order.gift_wrapping_type || "Có"}
                              </p>
                            )}
                            {(item.gift_message || order.gift_message) && (
                              <p className="mt-1 text-xs text-gray-500">
                                Lời nhắn: {item.gift_message || order.gift_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">{quantity}</td>
                      <td className="px-4 py-4 text-right font-semibold">{formatPrice(unitPrice)}</td>
                      <td className="px-4 py-4 text-right font-bold">{formatPrice(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1fr_360px] print:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none">
            <h2 className="text-xl font-bold text-gray-900">Ghi chú nghiệp vụ</h2>
            <div className="mt-4 space-y-2 text-sm leading-6 text-gray-600">
              <p>• Chi tiết đơn hàng dùng để theo dõi trạng thái, địa chỉ giao hàng và danh sách sản phẩm.</p>
              <p>• Hóa đơn dùng để in hoặc đối chiếu thanh toán với khách hàng.</p>
              <p>• Hệ thống không tính thuế riêng; tổng thanh toán gồm tiền hàng sau giảm và phí vận chuyển.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:shadow-none">
            <h2 className="text-xl font-bold text-gray-900">Tổng thanh toán</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Tạm tính theo giá gốc</span>
                <span className="font-semibold">{formatPrice(totals.originalSubtotal)}</span>
              </div>
              {totals.productDiscount > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Giảm giá sản phẩm</span>
                  <span className="font-semibold text-green-600">-{formatPrice(totals.productDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Tiền hàng sau giảm</span>
                <span className="font-semibold">{formatPrice(totals.productSubtotal)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="font-semibold">{formatPrice(totals.shipping)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between gap-4 text-xl font-bold text-gray-900">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(totals.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!isInvoice && (
          <div className="flex flex-wrap justify-end gap-3 print:hidden">
            {order.items[0]?.productid && (
              <Link
                href={`/checkout/${order.items[0].productid}?qty=1`}
                className="rounded-xl border border-pink-200 px-5 py-3 font-semibold text-pink-600 hover:bg-pink-50"
              >
                Mua lại sản phẩm đầu tiên
              </Link>
            )}
            <Link
              href="/orders"
              className="rounded-xl border px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Quay lại đơn hàng
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
