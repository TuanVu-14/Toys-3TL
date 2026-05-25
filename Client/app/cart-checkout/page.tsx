'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Loading from '@/components/Loading'

export default function CartCheckoutRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const items = searchParams.get('items') || ''
    router.replace(`/checkout/cart${items ? `?items=${items}` : ''}`)
  }, [router, searchParams])

  return <Loading />
}
