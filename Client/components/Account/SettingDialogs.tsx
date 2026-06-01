import React from 'react'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {userAddressAddHandler, userAddressDeleteHandler, userAddressUpdateHandler, userUpdateHandler} from '@/app/api/userUpdate';
import { useAppDispatch } from '@/app/hooks';
import { addAddress, removeAddress, setAddress, setDefaultAccount } from '@/features/UIUpdates/UserAccount';

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
interface Account{
    userID:number;
    userName:string;
    email:string;
    mobile_number:string;
    dob:string;
    role:string;
}

const fieldClass = 'mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:bg-white';
const labelClass = 'text-left text-sm font-semibold text-slate-700';

const profileLabels: Record<string, string> = {
  name: 'họ và tên',
  'date of birth': 'ngày sinh',
  email: 'email',
  number: 'số điện thoại',
  password: 'mật khẩu',
};

const SettingDialogs = ({addresses,dialogType,setdialogType,menuType,userID,setLoading,selectedAddress,defaultAccount}:{addresses:Address[],dialogType:string | null,setdialogType:React.Dispatch<React.SetStateAction<string | null>>,menuType:string,userID:number,setLoading:React.Dispatch<React.SetStateAction<boolean>>,selectedAddress: Address,setselectedAddress:React.Dispatch<React.SetStateAction<Address>>,defaultAccount:Account}) => {
    const dispatch = useAppDispatch();

    async function formSubmitProfile(e:any,Dialog:string|null,userID:number){
        e.preventDefault();
        setdialogType(null);
        setLoading(true);
        const updateValue = e.target.updateValue.value
        try {
          switch (Dialog) {
              case 'name':
                  await userUpdateHandler({ userID,userName:updateValue, email:false, mobile_number:false, dob:false,password:false }).then((res)=>
                      res.status===200 && dispatch(setDefaultAccount({ ...defaultAccount, userID, userName: updateValue })))
                  break;
              case 'date of birth':
                  await userUpdateHandler({ userID,userName:false, email:false, mobile_number:false, dob:updateValue,password:false  }).then((res)=>
                      res.status===200 && dispatch(setDefaultAccount({ ...defaultAccount, userID, dob: updateValue })))
                  break;
              case 'email':
                  await userUpdateHandler({ userID,userName:false, email:updateValue, mobile_number:false, dob:false,password:false  }).then((res)=>
                      res.status===200 && dispatch(setDefaultAccount({ ...defaultAccount, userID, email: updateValue })))
                  break;
              case 'number':
                  await userUpdateHandler({ userID,userName:false, email:false, mobile_number:updateValue, dob:false,password:false  }).then((res)=>
                      res.status===200 && dispatch(setDefaultAccount({ ...defaultAccount, userID, mobile_number: updateValue })))
                  break;
              case 'password':
                  await userUpdateHandler({ userID,userName:false, email:false, mobile_number:false, dob:false,password:updateValue  })
                  break;
              default:
                  setdialogType('defaultAddressError');
                  break;
          }
        } finally { setLoading(false); }
    }

    async function formSubmitAddress(e:any,Dialog:string|null,userID:number,addressID?:number){
        e.preventDefault();
        setdialogType(null);
        setLoading(true);
        const data = {
            addressType:e.target.addresstype.value,
            contactNumber:e.target.contactnumber.value,
            addressLine1:e.target.addressline1.value,
            addressLine2:e.target.addressline2.value,
            city:e.target.city.value,
            state:e.target.state.value,
            country:e.target.country.value,
            postalCode:e.target.postalcode.value,
            userName:e.target.name.value,
        }
        try {
          switch (Dialog) {
              case 'address':
                  if(addressID !== undefined) await userAddressUpdateHandler(data,userID,addressID).then((res)=>{
                      if(res.status===200){
                          dispatch(setAddress(addresses.map((each) => each.addressID === addressID ? { ...each, ...data } : each)));
                      }
                  })
                  break;
              case 'newaddress':
                  await userAddressAddHandler(data,userID).then((res)=>{
                      if(res.status===200){
                          const newAddress = addresses.length===0 ? { ...data, addressID: res.addressID, is_default:true } : { ...data, addressID: res.addressID, is_default:false };
                          dispatch(addAddress(newAddress));
                      }
                  })
                  break;
              default:
                  setdialogType('defaultAddressError');
                  break;
          }
        } finally { setLoading(false); }
    }

    async function deleteAddress(userID:number,addressID:number){
        setLoading(true);
        await userAddressDeleteHandler(addressID,userID).then((res)=>res.status===200 ? dispatch(removeAddress(addressID)) : setdialogType('defaultAddressError'));
        setLoading(false);
    }

    const renderAddressForm = (mode: 'address' | 'newaddress') => {
      const isEdit = mode === 'address';
      return (
        <Dialog open={dialogType===mode} onClose={() => setdialogType(null)} className="relative z-50">
          <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
          <div className="fixed inset-0 flex w-screen items-center justify-center overflow-y-auto p-4">
            <DialogPanel className="w-full max-w-2xl rounded-3xl bg-white p-6 text-center shadow-2xl">
              <DialogTitle className="text-xl font-bold text-slate-900">{isEdit ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
              <Description className="mt-2 text-sm text-slate-500">Lưu ý: cập nhật hồ sơ sẽ không ảnh hưởng đến các đơn hàng hiện tại.</Description>
              <form onSubmit={(e)=>formSubmitAddress(e,dialogType,userID,selectedAddress.addressID)} className='mt-5 grid gap-4 text-left md:grid-cols-2'>
                <div className='md:col-span-2 flex justify-center gap-6 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-slate-700'>
                  <label className='flex items-center gap-2'><input type="radio" name="addresstype" value="WORK" defaultChecked={isEdit && selectedAddress.addressType==='WORK'}/> Cơ quan</label>
                  <label className='flex items-center gap-2'><input type="radio" name="addresstype" value="HOME" defaultChecked={!isEdit || selectedAddress.addressType==='HOME'}/> Nhà riêng</label>
                </div>
                <label className={labelClass}>Tên người nhận<input defaultValue={isEdit ? selectedAddress.userName : ''} required id='name' type='text' minLength={2} maxLength={64} className={fieldClass} placeholder='Ví dụ: Phú Luận'/></label>
                <label className={labelClass}>Số liên hệ<input defaultValue={isEdit ? selectedAddress.contactNumber : ''} required id='contactnumber' type='tel' minLength={9} maxLength={15} inputMode='numeric' className={fieldClass} placeholder='Ví dụ: 0987654321'/></label>
                <label className={`${labelClass} md:col-span-2`}>Địa chỉ dòng 1<input defaultValue={isEdit ? selectedAddress.addressLine1 : ''} required id='addressline1' type='text' minLength={2} maxLength={128} className={fieldClass} placeholder='Số nhà, tên đường'/></label>
                <label className={`${labelClass} md:col-span-2`}>Địa chỉ dòng 2<input defaultValue={isEdit ? selectedAddress.addressLine2 : ''} id='addressline2' type='text' maxLength={128} className={fieldClass} placeholder='Phường/xã, tòa nhà, ghi chú thêm'/></label>
                <label className={labelClass}>Thành phố<input defaultValue={isEdit ? selectedAddress.city : ''} required id='city' type='text' minLength={2} maxLength={60} className={fieldClass} placeholder='Hà Nội'/></label>
                <label className={labelClass}>Tỉnh/Thành<input defaultValue={isEdit ? selectedAddress.state : ''} required id='state' type='text' minLength={2} maxLength={60} className={fieldClass} placeholder='Hà Nội'/></label>
                <label className={labelClass}>Quốc gia<input defaultValue={isEdit ? selectedAddress.country : 'Việt Nam'} required id='country' type='text' minLength={2} maxLength={56} className={fieldClass}/></label>
                <label className={labelClass}>Mã bưu chính<input defaultValue={isEdit ? selectedAddress.postalCode : ''} required id='postalcode' type='text' inputMode='numeric' pattern='[0-9]*' className={fieldClass} placeholder='Nhập số bất kỳ'/></label>
                <div className="md:col-span-2 mt-2 flex gap-3">
                  <button type='button' className='flex-1 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50' onClick={() => setdialogType(null)}>Hủy</button>
                  <button type='submit' className='flex-1 rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-600'>Lưu địa chỉ</button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </Dialog>
      )
    }

    return (
    <>
    {menuType==='profile' && <Dialog open={dialogType!=null} onClose={() => setdialogType(null)} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
          <DialogTitle className="text-xl font-bold text-slate-900">Cập nhật {dialogType ? profileLabels[dialogType] || dialogType : ''}</DialogTitle>
          <Description className="mt-2 text-sm text-slate-500">Cập nhật hồ sơ sẽ không ảnh hưởng đến các đơn hàng hiện tại.</Description>
          <form onSubmit={(e)=>formSubmitProfile(e,dialogType,userID)} className='mt-5 flex flex-col gap-4'>
            <label className={labelClass}>Thông tin mới
              {dialogType==='name' && <input required id='updateValue' type='text' minLength={2} maxLength={64} className={fieldClass}/>} 
              {dialogType==='date of birth' && <input required id='updateValue' type='date' className={fieldClass}/>} 
              {dialogType==='email' && <input id='updateValue' required type='email' minLength={5} maxLength={128} className={fieldClass}/>} 
              {dialogType==='number' && <input id='updateValue' type='tel' required minLength={9} maxLength={15} className={fieldClass}/>} 
              {dialogType==='password' && <input id='updateValue' type='password' required minLength={8} maxLength={32} className={fieldClass}/>} 
            </label>
            <div className="flex gap-3">
              <button type='button' className='flex-1 rounded-2xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50' onClick={() => setdialogType(null)}>Hủy</button>
              <button type='submit' className='flex-1 rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-600'>Lưu</button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>}

    {menuType==='address' && dialogType==='address' && renderAddressForm('address')}
    {menuType==='address' && dialogType==='newaddress' && renderAddressForm('newaddress')}

    {menuType==='address' && dialogType==='deleteaddress' && <Dialog open={dialogType==='deleteaddress'} onClose={() => setdialogType(null)} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
          <DialogTitle className="text-xl font-bold text-slate-900">Xóa địa chỉ?</DialogTitle>
          <Description className="mt-2 text-sm text-slate-500">Bạn có chắc muốn xóa địa chỉ này không?</Description>
          <div className="mt-5 flex gap-3">
            <button className='flex-1 rounded-2xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50' onClick={() => setdialogType(null)}>Hủy</button>
            <button className='flex-1 rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white hover:bg-rose-600' onClick={() => {deleteAddress(userID,selectedAddress.addressID);setdialogType(null)}}>Xóa</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>}

    <Dialog open={dialogType==='defaultAddressError'} onClose={() => setdialogType(null)} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
          <DialogTitle className="text-xl font-bold text-rose-600">Lỗi máy chủ</DialogTitle>
          <Description className="mt-2 text-sm text-slate-500">Hiện chưa xử lý được yêu cầu. Vui lòng thử lại sau.</Description>
          <button className='mt-5 rounded-2xl bg-rose-500 px-8 py-3 font-semibold text-white hover:bg-rose-600' onClick={() => setdialogType(null)}>Đồng ý</button>
        </DialogPanel>
      </div>
    </Dialog>
    </>
  )
}

export default SettingDialogs
