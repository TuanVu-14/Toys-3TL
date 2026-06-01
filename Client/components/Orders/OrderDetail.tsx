"use client"
import formatDate from '@/app/api/dateConvert';
import { orderDetailHandler } from '@/app/api/orders';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
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

const mapUrl = (address: Address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(address))}`;

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Preparing: 'Đang chuẩn bị hàng',
    Prepared: 'Đã chuẩn bị',
    Packed: 'Đã đóng gói',
    Shipping: 'Đang giao hàng',
    Shipped: 'Đang giao hàng',
    Delivered: 'Đã giao hàng',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy',
    Returned: 'Đã hoàn trả',
    Failed: 'Giao thất bại',
  };

  return labels[status] || status || 'Chưa cập nhật';
};

const paymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    'Payment on Delivery': 'Thanh toán khi nhận hàng',
    COD: 'Thanh toán khi nhận hàng',
    Online: 'Thanh toán trực tuyến',
  };

  return labels[method] || method || 'Chưa cập nhật';
};

const paymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    Pending: 'Chờ thanh toán',
    Paid: 'Đã thanh toán',
    Completed: 'Đã thanh toán',
    Failed: 'Thanh toán thất bại',
    Refunded: 'Đã hoàn tiền',
  };

  return labels[status] || status || 'Chưa cập nhật';
};

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
  const pathname = usePathname();
  const isInvoice = searchParams.get('invoice') === '1' || pathname?.startsWith('/invoice');

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
          if (['Payment on Delivery', 'COD'].includes(response.data.data.paymentmethod)) paymentCharge.current = 15000;
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
                {isInvoice ? 'Hóa đơn mua hàng' : 'Chi tiết đơn hàng'}
              </h1>
              <p className="mt-2 text-gray-500">Mã đơn hàng #{data.order_code}{data.orderid}</p>
            </div>
            {isInvoice && (
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-btnpurple px-4 py-2 text-sm font-semibold text-white print:hidden"
              >
                In hóa đơn
              </button>
            )}
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Thông tin đơn hàng</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-gray-500">Ngày đặt hàng</p><p className="font-semibold">{formatDate(data.createdat)}</p></div>
              <div><p className="text-sm text-gray-500">Ngày giao hàng</p><p className="font-semibold">{formatDate(data.deliveredat)}</p></div>
              <div><p className="text-sm text-gray-500">Trạng thái</p><p className="font-semibold">{statusLabel(data.orderstatus)}</p></div>
              <div><p className="text-sm text-gray-500">Trạng thái thanh toán</p><p className="font-semibold">{paymentStatusLabel(data.paymentstatus)}</p></div>
              <div><p className="text-sm text-gray-500">Phương thức thanh toán</p><p className="font-semibold">{paymentMethodLabel(data.paymentmethod)}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Khách hàng</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-gray-500">Tên</p><p className="font-semibold">{data.username}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-semibold">{data.email}</p></div>
              <div><p className="text-sm text-gray-500">Số điện thoại</p><p className="font-semibold">{data.mobile_number}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">Địa chỉ</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-gray-500">Địa chỉ giao hàng</p>
                <p className="mt-2 font-semibold">{fullAddress(data.shippingaddress)}</p>
                <a href={mapUrl(data.shippingaddress)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">Xem trên bản đồ</a>
              </div>
              <div>
                <p className="text-gray-500">Địa chỉ thanh toán</p>
                <p className="mt-2 font-semibold">{fullAddress(data.billingaddress)}</p>
                <a href={mapUrl(data.billingaddress)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">Xem trên bản đồ</a>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="grid gap-5 md:grid-cols-[120px_1fr_auto] md:items-center">
              <img src={data.imglink} alt={data.imgalt || data.title} className="h-20 w-32 rounded-lg object-cover" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
                {data.sizename && <p className="mt-1 text-sm"><span className="font-semibold">Kích cỡ:</span> {data.sizename}</p>}
                {data.colorname && <p className="mt-1 text-sm"><span className="font-semibold">Màu sắc:</span> {data.colorname}</p>}
                <p className="mt-1 text-gray-500">Số lượng: <span className="font-semibold text-gray-900">{data.quantity}</span></p>
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
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span className="font-bold">{formatPrice(subTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span className="font-bold">{formatPrice(shipping)}</span></div>
              {['Payment on Delivery', 'COD'].includes(data.paymentmethod) && (
                <div className="flex justify-between"><span className="text-gray-500">Phí xử lý thanh toán</span><span className="font-bold">{formatPrice(paymentCharge.current)}</span></div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="font-bold text-green-600">{formatPrice(discountAmount)}</span></div>
              )}
              <div className="border-t border-gray-200 pt-5 text-2xl font-bold">
                <div className="flex justify-between"><span>Tổng cộng</span><span>{formatPrice(totalAmount)}</span></div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
