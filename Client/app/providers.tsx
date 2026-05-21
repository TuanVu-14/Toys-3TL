'use client'

import React from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { MenuProvider } from '@/Helpers/MenuContext'
import { AppProvider } from '@/Helpers/AccountDialog'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <MenuProvider>
        <AppProvider>{children}</AppProvider>
      </MenuProvider>
    </Provider>
  )
}
