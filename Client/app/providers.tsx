'use client'

import React from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { MenuProvider } from '@/Helpers/MenuContext'
import { AppProvider } from '@/Helpers/AccountDialog'
import { GoogleOAuthProvider } from '@react-oauth/google'

export default function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID || ''
  const content = (
    <Provider store={store}>
      <MenuProvider>
        <AppProvider>{children}</AppProvider>
      </MenuProvider>
    </Provider>
  )

  return <GoogleOAuthProvider clientId={googleClientId || 'missing-google-client-id'}>{content}</GoogleOAuthProvider>
}
