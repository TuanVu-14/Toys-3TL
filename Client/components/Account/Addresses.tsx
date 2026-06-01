import { userAddressDefaultHandler } from '@/app/api/userUpdate';
import { useAppDispatch } from '@/app/hooks';
import { setAddress } from '@/features/UIUpdates/UserAccount';
import { PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline'
import React from 'react'

interface Address {
  addressID:number;
  addressType:string;
  contactNumber:number;
  addressLine1:string
  addressLine2:string
  city:string;
  state:string;
  country:string;
  postalCode:string;
  userName:string;
  is_default:boolean;
}

const addressTypeLabel = (type: string) => type === 'WORK' ? 'Cơ quan' : 'Nhà riêng';

const getFullAddress = (address: Address) =>
  [address.addressLine1, address.addressLine2, address.city, address.state, address.country, address.postalCode]
    .filter(Boolean)
    .join(', ');

const getMapUrl = (address: Address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress(address))}`;

const Addresses = ({Component,setdialogType,setselectedAddress,setLoading,userID}:{Component:Address[],setdialogType:React.Dispatch<React.SetStateAction<string | null>>,setselectedAddress:React.Dispatch<React.SetStateAction<Address>>,setLoading:React.Dispatch<React.SetStateAction<boolean>>,userID:number}) => {
  const dispatch = useAppDispatch();
  async function changeDefault(addressID:number,userID:number){
    setLoading(true);
    const response = await userAddressDefaultHandler(addressID,userID);
    switch (response.status) {
      case 200:
        dispatch(setAddress(Component.map((each)=>each.addressID === addressID ? { ...each, is_default: true } : { ...each, is_default: false })))
        setLoading(false);
        break;
      default:
        setdialogType('defaultAddressError');
        setLoading(false);
        break;
    }
  }
  return (
    <div className='h-full w-full overflow-auto px-5 py-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-rose-500'>Sổ địa chỉ</p>
          <h1 className='text-2xl font-bold text-slate-900'>Quản lý địa chỉ</h1>
          <p className='mt-1 text-sm text-slate-500'>Chọn địa chỉ mặc định để thanh toán nhanh hơn.</p>
        </div>
        <button onClick={()=>setdialogType('newaddress')} className='rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600'>+ Thêm địa chỉ</button>
      </div>

      {Component.length === 0 ? (
        <div className='mt-8 rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 px-6 py-10 text-center'>
          <MapPinIcon className='mx-auto h-12 w-12 text-rose-400'/>
          <h2 className='mt-3 text-lg font-bold text-slate-900'>Chưa có địa chỉ giao hàng</h2>
          <p className='mt-2 text-sm text-slate-500'>Thêm địa chỉ để đặt hàng và theo dõi giao hàng thuận tiện hơn.</p>
        </div>
      ) : (
        <div className='mt-5 grid gap-4'>
          {Component.map((each)=>(
            <div key={each.addressID} className='rounded-3xl border border-rose-100 bg-white p-5 shadow-sm transition hover:shadow-md'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500'><MapPinIcon className='h-6 w-6'/></div>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600'>{addressTypeLabel(each.addressType)}</span>
                      {each.is_default && <span className='rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white'>Mặc định</span>}
                    </div>
                    <h3 className='mt-3 font-bold text-slate-900'>{each.userName} <span className='font-normal text-slate-400'>•</span> {each.contactNumber}</h3>
                    <p className='mt-1 text-sm leading-6 text-slate-600'>
                      {each.addressLine1}{each.addressLine2 ? `, ${each.addressLine2}` : ''}<br/>
                      {each.city ? `${each.city}, ` : ''}{each.state}, {each.country}{each.postalCode ? ` - ${each.postalCode}` : ''}
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 gap-2'>
                  <button onClick={()=>{setdialogType('address');setselectedAddress(each)}} className='rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50' title='Sửa địa chỉ'><PencilIcon className='h-5 w-5'/></button>
                  <button onClick={()=>{setdialogType('deleteaddress');setselectedAddress(each)}} className='rounded-2xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100' title='Xóa địa chỉ'><TrashIcon className='h-5 w-5'/></button>
                </div>
              </div>
              <div className='mt-4 flex flex-wrap gap-2'>
                {!each.is_default && <button onClick={()=>changeDefault(each.addressID,userID)} className='rounded-2xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50'>Đặt làm địa chỉ mặc định</button>}
                <a
                  href={getMapUrl(each)}
                  target='_blank'
                  rel='noreferrer'
                  className='rounded-2xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50'
                >
                  Xem trên bản đồ
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Addresses
