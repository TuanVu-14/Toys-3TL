import React, { useEffect, useRef, useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { cartCardCheckoutHandler } from "@/app/api/paymentSystem";

export default function CartCheckoutForm({
  orderID,
  userID,
  gift_wrapping = false,
  gift_wrap_style = "",
  gift_message = "",
}: {
  orderID: number;
  userID: number;
  gift_wrapping?: boolean;
  gift_wrap_style?: string;
  gift_message?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const orderid = useRef(0);
  const orderCreationError = useRef(false);
  const [message, setMessage] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function createOrder(paymentid: string, paymentStatus: string) {
    setIsLoading(true);

    const createOrderResult = await cartCardCheckoutHandler({
      userID,
      paymentid,
      paymentstatus: paymentStatus,
      paymentMethod: "Thanh toán online",
      gift_wrapping,
      gift_wrap_style,
      gift_message,
    });

    switch (createOrderResult.status) {
      case 200:
        orderid.current = createOrderResult.data.orderid;
        setIsLoading(false);
        router.push(`/cart-confirmation/${createOrderResult.status}`);
        break;
      default:
        orderCreationError.current = true;
        setIsLoading(false);
        break;
    }
  }

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => {
      if (!paymentIntent) return;

      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        error.message && setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }

      setIsLoading(false);
      return;
    }

    if (paymentIntent) {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          await createOrder(paymentIntent.id, "Succeeded");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          await createOrder(paymentIntent.id, "Processing");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    }

    setIsLoading(false);
  };

  const paymentElementOptions: { layout: "tabs" } = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />

      <button
        disabled={isLoading || !stripe || !elements}
        type="submit"
        id="submit"
        className="flex mt-5 w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
      >
        <span>
          {isLoading ? (
            <div className="relative">
              <div>
                <div className="drop-shadow-custom-xl rounded-xl w-[120px] mx-auto">
                  <div className="border-gray-300 my-auto mx-auto h-8 w-8 animate-spin rounded-full border-8 border-t-blue-600" />
                </div>
              </div>
            </div>
          ) : (
            "Pay now"
          )}
        </span>
      </button>

      {message && (
        <div id="payment-message">
          <p className="text-red-500 ml-16 font-bold">{message}</p>
        </div>
      )}
    </form>
  );
}
