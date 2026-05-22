'use client'
import { MenuProvider } from '@/Helpers/MenuContext'
import React, { Suspense } from 'react'
import { AppProvider } from '@/Helpers/AccountDialog'
import { Provider } from 'react-redux'
import { store } from '@/app/store'
import CartCheckout from '@/components/Checkout/CartCheckout'
const page = () => {
    return (
        <Provider store={store}>
                <MenuProvider>
                    <AppProvider>
                        <Suspense fallback={null}>
                            <CartCheckout/>
                        </Suspense>
                    </AppProvider>
                </MenuProvider>
        </Provider>
    )
}

export default page
