import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  ClockIcon,
  ShoppingCartIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import formatDate from "@/app/api/dateConvert";
import { cancelOrderHandler, createOrderReviewHandler, ordersHandler } from "@/app/api/orders";
import Loading from "../Loading";
import NotLoggedin from "./NotLoggedin";
import NoOrders from "./NoOrders";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

interface OrderDataflow {
  orderid: number;
  totalamount: number | string;
  orderstatus: string;
  order_status?: string;
  delivery_status?: string;
  createdat: string;
  deliveredat: string;
  title: string;
  imglink: string;
  imgalt: string;
  description: string;
  discount?: number | string;
  price?: number | string;
  discountedprice?: number | string;
  productprice?: number | string;
  order_code: string;
  productid: string | number;
}

type StatusConfig = {
  label: string;
  color: string;
  bg: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  Pending: { label: "Chờ xác nhận", color: "text-amber-700", bg: "bg-amber-100" },
  Confirmed: { label: "Đã xác nhận", color: "text-blue-700", bg: "bg-blue-100" },
  Preparing: { label: "Đang chuẩn bị hàng", color: "text-indigo-700", bg: "bg-indigo-100" },
  Shipping: { label: "Đang giao hàng", color: "text-violet-700", bg: "bg-violet-100" },
  Completed: { label: "Giao thành công", color: "text-emerald-700", bg: "bg-emerald-100" },
  Delivered: { label: "Đã giao", color: "text-emerald-700", bg: "bg-emerald-100" },
  Cancelled: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-100" },
  Returned: { label: "Hoàn trả", color: "text-orange-700", bg: "bg-orange-100" },
  Failed: { label: "Giao thất bại", color: "text-red-700", bg: "bg-red-100" },
  Shipped: { label: "Đang giao hàng", color: "text-violet-700", bg: "bg-violet-100" },
  Prepared: { label: "Đã chuẩn bị", color: "text-indigo-700", bg: "bg-indigo-100" },
  Packed: { label: "Đã chuẩn bị", color: "text-indigo-700", bg: "bg-indigo-100" },
};

const STEPS = [
  { key: "Pending", label: "Chờ xác nhận" },
  { key: "Confirmed", label: "Xác nhận" },
  { key: "Preparing", label: "Chuẩn bị" },
  { key: "Giao hàng", label: "Vận chuyển" },
  { key: "Completed", label: "Hoàn thành" },
];

const STEP_INDEX: Record<string, number> = {
  Pending: 0,
  Confirmed: 1,
  Preparing: 2,
  Prepared: 2,
  Packed: 2,
  Shipping: 3,
  Shipped: 3,
  Delivered: 4,
  Completed: 4,
};

function getStatus(order: OrderDataflow) {
  return order.order_status || order.orderstatus || "Pending";
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function TrackingBar({ status }: { status: string }) {
  const isCancelled = ["Cancelled", "Returned", "Failed"].includes(status);

  if (isCancelled) {
    const cfg = STATUS_MAP[status] || STATUS_MAP.Cancelled;
    return (
      <div className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 ${cfg.bg} ${cfg.color}`}>
        <XCircleIcon className="h-6 w-6" />
        <span className="text-sm font-semibold">{cfg.label}</span>
      </div>
    );
  }

  const currentStep = STEP_INDEX[status] ?? 0;

  return (
    <div className="mt-5 flex items-center justify-between gap-2">
      {STEPS.map((step, index) => {
        const done = index <= currentStep;
        const active = index === currentStep;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  done ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"
                } ${active ? "ring-4 ring-indigo-100" : ""}`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={`text-xs ${done ? "font-semibold text-indigo-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${index < currentStep ? "bg-indigo-300" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const getLinePrice = (order: OrderDataflow) => {
  if (order.discountedprice !== undefined) return order.discountedprice;
  if (order.productprice !== undefined) return order.productprice;
  if (order.price !== undefined) {
    const price = Number(order.price || 0);
    const discount = Number(order.discount || 0);
    return Math.round((price * (100 - discount)) / 100);
  }
  return order.totalamount;
};

const Order = () => {
  const loggedIn = useRef(true);
  const found = useRef(false);
  const [data, setData] = useState<OrderDataflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingID, setCancellingID] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [reviewingOrder, setReviewingOrder] = useState<OrderDataflow | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  async function orderData() {
    setLoading(true);
    const tempData = await ordersHandler();

    switch (tempData.status) {
      case 200:
        if (tempData.data.data !== undefined) {
          setData(tempData.data.data);
          found.current = true;
        }
        setLoading(false);
        break;
      case 250:
        loggedIn.current = false;
        setLoading(false);
        break;
      default:
        setLoading(false);
        break;
    }
  }

  async function cancelOrder(orderID: number) {
    const confirmCancel = window.confirm(
      "Bạn chắc chắn muốn hủy đơn hàng này? Chỉ đơn hàng chờ xác nhận mới được hủy.",
    );

    if (!confirmCancel) return;

    setCancellingID(orderID);
    setMessage("");

    const response = await cancelOrderHandler(orderID);

    if (response.status === 200) {
      setData((current) =>
        current.map((order) =>
          order.orderid === orderID
            ? { ...order, orderstatus: "Cancelled", order_status: "Cancelled" }
            : order,
        ),
      );
      setMessage("Đã hủy đơn hàng thành công.");
    } else {
      setMessage(
        response.data?.error ||
          response.data?.message ||
          response.error ||
          "Không hủy được đơn hàng. Vui lòng thử lại.",
      );
    }

    setCancellingID(null);
  }

  async function submitReview() {
    if (!reviewingOrder) return;

    const title = reviewTitle.trim();
    const comment = reviewComment.trim();

    if (title.length < 2 || comment.length < 2) {
      setMessage("Vui lòng nhập tiêu đề và nội dung đánh giá.");
      return;
    }

    setSubmittingReview(true);
    setMessage("");

    const response = await createOrderReviewHandler({
      orderID: reviewingOrder.orderid,
      productID: reviewingOrder.productid,
      rating: reviewRating,
      title,
      comment,
    });

    if (response.status === 200) {
      setMessage("Đã gửi đánh giá sản phẩm thành công.");
      setReviewingOrder(null);
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");
    } else {
      setMessage(
        response.data?.error ||
          response.data?.message ||
          response.error ||
          "Không gửi được đánh giá. Vui lòng thử lại.",
      );
    }

    setSubmittingReview(false);
  }

  useEffect(() => {
    orderData();
  }, []);

  return (
    <main className="min-h-screen bg-white px-4 py-16 sm:px-8 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
        <p className="mt-3 text-gray-500">
          Kiểm tra trạng thái đơn hàng, quản lý hoàn trả và theo dõi vận chuyển.
        </p>

        {message && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {message}
          </div>
        )}

        {loading && <Loading />}
        {loggedIn.current && !loading && data.length === 0 && <NoOrders />}
        {!loggedIn.current && !loading && <NotLoggedin />}

        <div className="mt-8 space-y-6">
          {data.map((order) => {
            const status = getStatus(order);
            const isDelivered = ["Completed", "Delivered"].includes(status);
            const canCancel = status === "Pending";

            return (
              <article key={order.orderid} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="grid gap-4 border-b pb-5 text-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">Mã đơn</p>
                    <p className="mt-1 font-bold text-gray-900">
                      {order.order_code || "#"}{order.orderid}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">Ngày đặt</p>
                    <p className="mt-1 text-gray-700">{formatDate(order.createdat)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">Tổng tiền</p>
                    <p className="mt-1 font-bold text-gray-900">{formatPrice(order.totalamount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <StatusBadge status={status} />
                    <Link
                      href={`/order-details/${order.orderid}`}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Xem đơn
                    </Link>
                    <Link
                      href={`/invoice/${order.orderid}`}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Hoá đơn
                    </Link>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row">
                  <img
                    src={order.imglink || "/no-image.png"}
                    alt={order.imgalt || order.title}
                    className="h-28 w-full rounded-2xl object-cover sm:w-44"
                  />
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{order.title}</h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                          {order.description}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(getLinePrice(order))}
                      </p>
                    </div>

                    <TrackingBar status={status} />

                    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 text-sm font-semibold">
                      {isDelivered && order.deliveredat && (
                        <span className="mr-auto text-gray-500">
                          Giao ngày {formatDate(order.deliveredat)}
                        </span>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.orderid)}
                          disabled={cancellingID === order.orderid}
                          className="rounded-xl border border-red-200 px-4 py-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingID === order.orderid ? "Đang hủy..." : "Hủy đơn hàng"}
                        </button>
                      )}

                      {isDelivered && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingOrder(order);
                            setReviewRating(5);
                            setReviewTitle("");
                            setReviewComment("");
                            setMessage("");
                          }}
                          className="rounded-xl border border-yellow-200 px-4 py-2 text-yellow-700 transition hover:bg-yellow-50"
                        >
                          Đánh giá sản phẩm
                        </button>
                      )}

                      <Link href={`/product/${order.productid}`} className="text-indigo-600 hover:text-indigo-700">
                        Xem sản phẩm
                      </Link>
                      <Link href={`/checkout/${order.productid}?qty=1`} className="text-indigo-600 hover:text-indigo-700">
                        Mua lại
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {reviewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
                <p className="mt-1 text-sm text-gray-500">{reviewingOrder.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="rounded-full px-3 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-gray-700">Số sao</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-3xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Tiêu đề đánh giá
              <input
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                maxLength={50}
                placeholder="Ví dụ: Sản phẩm rất tốt"
                className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-yellow-400"
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Nội dung đánh giá
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Nhập cảm nhận của bạn về sản phẩm..."
                className="mt-2 w-full resize-none rounded-2xl border px-4 py-3 outline-none focus:border-yellow-400"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="rounded-xl border px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={submitReview}
                disabled={submittingReview}
                className="rounded-xl bg-yellow-400 px-5 py-2.5 font-semibold text-gray-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Order;
