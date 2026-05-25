"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircleIcon,
  CreditCardIcon,
  GiftIcon,
  MapPinIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import userData from "@/controllers/userData";
import useAuth from "@/controllers/Authentication";
import Loading from "../Loading";
import {
  checkoutProductDataHandler,
  checkoutCartProductDataHandler,
  onlineCheckoutHandler,
  cartOnlineCheckoutHandler,
  paymentMethodsHandler,
  paymentOnDeliveryHandler,
  cartPaymentOnDeliveryHandler,
  PaymentMethod,
} from "@/app/api/paymentSystem";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import { applyCouponHandler } from "@/app/api/couponsApi";
import { useAppSelector } from "@/app/hooks";

interface ProductCheckoutData {
  title: string;
  price: number;
  discount: number;
  discountedprice: number;
  imglink?: string;
  imgalt?: string;
  shippingcost: number;
  quantity?: number;
  sizename?: string;
  colorname?: string;
}

interface CurrentUser {
  userID?: number;
  userid?: number;
}

interface Address {
  addressID?: number;
  addressid?: number;
  addressType?: string;
  address_type?: string;
  contactNumber?: string | number;
  contactnumber?: string | number;
  addressLine1?: string;
  addressline1?: string;
  addressLine2?: string;
  addressline2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  postalcode?: string;
  userName?: string;
  username?: string;
  is_default?: boolean;
}

function getAddressID(address?: Address | null) {
  return Number(address?.addressID ?? address?.addressid ?? 0);
}

function getAddressValue(
  address: Address | null | undefined,
  camelKey: keyof Address,
  lowerKey: keyof Address,
) {
  return String(address?.[camelKey] ?? address?.[lowerKey] ?? "").trim();
}

function formatAddress(address?: Address | null) {
  if (!address) return "";
  return [
    getAddressValue(address, "addressLine1", "addressline1"),
    getAddressValue(address, "addressLine2", "addressline2"),
    address.city,
    address.state,
    address.country,
    getAddressValue(address, "postalCode", "postalcode"),
  ]
    .filter(Boolean)
    .join(", ");
}

type CheckoutResponse =
  | {
      status: number;
      data: { orderid?: number; error?: string; message?: string };
    }
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
  if (
    value.includes("atm") ||
    value.includes("napa") ||
    value.includes("visa") ||
    value.includes("master")
  ) {
    return "CARD";
  }
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
  return (
    response.data?.error ||
    response.data?.message ||
    "Không tạo được đơn hàng. Vui lòng thử lại."
  );
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

function demoPaymentInfo(
  method?: PaymentMethod,
  totalAmount?: number,
  code?: string,
) {
  const kind = getPaymentKind(method);
  if (!method || kind === "COD") return null;

  const amount = formatPrice(Number(totalAmount || 0));
  const content = `3TL-${code || "ORDER"}`;

  if (kind === "BANK") {
    return (
      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold">Thông tin chuyển khoản demo</p>
        <p>Ngân hàng: MB Bank</p>
        <p>Số tài khoản: 0123456789</p>
        <p>Chủ tài khoản: 3TL Store</p>
        <p>Số tiền: {amount}</p>
        <p>Nội dung: {content}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
      <p className="font-semibold">{paymentBadge(method)}</p>
      <p>
        Vui lòng sử dụng ứng dụng thanh toán demo của chúng tôi để quét mã QR hoặc nhập thông tin thanh toán với số tiền và nội dung như sau:
      </p>
      <p>Số tiền: {amount}</p>
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
  const defaultAccount = useAppSelector(
    (state) => state.userState.defaultAccount,
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductCheckoutData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null,
  );
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftWrapStyle, setGiftWrapStyle] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountPercent?: number;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const userRef = useRef<CurrentUser | null>(null);
  const productID = String(params.productID || "");
  const isCartCheckout = productID === "cart";
  const quantity = Math.max(1, Number(searchParams.get("qty") || 1));
  const selectedCartItemIDs = String(searchParams.get("items") || "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const selectedPayment = useMemo(
    () =>
      paymentMethods.find((method) => method.id === selectedPaymentId) ||
      paymentMethods[0],
    [paymentMethods, selectedPaymentId],
  );

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) => getAddressID(address) === selectedAddressId,
      ) ||
      addresses[0] ||
      null,
    [addresses, selectedAddressId],
  );

  const itemAmount = products.reduce((sum, item) => {
    const itemQty = isCartCheckout
      ? Math.max(1, Number(item.quantity || 1))
      : quantity;
    return sum + Number(item.discountedprice || 0) * itemQty;
  }, 0);

  const shippingCost = products.reduce((sum, item) => {
    const itemQty = isCartCheckout
      ? Math.max(1, Number(item.quantity || 1))
      : 1;
    return sum + Number(item.shippingcost || 0) * itemQty;
  }, 0);

  const paymentFee = getPaymentKind(selectedPayment) === "COD" ? COD_FEE : 0;
  const couponDiscount = Math.min(
    Number(appliedCoupon?.discountAmount || 0),
    itemAmount,
  );
  const totalAmount = Math.max(
    0,
    itemAmount + shippingCost + paymentFee - couponDiscount,
  );
  const firstProduct = products[0];

  useEffect(() => {
    const userID = getAccountID(defaultAccount);
    if (userID) userRef.current = { userID, userid: userID };
  }, [defaultAccount]);

  useEffect(() => {
    async function sync() {
      setLoading(true);
      setError("");

      const sessionResponse = await checkSession();
      if (!sessionResponse?.success) {
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      const sessionUser = sessionResponse.data as CurrentUser | undefined;
      const sessionUserID = getAccountID(sessionUser);
      const reduxUserID = getAccountID(defaultAccount);
      const userID = sessionUserID || reduxUserID;

      if (!userID) {
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      userRef.current = { userID, userid: userID };

      const [paymentResponse, userDataResponse] = await Promise.all([
        paymentMethodsHandler(),
        grabUserData(),
      ]);

      if (isCartCheckout) {
        const cartResponse = await checkoutCartProductDataHandler(
          userID,
          selectedCartItemIDs,
        );
        if (
          cartResponse.status !== 200 ||
          !Array.isArray(cartResponse.data?.products)
        ) {
          setLoading(false);
          router.push("/");
          return;
        }
        setProducts(cartResponse.data.products);
      } else {
        const productResponse = await checkoutProductDataHandler({ productID });
        if (productResponse.status !== 200) {
          setLoading(false);
          router.push("/");
          return;
        }
        setProducts([productResponse.data]);
      }

      if (!userDataResponse?.success) {
        setLoading(false);
        router.push("/sign-in");
        return;
      }

      const userAddresses = Array.isArray(userDataResponse.addresses)
        ? userDataResponse.addresses
        : [];
      setAddresses(userAddresses);

      const defaultAddress =
        userAddresses.find((address: Address) => address.is_default) ||
        userAddresses[0];
      setSelectedAddressId(
        defaultAddress ? getAddressID(defaultAddress) : null,
      );

      const methods =
        paymentResponse.status === 200 && Array.isArray(paymentResponse.data)
          ? paymentResponse.data.filter(
              (method: PaymentMethod) => method.status,
            )
          : [];

      setPaymentMethods(methods);
      setSelectedPaymentId(methods[0]?.id || null);
      setLoading(false);
    }

    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productID, searchParams]);

  async function applyCoupon() {
    const userid =
      getAccountID(defaultAccount) || getAccountID(userRef.current);
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponMessage("Vui lòng nhập mã giảm giá.");
      return;
    }

    if (!userid) {
      setCouponMessage("Bạn cần đăng nhập để áp dụng mã giảm giá.");
      return;
    }

    if (itemAmount <= 0) {
      setCouponMessage("Không có sản phẩm để áp dụng mã.");
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");

    const response = await applyCouponHandler({
      code,
      userID: userid,
      amount: itemAmount,
    });

    if (response.status === 200 && response.data?.valid) {
      setAppliedCoupon({
        code: response.data.code,
        discountAmount: Number(response.data.discountAmount || 0),
        discountPercent: Number(response.data.discountPercent || 0),
      });
      setCouponMessage(response.data.message || "Đã áp dụng mã giảm giá.");
    } else {
      setAppliedCoupon(null);
      setCouponMessage(
        response.data?.error ||
          response.data?.message ||
          "Mã giảm giá không hợp lệ.",
      );
    }

    setCouponLoading(false);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("Đã bỏ mã giảm giá.");
  }

  async function submitOrder() {
    if (!firstProduct || !selectedPayment) return;

    const userid =
      getAccountID(defaultAccount) || getAccountID(userRef.current);
    if (!selectedAddress) {
      setError("Vui lòng chọn địa chỉ giao hàng trước khi đặt hàng.");
      return;
    }

    if (!userid) {
      setError(
        "Không lấy được thông tin tài khoản. Vui lòng tải lại trang hoặc đăng nhập lại.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    const commonGiftPayload = {
      gift_wrapping: giftWrapping,
      gift_wrap_style: giftWrapStyle,
      gift_message: giftMessage,
      coupon_code: appliedCoupon?.code || null,
      coupon_discount: couponDiscount,
      address_id: getAddressID(selectedAddress),
      shipping_address: formatAddress(selectedAddress),
    };

    const response = isCartCheckout
      ? getPaymentKind(selectedPayment) === "COD"
        ? await cartPaymentOnDeliveryHandler({
            userID: userid,
            cartItemIDs: selectedCartItemIDs,
            ...commonGiftPayload,
          })
        : await cartOnlineCheckoutHandler({
            userID: userid,
            cartItemIDs: selectedCartItemIDs,
            paymentMethod: normalizePaymentName(selectedPayment),
            ...commonGiftPayload,
          })
      : getPaymentKind(selectedPayment) === "COD"
        ? await paymentOnDeliveryHandler({
            userid,
            productid: productID,
            quantity,
            ...commonGiftPayload,
          })
        : await onlineCheckoutHandler({
            userid,
            productid: productID,
            quantity,
            paymentMethod: normalizePaymentName(selectedPayment),
            ...commonGiftPayload,
          });

    if (response.status === 200) {
      const orderID =
        response.data?.orderid ||
        response.data?.orderID ||
        response.data?.orderId;
      if (orderID) {
        router.push(`/order-confirmation/${orderID}`);
        return;
      }
      router.push("/order-confirmation");
      return;
    }

    setError(getCheckoutError(response as CheckoutResponse));
    setSubmitting(false);
  }

  if (loading) return <Loading />;

  if (!products.length) {
    return (
      <div className="p-10 text-center text-gray-600">
        Không tìm thấy sản phẩm.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-8 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-gray-500">Trang chủ / Thanh toán</p>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Thanh toán đơn hàng
        </h1>
        <p className="mt-3 text-gray-500">
          Kiểm tra sản phẩm, chọn phương thức thanh toán và xác nhận đơn hàng.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Sản phẩm đặt mua
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {products.map((product, index) => {
                  const itemQty = isCartCheckout
                    ? Math.max(1, Number(product.quantity || 1))
                    : quantity;
                  return (
                    <div
                      key={`${product.title}-${index}`}
                      className="flex gap-5 rounded-2xl bg-gray-50 p-5"
                    >
                      <img
                        src={product.imglink || "/no-image.png"}
                        alt={product.imgalt || product.title}
                        className="h-28 w-28 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {product.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Số lượng: {itemQty}
                        </p>
                        {product.sizename && (
                          <p className="text-sm text-gray-500">
                            Size: {product.sizename}
                          </p>
                        )}
                        {product.colorname && (
                          <p className="text-sm text-gray-500">
                            Màu: {product.colorname}
                          </p>
                        )}
                        <p className="mt-3 text-xl font-bold text-red-500">
                          {formatPrice(
                            Number(product.discountedprice || 0) * itemQty,
                          )}
                        </p>
                        {Number(product.discount || 0) > 0 && (
                          <p className="mt-2 text-sm text-gray-400">
                            Đã giảm {Number(product.discount)}% từ giá gốc{" "}
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-6 w-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Địa chỉ giao hàng
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/account-settings")}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Quản lý địa chỉ
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  Bạn chưa có địa chỉ giao hàng. Hãy thêm địa chỉ trong phần
                  Setting trước khi đặt hàng.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {addresses.map((address) => {
                    const addressID = getAddressID(address);
                    const active = selectedAddressId === addressID;
                    const receiverName =
                      getAddressValue(address, "userName", "username") ||
                      "Người nhận";
                    const phone = String(
                      address.contactNumber ?? address.contactnumber ?? "",
                    );
                    const type =
                      address.addressType || address.address_type || "HOME";
                    return (
                      <button
                        type="button"
                        key={addressID || formatAddress(address)}
                        onClick={() => setSelectedAddressId(addressID)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-blue-400 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                              active
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-900">
                                {receiverName}
                              </span>
                              {phone && (
                                <span className="text-sm text-gray-500">
                                  {phone}
                                </span>
                              )}
                              {address.is_default && (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                  Mặc định
                                </span>
                              )}
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                                {type}
                              </span>
                            </span>
                            <span className="mt-2 block text-sm leading-6 text-gray-600">
                              {formatAddress(address)}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <GiftIcon className="h-6 w-6 text-pink-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Dịch vụ gói quà
                </h2>
              </div>

              <label className="mt-6 flex gap-4 rounded-2xl border p-4">
                <input
                  type="checkbox"
                  checked={giftWrapping}
                  onChange={(e) => setGiftWrapping(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-gray-900">
                    Gói quà cho sản phẩm
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    Phù hợp khi mua đồ chơi làm quà sinh nhật, Noel hoặc Trung
                    thu.
                  </span>
                </span>
              </label>

              {giftWrapping && (
                <div className="mt-4 space-y-3">
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
            </section>
          </div>

          <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <TruckIcon className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Tóm tắt đơn hàng
              </h2>
            </div>

            <div className="mt-6 space-y-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold">{formatPrice(itemAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span className="font-semibold">
                  {formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí COD</span>
                <span className="font-semibold">{formatPrice(paymentFee)}</span>
              </div>
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({appliedCoupon.code})</span>
                  <span className="font-semibold">
                    -{formatPrice(couponDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-red-500">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {selectedAddress && (
              <div className="mt-6 rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Giao đến</p>
                <p className="mt-2">
                  {getAddressValue(selectedAddress, "userName", "username") ||
                    "Người nhận"}
                  {String(
                    selectedAddress.contactNumber ??
                      selectedAddress.contactnumber ??
                      "",
                  ) &&
                    ` - ${String(selectedAddress.contactNumber ?? selectedAddress.contactnumber ?? "")}`}
                </p>
                <p className="mt-1 leading-6 text-gray-600">
                  {formatAddress(selectedAddress)}
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-4">
              <h3 className="font-semibold text-gray-900">Mã giảm giá</h3>
              <p className="mt-1 text-xs text-gray-500">
                Nhập mã do Admin hoặc nhân viên bán hàng tạo trong Sales
                Management.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponMessage("");
                  }}
                  placeholder="Nhập mã giảm giá"
                  disabled={couponLoading || !!appliedCoupon}
                  className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:bg-gray-100"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="rounded-xl border px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Bỏ mã
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-gray-300"
                  >
                    {couponLoading ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                )}
              </div>
              {couponMessage && (
                <p
                  className={`mt-2 text-sm ${appliedCoupon ? "text-green-600" : "text-red-500"}`}
                >
                  {couponMessage}
                </p>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <CreditCardIcon className="h-6 w-6 text-blue-500" />
              <h3 className="font-semibold text-gray-900">
                Phương thức thanh toán
              </h3>
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
                      active
                        ? "border-yellow-400 bg-yellow-50 shadow-sm"
                        : "border-gray-200 hover:border-yellow-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? "border-yellow-500 bg-yellow-400"
                            : "border-gray-300"
                        }`}
                      >
                        {active && (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-gray-900">
                          {method.name}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                          {paymentDescription(method)}
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                          {paymentBadge(method)}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {demoPaymentInfo(
              selectedPayment,
              totalAmount,
              isCartCheckout ? "CART" : productID,
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={submitting || !selectedPayment || !selectedAddress}
              onClick={submitOrder}
              className="mt-6 h-12 w-full rounded-2xl bg-yellow-400 font-bold text-gray-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-200"
            >
              {submitting ? "Đang tạo đơn..." : "PLACE ORDER"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
