import React, { useEffect, useRef, useState } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import formatDate from '@/app/api/dateConvert';
import { ordersHandler } from '@/app/api/orders';
import Link from 'next/link';
import Loading from '../Loading';
import NotLoggedin from './NotLoggedin';
import NoOrders from './NoOrders';
import { formatPrice } from '@/features/UIUpdates/CartWishlist';

interface OrderDataflow {
  orderid: number;
  totalamount: number | string;
  orderstatus: string;
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

const getLinePrice = (order: OrderDataflow) => {
  if (order.discountedprice !== undefined) return order.discountedprice;
  if (order.productprice !== undefined) return order.productprice;
  if (order.price !== undefined) {
    const price = Number(order.price || 0);
    const discount = Number(order.discount || 0);
    return Math.round(price * (100 - discount) / 100);
  }
  return order.totalamount;
};

const Order = () => {
  const loggedIn = useRef(true);
  const found = useRef(false);
  const dataVar = useRef<OrderDataflow[]>([]);
  const data = dataVar.current;
  const [loading, setLoading] = useState(true);

  async function orderData() {
    const tempData = await ordersHandler();
    switch (tempData.status) {
      case 200:
        if (tempData.data.data !== undefined) {
          dataVar.current = tempData.data.data;
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

  useEffect(() => {
    orderData();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order history</h1>
      <p className="mt-2 text-sm text-gray-500">
        Check the status of recent orders, manage returns, and discover similar products.
      </p>

      {loading && <Loading />}
      {loggedIn.current && !loading && data.length === 0 && <NoOrders />}
      {!loggedIn.current && !loading && <NotLoggedin />}

      <div className="mt-8 space-y-6">
        {data.map((order) => (
          <div key={order.orderid} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-5 md:grid-cols-4 md:items-center">
              <div>
                <p className="font-semibold text-gray-900">Order number</p>
                <p className="mt-1 text-sm text-gray-600">{order.order_code}{order.orderid}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Date placed</p>
                <p className="mt-1 text-sm text-gray-600">{formatDate(order.createdat)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Total amount</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(order.totalamount)}</p>
              </div>
              <div className="flex gap-3 md:justify-end">
                <Link
                  href={`/order-detail/${order.orderid}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-btnpurple hover:text-white"
                >
                  View Order
                </Link>
                <Link
                  href={`/order-detail/${order.orderid}?invoice=1`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-btnpurple hover:text-white"
                >
                  View Invoice
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 py-5 md:grid-cols-[240px_1fr_auto] md:items-start">
              <Link href={`/product/${order.productid}`}>
                <img
                  src={order.imglink}
                  alt={order.imgalt || order.title}
                  className="h-24 w-full rounded-lg object-cover md:w-60"
                />
              </Link>
              <div>
                <Link href={`/product/${order.productid}`} className="font-semibold text-gray-900 hover:text-btnpurple">
                  {order.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{order.description}</p>
              </div>
              <p className="text-right font-semibold text-gray-900">{formatPrice(getLinePrice(order))}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-white">
                  <ShoppingCartIcon className="h-5 w-5" />
                </span>
                {order.orderstatus === 'Delivered'
                  ? `Delivered on ${formatDate(order.deliveredat)}`
                  : `Coming on ${formatDate(order.deliveredat)}`}
              </div>
              <div className="flex items-center divide-x divide-gray-200 text-sm font-medium">
                <Link href={`/product/${order.productid}`} className="px-4 text-indigo-600 hover:text-indigo-500">
                  View product
                </Link>
                <Link href={`/product/${order.productid}`} className="px-4 text-indigo-600 hover:text-indigo-500">
                  Buy again
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Order;
