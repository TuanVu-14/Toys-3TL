import React from 'react'
import formatDate from '@/app/api/dateConvert';
import { formatPrice } from '@/features/UIUpdates/CartWishlist';

interface UserCoupon {
  couponid: number;
  code: string;
  description: string;
  discountpercentage: number;
  maxdiscountamount: number;
  minpurchaseamount: number;
  validuntil: string;
}

const Coupons = ({Component}:{Component:UserCoupon[]}) => {
  return (
    <div className='w-full h-full overflow-auto px-5 py-6'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm font-semibold text-rose-500'>Ưu đãi của tôi</p>
          <h1 className='text-2xl font-bold text-slate-900'>Mã giảm giá hiện có</h1>
          <p className='mt-1 text-sm text-slate-500'>Dùng mã trong bước thanh toán để được giảm giá.</p>
        </div>
      </div>

      {Component.length === 0 ? (
        <div className='mt-8 rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 px-6 py-10 text-center'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm'>🎁</div>
          <h2 className='mt-4 text-lg font-bold text-slate-900'>Bạn chưa có mã giảm giá</h2>
          <p className='mx-auto mt-2 max-w-sm text-sm text-slate-500'>Khi có khuyến mãi, mã sinh nhật hoặc ưu đãi thành viên, mã sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className='mt-5 grid gap-4'>
          {Component.map((each)=>(
            <div key={each.couponid} className='overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm'>
              <div className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <div className='inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600'>Giảm {Math.round(each.discountpercentage)}%</div>
                  <h3 className='mt-3 text-lg font-bold text-slate-900'>{each.code}</h3>
                  <p className='mt-1 text-sm text-slate-500'>{each.description || 'Mã ưu đãi dành riêng cho bạn'}</p>
                </div>
                <div className='rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:min-w-[220px]'>
                  <p>Giảm tối đa: <span className='font-bold text-slate-900'>{formatPrice(Number(each.maxdiscountamount || 0))}</span></p>
                  <p>Đơn tối thiểu: <span className='font-bold text-slate-900'>{formatPrice(Number(each.minpurchaseamount || 0))}</span></p>
                  <p>Hạn dùng: <span className='font-bold text-slate-900'>{formatDate(each.validuntil)}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Coupons
