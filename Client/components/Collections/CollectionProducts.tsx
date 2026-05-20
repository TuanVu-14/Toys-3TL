"use client"

import React, { useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import SearchProducts from '@/components/Search/SearchProducts'
import { collectionProductsHandler } from '@/app/api/collection'

export default function CollectionProducts() {
  const params = useParams<{ collection: string }>()
  const collectionSlug = String(params.collection || '')
  const [loading, setLoading] = useState(true)
  const [collection, setCollection] = useState<any>(null)
  const products = useRef<any[]>([])
  const dataChecked = useRef(false)

  useLayoutEffect(() => {
    async function fetchData() {
      setLoading(true)
      dataChecked.current = false

      const response = await collectionProductsHandler({ collectionSlug })

      if (response.status === 200) {
        setCollection(response.data?.data || null)
        products.current = response.data?.products || []
      } else {
        setCollection(null)
        products.current = []
      }

      dataChecked.current = true
      setLoading(false)
    }

    fetchData()
  }, [collectionSlug])

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-indigo-600">Trang chủ</Link>
        <span>›</span>
        <span>Bộ sưu tập</span>
        <span>›</span>
        <span className="font-semibold text-gray-900">{collection?.name || collectionSlug.split('-').join(' ')}</span>
      </div>

      {collection && (
        <div className="mb-8 rounded-2xl border bg-white p-6">
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          {collection.description && <p className="mt-3 text-gray-600">{collection.description}</p>}
        </div>
      )}

      <SearchProducts dataChecked={dataChecked.current} products={products.current} loading={loading} />
    </section>
  )
}
