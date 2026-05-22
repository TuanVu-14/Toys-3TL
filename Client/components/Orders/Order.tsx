import React, { useEffect, useRef, useState } from 'react';
import { ShoppingCartIcon, CheckCircleIcon, TruckIcon, ArchiveBoxIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
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

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  Pending:   { label: 'Chờ xác nhận',              color: 'text-amber-700',   bg: 'bg-amber-100' },
  Confirmed: { label: 'Đã xác nhận',               color: 'text-blue-700',    bg: 'bg-blue-100' },
  Preparing: { label: 'Đang chuẩn bị hàng',        color: 'text-indigo-700',  bg: 'bg-indigo-100' },
  Shipping:  { label: 'Đang giao hàng',             color: 'text-violet-700',  bg: 'bg-violet-100' },
  Completed: { label: 'Giao thành công',            color: 'text-emerald-700', bg: 'bg-emerald-100' },
  Delivered: { label: 'Đã giao',                   color: 'text-emerald-700', bg: 'bg-emerald-100' },
  Cancelled: { label: 'Đã hủy',                    color: 'text-rose-700',    bg: 'bg-rose-100' },
  Returned:  { label: 'Hoàn trả',                  color: 'text-orange-700',  bg: 'bg-orange-100' },
  Failed:    { label: 'Giao thất bại',             color: 'text-red-700',     bg: 'bg-red-100' },
  // legacy
  Shipped:   { label: 'Đang giao hàng',             color: 'text-violet-700',  bg: 'bg-violet-100' },
  Prepared:  { label: 'Đã chuẩn bị',              color: 'text-indigo-700',  bg: 'bg-indigo-100' },
};

const STEPS = [
  { key: 'Pending',   label: 'Chờ xác nhận' },
  { key: 'Confirmed', label: 'Xác nhận' },
  { key: 'Preparing', label: 'Chuẩn bị' },
  { key: 'Shipping',  label: 'Vận chuyển' },
  { key: 'Completed', label: 'Hoàn thành' },
];

const STEP_INDEX: Record<string, number> = {
  Pending: 0, Confirmed: 1, Preparing: 2,
  Prepared: 2, Packed: 2,
  Shipping: 3, Shipped: 3,
  Delivered: 4, Completed: 4,
};

function getStatus(order: OrderDataflow) {
  return order.order_status || order.orderstatus || 'Pending';
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function TrackingBar({ status }: { status: string }) {
  const isCancelled = ['Cancelled', 'Returned', 'Failed'].includes(status);
  if (isCancelled) {
    const cfg = STATUS_MAP[status] || STATUS_MAP.Cancelled;
    return (
      <div className={`mt-3 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
        <XCircleIcon className="h-5 w-5 shrink-0" />
        {cfg.label}
      </div>
    );
  }
  const currentStep = STEP_INDEX[status] ?? 0;
  return (
    <div className="mt-3">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all
                  ${done ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}
                  ${active ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`mt-1 hidden text-center text-[10px] leading-tight sm:block ${active ? 'font-bold text-indigo-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 rounded-full transition-all ${i < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
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

  useEffect(() => { orderData(); }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lịch sử đơn hàng</h1>
      <p className="mt-2 text-sm text-gray-500">Kiểm tra trạng thái đơn hàng, quản lý hoàn trả và theo dõi vận chuyển.</p>

      {loading && <Loading />}
      {loggedIn.current && !loading && data.length === 0 && <NoOrders />}
      {!loggedIn.current && !loading && <NotLoggedin />}

      <div className="mt-8 space-y-6">
        {data.map((order) => {
          const status = getStatus(order);
          const isDelivered = ['Completed', 'Delivered'].includes(status);
          return (
            <div key={order.orderid} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Header row */}
              <div className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-5 sm:grid-cols-2 md:grid-cols-4 md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Mã đơn</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{order.order_code || '#'}{order.orderid}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ngày đặt</p>
                  <p className="mt-1 text-sm text-gray-600">{formatDate(order.createdat)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tổng tiền</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(order.totalamount)}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link href={`/order-detail/${order.orderid}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-indigo-600 hover:text-white">
                    Xem đơn
                  </Link>
                  <Link href={`/order-detail/${order.orderid}?invoice=1`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-indigo-600 hover:text-white">
                    Hoá đơn
                  </Link>
                </div>
              </div>

              {/* Product row */}
              <div className="grid grid-cols-1 gap-5 py-5 md:grid-cols-[180px_1fr_auto] md:items-start">
                <Link href={`/product/${order.productid}`}>
                  <img src={order.imglink} alt={order.imgalt || order.title} className="h-24 w-full rounded-lg object-cover md:w-44" />
                </Link>
                <div>
                  <Link href={`/product/${order.productid}`} className="font-semibold text-gray-900 hover:text-indigo-600">{order.title}</Link>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{order.description}</p>
                </div>
                <p className="text-right font-semibold text-gray-900">{formatPrice(getLinePrice(order))}</p>
              </div>

              {/* Status + tracking */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    {isDelivered && order.deliveredat && (
                      <span className="text-xs text-gray-500">· Giao ngày {formatDate(order.deliveredat)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Link href={`/product/${order.productid}`} className="text-indigo-600 hover:text-indigo-500">Xem sản phẩm</Link>
                    <span className="text-gray-300">|</span>
                    <Link href={`/product/${order.productid}`} className="text-indigo-600 hover:text-indigo-500">Mua lại</Link>
                  </div>
                </div>
                <TrackingBar status={status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Order;
