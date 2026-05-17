import React, { useLayoutEffect, useRef, useState } from "react";
import userData from "@/controllers/userData";
import useAuth from "@/controllers/Authentication";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/Helpers/AccountDialog";
import Loading from "../Loading";
import {
  checkoutProductDataHandler,
  onlineCheckoutHandler,
  paymentMethodsHandler,
  paymentOnDeliveryHandler,
  PaymentMethod,
} from "@/app/api/paymentSystem";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface ProductDetails {
  title: string;
  price: string | number;
  discount: string | number;
  discountedprice?: string | number;
  sizename: string;
  colorname: string;
  imglink: string;
  imgalt: string;
  shippingcost: number;
}

const emptyProductDetails: ProductDetails = {
  title: "",
  price: 0,
  discount: 0,
  discountedprice: 0,
  sizename: "",
  colorname: "",
  imglink: "",
  imgalt: "",
  shippingcost: 30000,
};

const normalizePaymentName = (method?: PaymentMethod) => method?.name || "Thanh toán khi nhận hàng";

const methodDescription = (method: PaymentMethod) => {
  if (method.config?.description) return method.config.description;
  switch (method.type) {
    case "COD":
      return "Thanh toán khi nhận hàng";
    case "E-Wallet":
      return "Thanh toán qua ví điện tử";
    case "Gateway":
      return "Quét QR hoặc chuyển khoản qua cổng thanh toán";
    case "Card":
      return "ATM/Napas/Visa/Mastercard";
    case "BankTransfer":
      return "Chuyển khoản ngân hàng";
    default:
      return "Phương thức thanh toán online";
  }
};

const getLocalQrImage = (method: PaymentMethod) => {
  if (method.config?.qrImageUrl) return method.config.qrImageUrl;

  const provider = String(method.config?.provider || method.type).toLowerCase();
  if (provider.includes("momo")) return "/images/payment/momo-qr.png";
  if (provider.includes("vnpay")) return "/images/payment/vnpay-qr.png";
  if (method.type === "Card" || provider.includes("card")) return "/images/payment/card-qr.png";
  if (method.type === "BankTransfer" || provider.includes("bank")) return "/images/payment/bank-qr.png";

  return "/images/payment/online-payment-qr.png";
};

const buildPaymentQrContent = (method: PaymentMethod | undefined, amount: number, paymentCode: string) => {
  if (!method || method.type === "COD") return null;

  const storeName = method.config?.storeName || "TOYS 3TL";
  const bankAccount = method.config?.bankAccount || "1234567890";
  const bankAccountName = method.config?.bankAccountName || "TOYS 3TL";
  const transferNote = `${paymentCode} ${storeName}`;
  const isBankTransfer = method.type === "BankTransfer" || String(method.config?.provider || "").toLowerCase().includes("bank");

  return {
    imageUrl: getLocalQrImage(method),
    transferNote,
    bankAccount: isBankTransfer ? bankAccount : "",
    bankAccountName,
    instructions: isBankTransfer
      ? "Quét QR bằng app ngân hàng, nhập đúng số tiền và nội dung chuyển khoản rồi xác nhận."
      : `Mở ${method.name}, quét mã QR, nhập đúng số tiền và nội dung thanh toán rồi xác nhận.`,
  };
};

const Checkout = () => {
  const { appState, setLoggedIn } = useApp();
  const loggedIn = appState.loggedIn;
  const params = useParams<{ productID: string; colorID: string; sizeID: string }>();
  const router = useRouter();
  const { checkSession } = useAuth();
  const { grabUserData } = userData();

  const [loading, setLoading] = useState(true);
  const [dialogType, setDialogType] = useState<"addressRequired" | "defaultAddressRequired" | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number>(1);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [giftOptions, setGiftOptions] = useState({
    gift_wrapping: false,
    gift_wrap_style: "",
    gift_message_template: "",
    gift_message: "",
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const dataVar = useRef<ProductDetails>(emptyProductDetails);
  const data = dataVar.current;
  const found = useRef(false);
  const orderCreationError = useRef(false);
  const genUserData = useRef({ userID: 0, userName: "", email: "", mobile_number: "", dob: "" });
  const paymentCodeRef = useRef(`T3TL${Date.now()}`);
  const genUserAddress = useRef({
    addressID: 0,
    addressType: "HOME",
    contactNumber: 0,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    userName: "",
    is_default: true,
  });

  const originalPrice = Number(data.price || 0);
  const discountedPrice = Number(
    data.discountedprice || originalPrice - (originalPrice * Number(data.discount || 0)) / 100
  );
  const shipping = Number(data.shippingcost || 30000);
  const discountAmount = Math.max(originalPrice - discountedPrice, 0);
  const selectedPayment = paymentMethods.find((m) => m.id === selectedPaymentId);
  const paymentFee = Number(selectedPayment?.config?.fee || 0);
  const totalAmount = Math.max(discountedPrice + shipping + paymentFee, 0);
  const finalGiftMessage =
    giftOptions.gift_message.trim() !== "" ? giftOptions.gift_message : giftOptions.gift_message_template;
  const paymentContent = buildPaymentQrContent(selectedPayment, totalAmount, paymentCodeRef.current);

  async function dataRequest() {
    const response = await checkoutProductDataHandler({
      productID: params.productID,
      colorID: params.colorID,
      sizeID: params.sizeID,
    });
    if (response.status === 200) {
      dataVar.current = response.data;
      found.current = true;
      return;
    }
    router.push("/");
  }

  async function loadPaymentMethods() {
    const response = await paymentMethodsHandler();
    if (response.status === 200 && response.data.length > 0) {
      setPaymentMethods(response.data);
      const firstActive = response.data.find((method) => method.status);
      if (firstActive) setSelectedPaymentId(firstActive.id);
    }
  }

  async function sync() {
    await Promise.all([dataRequest(), loadPaymentMethods()]);
    if (!found.current) return;

    const sessionCheck = await checkSession();
    const userDataCheck = await grabUserData();

    if (sessionCheck?.success && userDataCheck?.success) {
      setLoggedIn(true);
      if (userDataCheck.addresses?.length === 0) {
        setDialogType("addressRequired");
        setLoading(false);
        return;
      }
      if (sessionCheck.data) genUserData.current = sessionCheck.data;
      userDataCheck.addresses?.forEach((each) => {
        if (each.is_default) genUserAddress.current = each;
      });
      if (genUserAddress.current.addressID === 0) {
        setDialogType("defaultAddressRequired");
        setLoading(false);
        return;
      }
      setLoading(false);
    } else {
      router.push("/sign-in");
    }
  }

  async function submitOrder(confirmedOnlinePayment = false) {
    if (!selectedPayment) return;

    if (selectedPayment.type !== "COD" && !confirmedOnlinePayment) {
      setPaymentDialogOpen(true);
      return;
    }

    setPaymentDialogOpen(false);
    setLoading(true);

    const payload = {
      userid: genUserData.current.userID,
      productid: params.productID,
      colorid: params.colorID,
      sizeid: params.sizeID,
      gift_wrapping: giftOptions.gift_wrapping,
      gift_wrap_style: giftOptions.gift_wrap_style,
      gift_message: finalGiftMessage,
    };

    const response =
      selectedPayment.type === "COD"
        ? await paymentOnDeliveryHandler(payload)
        : await onlineCheckoutHandler({ ...payload, paymentMethod: normalizePaymentName(selectedPayment) });

    if (response.status === 200) {
      router.push(`/order-confirmation/${response.data.orderid}`);
      return;
    }

    orderCreationError.current = true;
    setLoading(false);
  }

  useLayoutEffect(() => {
    sync();
  }, []);

  const DialogBox = ({ type }: { type: "addressRequired" | "defaultAddressRequired" }) => (
    <Dialog open={dialogType === type} onClose={() => setDialogType(null)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {type === "addressRequired" ? "Address Required" : "Default Address Required"}
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-600">
            {type === "addressRequired"
              ? "Please add an address to proceed with checkout."
              : "Please add a default address or set an existing address as default."}
          </p>
          <button
            onClick={() => router.push("/account-settings")}
            className="mt-4 rounded-lg bg-primary-700 px-4 py-2 text-white"
          >
            Go to Account Settings
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );

  const PaymentQrDialog = () => (
    <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-bold text-gray-900">
            Thanh toán bằng {selectedPayment?.name}
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-600">
            Quét mã QR bên dưới, thanh toán đúng số tiền rồi bấm “Tôi đã thanh toán” để tạo đơn hàng.
          </p>

          {paymentContent && (
            <div className="mt-5 rounded-lg border border-gray-200 p-4 text-center">
              <img src={paymentContent.imageUrl} alt={`QR ${selectedPayment?.name}`} className="mx-auto h-64 w-64 object-contain" />
              <div className="mt-4 space-y-2 text-left text-sm text-gray-700">
                <p><span className="font-semibold">Số tiền:</span> {formatPrice(totalAmount)}</p>
                <p><span className="font-semibold">Nội dung:</span> {paymentContent.transferNote}</p>
                {paymentContent.bankAccount && (
                  <p><span className="font-semibold">Tài khoản:</span> {paymentContent.bankAccount} - {paymentContent.bankAccountName}</p>
                )}
                <p className="text-gray-500">{paymentContent.instructions}</p>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentDialogOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => submitOrder(true)}
              className="flex-1 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
            >
              Tôi đã thanh toán
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <DialogBox type="addressRequired" />
      <DialogBox type="defaultAddressRequired" />
      <PaymentQrDialog />
      {loading && <Loading />}

      <form id="informational-form" onSubmit={(e) => { e.preventDefault(); submitOrder(false); }} className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <ol className="mb-8 flex items-center gap-6 text-sm font-medium text-gray-500">
          <li className="text-primary-700">1. Product</li>
          <li className="text-primary-700">2. Checkout</li>
          <li>3. Order summary</li>
        </ol>

        <div className="lg:flex lg:items-start lg:gap-12 xl:gap-16">
          <div className="min-w-0 flex-1 space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Delivery Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Your name", genUserData.current.userName],
                  ["Your email*", genUserData.current.email],
                  ["Country*", genUserAddress.current.country],
                  ["City*", genUserAddress.current.city],
                  ["Phone Number*", genUserData.current.mobile_number],
                  ["Pin Code", genUserAddress.current.postalCode],
                  ["Address 1", genUserAddress.current.addressLine1],
                  ["Address 2", genUserAddress.current.addressLine2],
                ].map(([label, value]) => (
                  <label key={label} className="block text-sm font-medium text-gray-900">
                    {label}
                    <input
                      readOnly
                      value={String(value || "")}
                      className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Payment</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`cursor-pointer rounded-lg border p-4 ${selectedPaymentId === method.id ? "border-primary-600 bg-primary-50" : "border-gray-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        checked={selectedPaymentId === method.id}
                        onChange={() => setSelectedPaymentId(method.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{methodDescription(method)}</p>
                        {Number(method.config?.fee || 0) > 0 && (
                          <p className="mt-1 text-sm text-gray-500">+{formatPrice(Number(method.config?.fee))} phí xử lý</p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 sm:flex sm:items-center sm:gap-6">
              <img src={data.imglink} alt={data.imgalt} className="h-20 w-24 object-contain" />
              <div className="mt-4 flex-1 sm:mt-0">
                <h4 className="text-lg font-semibold text-gray-900">{data.title}</h4>
                <p className="text-sm text-gray-600">Size: {data.sizename}</p>
                <p className="text-sm text-gray-600">Color: {data.colorname}</p>
                <p className="text-sm text-gray-600">Quantity: 1</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatPrice(discountedPrice)}</p>
                {discountAmount > 0 && <p className="text-sm text-gray-500 line-through">{formatPrice(originalPrice)}</p>}
              </div>
            </div>

            <div className="rounded-lg border border-pink-100 bg-pink-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">🎁 Gift Options</h3>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={giftOptions.gift_wrapping}
                  onChange={(e) => setGiftOptions({ ...giftOptions, gift_wrapping: e.target.checked })}
                />
                Add Gift Wrapping
              </label>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select
                  value={giftOptions.gift_wrap_style}
                  onChange={(e) => setGiftOptions({ ...giftOptions, gift_wrap_style: e.target.value })}
                  className="rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                >
                  <option value="">Select a wrapping style</option>
                  <option>Classic Red</option>
                  <option>Birthday Theme</option>
                  <option>Christmas Theme</option>
                  <option>Baby Blue</option>
                  <option>Princess Pink</option>
                </select>
                <select
                  value={giftOptions.gift_message_template}
                  onChange={(e) => setGiftOptions({ ...giftOptions, gift_message_template: e.target.value })}
                  className="rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                >
                  <option value="">Select a message template</option>
                  <option>Happy Birthday! Wishing you joy and creativity!</option>
                  <option>A special gift just for you!</option>
                  <option>Merry Christmas!</option>
                </select>
              </div>
              <input
                value={giftOptions.gift_message}
                onChange={(e) => setGiftOptions({ ...giftOptions, gift_message: e.target.value })}
                placeholder="Personal Message"
                className="mt-4 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
              />
            </div>
          </div>

          <aside className="mt-8 w-full space-y-6 lg:mt-0 lg:max-w-md">
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Order summary</h3>
              <div className="divide-y divide-gray-200">
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(discountedPrice)}</span>
                </div>
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Shipping Charge</span>
                  <span className="font-medium text-gray-900">{formatPrice(shipping)}</span>
                </div>
                {paymentFee > 0 && (
                  <div className="flex justify-between py-3 text-gray-600">
                    <span>Payment Processing Charge</span>
                    <span className="font-medium text-gray-900">{formatPrice(paymentFee)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Discount</span>
                  <span className="font-medium text-green-600">{formatPrice(discountAmount)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>
              <button
                disabled={!loggedIn || loading || !selectedPayment}
                type="submit"
                className="mt-6 w-full rounded-lg bg-primary-700 px-5 py-3 text-sm font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Place Order
              </button>
              {orderCreationError.current && <p className="mt-3 text-sm text-red-600">Không tạo được đơn hàng. Vui lòng thử lại.</p>}
            </div>
          </aside>
        </div>
      </form>
    </section>
  );
};

export default Checkout;
