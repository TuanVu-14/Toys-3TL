import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMenu } from '@/Helpers/MenuContext';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { removeItemFromCart, setCart, formatPrice } from '@/features/UIUpdates/CartWishlist';
import { cartDeleteHandler } from '@/app/api/itemLists';
import { useApp } from '@/Helpers/AccountDialog';
import { useState } from 'react';
import Loading from '../Loading';
import Link from 'next/link';
import { cartQuantityHandler } from '@/app/api/userUpdate';

export default function Cart() {
  const { appState } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const isLogged = appState.loggedIn;
  const cartlist = useAppSelector((state) => state.cartWishlist.cart);
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount);
  const dispatch = useAppDispatch();
  const { menu, toggleCart } = useMenu();

  const total = cartlist.reduce((sum, item) => sum + Number(item.productPrice || 0) * Number(item.quantity || 0), 0);

  async function removeItem(cartItemID: number, productID: number) {
    setLoading(true);
    if (isLogged) await cartDeleteHandler({ userID: defaultAccount.userID, cartItemID });
    dispatch(removeItemFromCart(productID));
    setLoading(false);
  }

  const changeValue = async (
    action: string,
    cartItemID: number,
    selectedQuantity: number,
    productID: number,
    stock?: number,
  ) => {
    setMessage('');
    if (action === 'increase') {
      const maxStock = Number(stock || 0);
      if (maxStock > 0 && selectedQuantity >= maxStock) {
        setMessage(`Sản phẩm chỉ còn ${maxStock} sản phẩm trong kho.`);
        return;
      }
      setLoading(true);
      const res = isLogged
        ? await cartQuantityHandler(cartItemID, productID, defaultAccount.userID, 'increment')
        : { status: 200 };
      if (res.status === 200) {
        dispatch(setCart(cartlist.map((each) => (each.cartItemID === cartItemID ? { ...each, quantity: each.quantity + 1 } : each))));
      } else {
        setMessage('Số lượng mua vượt quá số lượng trong kho.');
      }
      setLoading(false);
      return;
    }

    if (action === 'decrease' && selectedQuantity > 1) {
      setLoading(true);
      if (isLogged) await cartQuantityHandler(cartItemID, productID, defaultAccount.userID, 'decrement');
      dispatch(setCart(cartlist.map((each) => (each.cartItemID === cartItemID ? { ...each, quantity: each.quantity - 1 } : each))));
      setLoading(false);
    }
  };

  return (
    <Transition show={menu.cart}>
      <Dialog className="relative z-50" onClose={toggleCart}>
        <TransitionChild
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <DialogTitle className="text-lg font-medium text-gray-900">Shopping cart</DialogTitle>
                        <button type="button" className="text-gray-400 hover:text-gray-500" onClick={toggleCart}>
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      {loading && <Loading />}
                      {message && <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm font-medium text-yellow-800">{message}</p>}

                      <div className="mt-8 flow-root">
                        <ul role="list" className="-my-6 divide-y divide-gray-200">
                          {cartlist.map((product) => (
                            <li key={product.cartItemID} className="flex py-6">
                              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                <img src={product.productImg} alt={product.productAlt} className="h-full w-full object-cover object-center" />
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>
                                    <Link href={`/product/${product.productID}`} onClick={toggleCart}>{product.productName}</Link>
                                  </h3>
                                  <p className="ml-4">{formatPrice(product.productPrice)}</p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">{product.productColor}</p>
                                <p className="mt-1 text-sm text-gray-500">{product.productSize}</p>

                                <div className="mt-4 flex flex-1 items-end justify-between text-sm">
                                  <div className="flex items-center gap-3">
                                    <p className="text-gray-500">Qty</p>
                                    <div className="flex items-center rounded-lg bg-gray-100">
                                      <button
                                        onClick={() => changeValue('decrease', product.cartItemID, product.quantity, product.productID, product.productStock)}
                                        className="w-10 text-2xl"
                                      >
                                        -
                                      </button>
                                      <span className="w-8 text-center">{product.quantity}</span>
                                      <button
                                        onClick={() => changeValue('increase', product.cartItemID, product.quantity, product.productID, product.productStock)}
                                        className="w-10 text-2xl"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeItem(product.cartItemID, product.productID)}
                                    type="button"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal</p>
                        <p>{formatPrice(total)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">Shipping calculated at checkout.</p>
                      <div className="mt-6">
                        {isLogged ? (
                          <Link
                            href="/cart-checkout"
                            onClick={toggleCart}
                            className="flex items-center justify-center rounded-md border border-transparent bg-btnpurple px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                          >
                            Checkout
                          </Link>
                        ) : (
                          <Link
                            href="/sign-in"
                            onClick={toggleCart}
                            className="flex items-center justify-center rounded-md border border-transparent bg-btnpurple px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                          >
                            Login to Checkout
                          </Link>
                        )}
                      </div>
                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                        <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={toggleCart}>
                          Continue Shopping →
                        </button>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
