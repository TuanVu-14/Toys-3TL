"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/Helpers/AccountDialog";

const DialogBoxes = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    appState,
    toggleAgreement,
    toggleIsOpenAgreement,
    toggleIsPassword,
    toggleServerError,
    toggleIsExists,
    toggleIsIncorrect,
  } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix Next.js hydration error: Dialog state is client-only.
  if (!mounted) return null;

  return (
    <>
      <Dialog
        open={appState.isOpenAgreement}
        onClose={toggleIsOpenAgreement}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Điều khoản đăng ký
            </DialogTitle>
            <Description className="mt-3 text-sm leading-6 text-gray-600">
              Khi đăng ký, bạn tạo tài khoản 3TL-Shop và đồng ý với Điều khoản sử dụng cùng Chính sách bảo mật.
            </Description>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={toggleIsOpenAgreement}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleIsOpenAgreement();
                  toggleAgreement();
                }}
                className="rounded-lg bg-primary-800 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Đồng ý
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={appState.isPassword}
        onClose={toggleIsPassword}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Mật khẩu
            </DialogTitle>
            <Description className="mt-3 text-sm leading-6 text-gray-600">
              Mật khẩu nhập lại không khớp. Vui lòng thử lại.
            </Description>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={toggleIsPassword}
                className="rounded-lg bg-primary-800 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Đồng ý
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={appState.serverError}
        onClose={toggleServerError}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Lỗi
            </DialogTitle>
            <Description className="mt-3 text-sm leading-6 text-gray-600">
              Hệ thống đang gặp sự cố. Vui lòng thử lại sau.
            </Description>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={toggleServerError}
                className="rounded-lg bg-primary-800 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Đồng ý
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={appState.isExists}
        onClose={toggleIsExists}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Tài khoản đã tồn tại
            </DialogTitle>
            <Description className="mt-3 text-sm leading-6 text-gray-600">
              Email hoặc số điện thoại này đã được đăng ký.
            </Description>
            <p className="mt-2 text-sm text-gray-600">Bạn có muốn đăng nhập không?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={toggleIsExists}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Đồng ý
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleIsExists();
                  router.push("/sign-in");
                }}
                className="rounded-lg bg-primary-800 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Đăng nhập
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={appState.isIncorrect}
        onClose={toggleIsIncorrect}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Thông tin đăng nhập không đúng
            </DialogTitle>
            <Description className="mt-3 text-sm leading-6 text-gray-600">
              Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.
            </Description>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={toggleIsIncorrect}
                className="rounded-lg bg-primary-800 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Đồng ý
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default DialogBoxes;
