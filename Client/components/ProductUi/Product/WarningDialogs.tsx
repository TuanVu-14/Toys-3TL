import React from 'react'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
const WarningDialogs = ({WarningType,setWarningType,setloading}:{WarningType:null | string,setWarningType:React.Dispatch<React.SetStateAction<string|null>>,setloading:React.Dispatch<React.SetStateAction<boolean>>}) => {
  return (
    <div>
        <Dialog open={WarningType==='successful'} onClose={() => setWarningType(null)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-xl text-center drop-shadow-custom-xl">
                <DialogTitle className="font-bold">Gửi thành công</DialogTitle>
                <Description>Đánh giá của bạn sẽ hiển thị trên website sau vài phút. Cảm ơn bạn.</Description>
                <div className="flex justify-center gap-4">
                    <button className='border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl' onClick={() => setWarningType(null)}>Đồng ý</button>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
        <Dialog open={WarningType==='exists'} onClose={() => setWarningType(null)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-xl text-center drop-shadow-custom-xl">
                <DialogTitle className="font-bold">Đã tồn tại</DialogTitle>
                <Description>Không thể xử lý vì đánh giá đã tồn tại.</Description>
                <div className="flex justify-center gap-4">
                    <button className='border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl' onClick={() => setWarningType(null)}>Đồng ý</button>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
        <Dialog open={WarningType==='noOrder'} onClose={() => setWarningType(null)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-xl text-center drop-shadow-custom-xl">
                <DialogTitle className="font-bold">Mua sản phẩm</DialogTitle>
                <Description>Chỉ khách hàng đã mua sản phẩm này mới có thể đánh giá.</Description>
                <div className="flex justify-center gap-4">
                    <button className='border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl' onClick={() => setWarningType(null)}>Đồng ý</button>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
        <Dialog open={WarningType==='error'} onClose={() => setWarningType(null)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border  p-6 rounded-xl text-center drop-shadow-custom-xl bg-red-400 text-white">
                <DialogTitle className="font-bold">Lỗi</DialogTitle>
                <Description>Hệ thống đang tạm gián đoạn. Vui lòng thử lại sau.</Description>
                <div className="flex justify-center gap-4">
                    <button className='border-[1.5px] hover:bg-white transition-colors duration-300 hover:text-black py-2 px-6 rounded-xl' onClick={() => setWarningType(null)}>Đồng ý</button>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
        <Dialog open={WarningType==='notExists'} onClose={() => setWarningType(null)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-xl text-center drop-shadow-custom-xl">
                <DialogTitle className="font-bold">Không tồn tại</DialogTitle>
                <Description>Không thể xử lý vì đánh giá không tồn tại.</Description>
                <div className="flex justify-center gap-4">
                    <button className='border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl' onClick={() => setWarningType(null)}>Đồng ý</button>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
        <Dialog open={WarningType==='deleted'} onClose={() => setWarningType(null)} className="relative z-50">
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-xl text-center drop-shadow-custom-xl">
                <DialogTitle className="font-bold">Xóa thành công</DialogTitle>
                <Description>Đánh giá của bạn sẽ được xóa trong thời gian ngắn. Cảm ơn bạn.</Description>
                <div className="flex justify-center gap-4">
                    <button className='border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl' onClick={() => setWarningType(null)}>Đồng ý</button>
                </div>
            </DialogPanel>
            </div>
        </Dialog>
    </div>
  )
}

export default WarningDialogs