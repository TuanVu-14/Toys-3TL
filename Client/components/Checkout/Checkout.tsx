"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon, CreditCardIcon, GiftIcon, TruckIcon } from "@heroicons/react/24/outline";
import userData from "@/controllers/userData";
import useAuth from "@/controllers/Authentication";
import Loading from "../Loading";
import {
  checkoutProductDataHandler,
  onlineCheckoutHandler,
  paymentMethodsHandler,
  paymentOnDeliveryHandler,
  PaymentMethod,
} from "@/app/api/paymentSystem";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import { useAppSelector } from "@/app/hooks";

interface ProductCheckoutData {
  title: string;
  price: number;
  discount: number;
  discountedprice: number;
  imglink?: string;
  imgalt?: string;
  shippingcost: number;
}

interface CurrentUser {
  userID?: number;
  userid?: number;
}

type CheckoutResponse =
  | { status: number; data: { orderid?: number; error?: string; message?: string } }
  | { status: number; error: string; data?: undefined };

const COD_FEE = 15000;

function getAccountID(account: unknown) {
  return Number(
    (account as { userID?: number; userid?: number })?.userID ??
      (account as { userid?: number })?.userid ??
      0,
  );
}

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase();
}

function getPaymentKind(method?: PaymentMethod) {
  const raw = `${method?.type || ""} ${method?.name || ""}`;
  const value = normalizeText(raw);

  if (value.includes("cod") || value.includes("nhận hàng")) return "COD";
  if (value.includes("momo")) return "MOMO";
  if (value.includes("vnpay")) return "VNPAY";
  if (value.includes("atm") || value.includes("napa") || value.includes("visa") || value.includes("master")) return "CARD";
  if (value.includes("chuyển khoản") || value.includes("bank")) return "BANK";
  return "ONLINE";
}

function normalizePaymentName(method: PaymentMethod) {
  const kind = getPaymentKind(method);

  if (kind === "COD") return "Thanh toán khi nhận hàng";
  if (kind === "MOMO") return "Ví Momo";
  if (kind === "VNPAY") return "VNPay";
  if (kind === "CARD") return "Thẻ ATM/Napas/Visa/Mastercard";
  if (kind === "BANK") return "Chuyển khoản ngân hàng";

  return method.name || "Thanh toán online";
}

function getCheckoutError(response: CheckoutResponse) {
  if ("error" in response && response.error) return response.error;
  return response.data?.error || response.data?.message || "Không tạo được đơn hàng. Vui lòng thử lại.";
}

function paymentDescription(method: PaymentMethod) {
  const kind = getPaymentKind(method);

  switch (kind) {
    case "COD":
      return "Thanh toán tiền mặt khi nhận hàng. Phù hợp nếu bạn muốn kiểm tra hàng trước.";
    case "MOMO":
      return "Tạo đơn hàng và quét QR Momo demo để hoàn tất thanh toán.";
    case "VNPAY":
      return "Tạo đơn hàng và thanh toán qua cổng VNPay demo.";
    case "CARD":
      return "Thanh toán demo bằng thẻ ATM/Napas/Visa/Mastercard.";
    case "BANK":
      return "Tạo đơn hàng và chuyển khoản theo thông tin của cửa hàng.";
    default:
      return "Thanh toán online demo, không gọi Stripe hay cổng thật.";
  }
}

function paymentBadge(method: PaymentMethod) {
  const kind = getPaymentKind(method);

  if (kind === "COD") return "+15.000đ phí xử lý COD";
  if (kind === "MOMO") return "QR Momo demo";
  if (kind === "VNPAY") return "Cổng VNPay demo";
  if (kind === "CARD") return "Thanh toán thẻ demo";
  if (kind === "BANK") return "Chuyển khoản theo nội dung";
  return "Online demo";
}

function demoPaymentInfo(method?: PaymentMethod, totalAmount?: number, productID?: string) {
  const kind = getPaymentKind(method);

  if (!method || kind === "COD") {
    return null;
  }

  const amount = formatPrice(Number(totalAmount || 0));
  const content = `3TL-${productID || "ORDER"}`;

  if (kind === "BANK") {
    return (
      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-bold">Thông tin chuyển khoản demo</p>
        <div className="mt-2 grid gap-1">
          <p>Ngân hàng: MB Bank</p>
          <p>Số tài khoản: 0123456789</p>
          <p>Chủ tài khoản: 3TL Store</p>
          <p>Số tiền: {amount}</p>
          <p>Nội dung: {content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
      <p className="font-bold">{paymentBadge(method)}</p>
      <p className="mt-1">
        Đây là thanh toán online demo cho đồ án. Sau khi bấm PLACE ORDER, hệ thống tạo đơn và ghi nhận phương thức
        thanh toán, không gọi Stripe nên không còn lỗi key/gateway.
      </p>
      <p className="mt-2">Số tiền: {amount}</p>
      <p>Nội dung: {content}</p>
    </div>
  );
}

const Checkout = () => {
  const router = useRouter();
  const params = useParams<{ productID: string }>();
  const searchParams = useSearchParams();
  const { checkSession } = useAuth();
  const { grabUserData } = userData();
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<ProductCheckoutData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftWrapStyle, setGiftWrapStyle] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const userRef = useRef<CurrentUser | null>(null);

  const quantity = Math.max(1, Number(searchParams.get("qty") || 1));

  const selectedPayment = useMemo(
    () => paymentMethods.find((method) => method.id === selectedPaymentId) || paymentMethods[0],
    [paymentMethods, selectedPaymentId],
  );

  const itemAmount = Number(product?.discountedprice || 0) * quantity;
  const shippingCost = Number(product?.shippingcost || 0);
  const paymentFee = getPaymentKind(selectedPayment) === "COD" ? COD_FEE : 0;
  const totalAmount = itemAmount + shippingCost + paymentFee;

  useEffect(() => {
    const userID = getAccountID(defaultAccount);

    if (userID) {
      userRef.current = { userID, userid: userID };
    }
  }, [defaultAccount]);

  useEffect(() => {
    async function sync() {
      setLoading(true);
      setError("");

      const [productResponse, paymentResponse, sessionResponse] = await Promise.all([
        checkoutProductDataHandler({ productID: params.productID }),
        paymentMethodsHandler(),
        checkSession(),
      ]);

      if (productResponse.status !== 200) {
        setLoading(false);
        router.push("/");
        return;
      }

      if (!sessionResponse?.success) {
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      await grabUserData();

      setProduct(productResponse.data);

      const methods =
        paymentResponse.status === 200 && Array.isArray(paymentResponse.data)
          ? paymentResponse.data.filter((method: PaymentMethod) => method.status)
          : [];

      setPaymentMethods(methods);
      setSelectedPaymentId(methods[0]?.id || null);
      setLoading(false);
    }

    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.productID]);

  async function submitOrder() {
    if (!product || !selectedPayment) return;

    const userid = getAccountID(defaultAccount) || Number(userRef.current?.userID || userRef.current?.userid || 0);

    if (!userid) {
      setError("Không lấy được thông tin tài khoản. Vui lòng tải lại trang hoặc đăng nhập lại.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      userid,
      productid: params.productID,
      quantity,
      gift_wrapping: giftWrapping,
      gift_wrap_style: giftWrapStyle,
      gift_message: giftMessage,
    };

    const response =
      getPaymentKind(selectedPayment) === "COD"
        ? await paymentOnDeliveryHandler(payload)
        : await onlineCheckoutHandler({
            ...payload,
            paymentMethod: normalizePaymentName(selectedPayment),
          });

    if (response.status === 200 && response.data?.orderid) {
      router.push(`/order-confirmation/${response.data.orderid}`);
      return;
    }

    setError(getCheckoutError(response as CheckoutResponse));
    setSubmitting(false);
  }

  if (loading) return <Loading />;

  if (!product) {
    return <div className="mx-auto max-w-3xl p-8 text-center text-red-500">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <main className="mx-auto w-[92%] max-w-6xl py-10">
      <div className="mb-8">
        <p className="text-sm text-gray-500">Trang chủ / Thanh toán</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Thanh toán đơn hàng</h1>
        <p className="mt-2 text-gray-500">Kiểm tra sản phẩm, chọn phương thức thanh toán và xác nhận đơn hàng.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_430px]">
        <section className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Sản phẩm đặt mua</h2>
            </div>

            <div className="mt-6 flex gap-5 rounded-2xl bg-gray-50 p-4">
              <img
                src={product.imglink || "/no-image.png"}
                alt={product.imgalt || product.title}
                className="h-32 w-32 rounded-2xl border bg-white object-contain"
              />

              <div className="flex flex-1 flex-col justify-center">
                <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
                <p className="mt-1 text-sm text-gray-500">Số lượng: {quantity}</p>
                <p className="mt-3 text-xl font-bold text-red-500">{formatPrice(product.discountedprice)}</p>

                {Number(product.discount || 0) > 0 && (
                  <p className="mt-1 text-sm text-gray-400">
                    Đã giảm {Number(product.discount)}% từ giá gốc {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <GiftIcon className="h-6 w-6 text-pink-500" />
              <h2 className="text-xl font-semibold text-gray-900">Dịch vụ gói quà</h2>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={giftWrapping}
                onChange={(e) => setGiftWrapping(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-gray-900">Gói quà cho sản phẩm</span>
                <span className="text-sm text-gray-500">Phù hợp khi mua đồ chơi làm quà sinh nhật, Noel hoặc Trung thu.</span>
              </span>
            </label>

            {giftWrapping && (
              <div className="mt-4 grid gap-3">
                <input
                  value={giftWrapStyle}
                  onChange={(e) => setGiftWrapStyle(e.target.value)}
                  placeholder="Ví dụ: Gói giấy xanh, nơ đỏ"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-yellow-400"
                />
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Lời nhắn tặng quà"
                  rows={4}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TruckIcon className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Tóm tắt đơn hàng</h2>
          </div>

          <div className="mt-6 space-y-4 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span className="font-semibold">{formatPrice(itemAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí giao hàng</span>
              <span className="font-semibold">{formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí COD</span>
              <span className="font-semibold">{formatPrice(paymentFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-4 text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-red-500">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <CreditCardIcon className="h-6 w-6 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Phương thức thanh toán</h3>
          </div>

          <div className="mt-4 space-y-3">
            {paymentMethods.map((method) => {
              const active = selectedPaymentId === method.id;

              return (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setSelectedPaymentId(method.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active ? "border-yellow-400 bg-yellow-50 shadow-sm" : "border-gray-200 hover:border-yellow-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                        active ? "border-yellow-500 bg-yellow-400" : "border-gray-300"
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>

                    <span className="flex-1">
                      <span className="block font-bold text-gray-900">{method.name}</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">{paymentDescription(method)}</span>
                      <span className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        {paymentBadge(method)}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {demoPaymentInfo(selectedPayment, totalAmount, params.productID)}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={submitting || !selectedPayment}
            onClick={submitOrder}
            className="mt-6 h-12 w-full rounded-2xl bg-yellow-400 font-bold text-gray-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {submitting ? "Đang tạo đơn..." : "PLACE ORDER"}
          </button>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
