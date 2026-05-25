"use client"
import formatDate from '@/app/api/dateConvert';
import { orderDetailHandler } from '@/app/api/orders';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Loading from '../Loading';
import OrderNotFound from './OrderNotFound';
import NotLoggedin from './NotLoggedin';
import { formatPrice } from '@/features/UIUpdates/CartWishlist';

interface Address {
  username: string;
  contactnumber: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  country: string;
  postalcode: string;
}

interface Order {
  orderid: number;
  createdat: string;
  deliveredat: string;
  orderstatus: string;
  paymentstatus: string;
  paymentmethod: string;
  username: string;
  email: string;
  mobile_number: string;
  title: string;
  discount: string;
  discountedprice?: string;
  price: string;
  shippingcost: string;
  quantity: number;
  imglink: string;
  imgalt: string;
  billingaddress: Address;
  addressid: number;
  colorid: number | null;
  sizeid: number | null;
  productid: number;
  order_code: string;
  totalamount: string;
  shippingaddress: Address;
  colorname: string | null;
  sizename: string | null;
}

const emptyAddress: Address = {
  username: '',
  contactnumber: '',
  addressline1: '',
  addressline2: '',
  city: '',
  state: '',
  country: '',
  postalcode: '',
};

const emptyOrder: Order = {
  orderid: 0,
  createdat: '',
  deliveredat: '',
  orderstatus: '',
  paymentstatus: '',
  paymentmethod: '',
  username: '',
  email: '',
  mobile_number: '',
  title: '',
  discount: '0',
  discountedprice: '0',
  price: '0',
  shippingcost: '0',
  quantity: 0,
  imglink: '',
  imgalt: '',
  billingaddress: emptyAddress,
  addressid: 0,
  colorid: null,
  sizeid: null,
  productid: 0,
  order_code: '',
  totalamount: '0',
  shippingaddress: emptyAddress,
  colorname: null,
  sizename: null,
};

const fullAddress = (address: Address) =>
  [address.addressline1, address.addressline2, address.city, address.state, address.postalcode, address.country]
    .filter(Boolean)
    .join(', ');

const OrderDetail = () => {
  const dataVar = useRef(emptyOrder);
  const data = dataVar.current;
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const found = useRef(false);
  const dataChecked = useRef(false);
  const loggedIn = useRef(true);
  const paymentCharge = useRef(0);
  const params = useParams<{ orderid: string }>();
  const searchParams = useSearchParams();
  const isInvoice = searchParams.get('invoice') === '1';

  const originalPrice = Number(data.price || 0);
  const discountPercent = Number(data.discount || 0);
  const quantity = Number(data.quantity || 1);
  const shipping = Number(data.shippingcost || 0);
  const discountedUnitPrice = Number(
    data.discountedprice || Math.round(originalPrice * (100 - discountPercent) / 100),
  );
  const subTotal = discountedUnitPrice * quantity;
  const discountAmount = Math.max((originalPrice - discountedUnitPrice) * quantity, 0);
  const totalAmount = subTotal + shipping + Number(paymentCharge.current);

  async function fetchData() {
    const response = await orderDetailHandler(params.orderid);
    switch (response.status) {
      case 200:
        if (response.data.data !== undefined) {
          dataVar.current = response.data.data;
          found.current = true;
          dataChecked.current = true;
          if (response.data.data.paymentmethod === 'Payment on Delivery') paymentCharge.current = 15000;
          setLoading(false);
        }
        break;
      case 404:
        dataChecked.current = true;
        setLoading(false);
        break;
      case 500:
        loggedIn.current = false;
        setLoading(false);
        break;
    }
  }

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {loading && <Loading />}
      {!loggedIn.current && <NotLoggedin />}
      {dataChecked.current && !found.current && loggedIn.current && <OrderNotFound />}

      {dataChecked.current && found.current && loggedIn.current && (
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isInvoice ? 'Invoice' : 'Your Order Details'}
              </h1>
              <p className="mt-2 text-gray-500">Order #{data.order_code}{data.orderid}</p>
            </div>
            {isInvoice && (
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-btnpurple px-4 py-2 text-sm font-semibold text-white print:hidden"
              >
                Print invoice
              </button>
            )}
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Order Info</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-gray-500">Order Date</p><p className="font-semibold">{formatDate(data.createdat)}</p></div>
              <div><p className="text-sm text-gray-500">Delivery Date</p><p className="font-semibold">{formatDate(data.deliveredat)}</p></div>
              <div><p className="text-sm text-gray-500">Status</p><p className="font-semibold">{data.orderstatus}</p></div>
              <div><p className="text-sm text-gray-500">Payment Status</p><p className="font-semibold">{data.paymentstatus}</p></div>
              <div><p className="text-sm text-gray-500">Payment Method</p><p className="font-semibold">{data.paymentmethod}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Customer</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-gray-500">Name</p><p className="font-semibold">{data.username}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-semibold">{data.email}</p></div>
              <div><p className="text-sm text-gray-500">Phone Number</p><p className="font-semibold">{data.mobile_number}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Address</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div><p className="text-gray-500">Shipping Address</p><p className="mt-2 font-semibold">{fullAddress(data.shippingaddress)}</p></div>
              <div><p className="text-gray-500">Billing Address</p><p className="mt-2 font-semibold">{fullAddress(data.billingaddress)}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-[120px_1fr_auto] md:items-center">
              <img src={data.imglink} alt={data.imgalt || data.title} className="h-20 w-32 rounded-lg object-cover" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
                {data.sizename && <p className="mt-1 text-sm"><span className="font-semibold">Size:</span> {data.sizename}</p>}
                {data.colorname && <p className="mt-1 text-sm"><span className="font-semibold">Color:</span> {data.colorname}</p>}
                <p className="mt-1 text-gray-500">Quantity: <span className="font-semibold text-gray-900">{data.quantity}</span></p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatPrice(discountedUnitPrice)}</p>
                {originalPrice > discountedUnitPrice && (
                  <p className="text-gray-400 line-through">{formatPrice(originalPrice)}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="space-y-4 text-lg">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">{formatPrice(subTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping Charge</span><span className="font-bold">{formatPrice(shipping)}</span></div>
              {data.paymentmethod === 'Payment on Delivery' && (
                <div className="flex justify-between"><span className="text-gray-500">Payment Processing Charge</span><span className="font-bold">{formatPrice(paymentCharge.current)}</span></div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-bold text-green-600">{formatPrice(discountAmount)}</span></div>
              )}
              <div className="border-t border-gray-200 pt-5 text-2xl font-bold">
                <div className="flex justify-between"><span>Total</span><span>{formatPrice(totalAmount)}</span></div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
