"use client"

import React, { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { HomeIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { useParams } from 'next/navigation'

import SearchProducts from './SearchProducts'
import FilterSidebar from '@/components/FilterSidebar'
import SearchMSidebar from '../Mobile-Interface/SearchMSidebar'
import searchProductHandler from '@/app/api/search'
import { toyFilterSearchHandler } from '@/app/api/toyFilter'

const slugToText = (value: string) => decodeURIComponent(value || '').split('-').join(' ')

const Search = () => {
  const params = useParams<{ productName: string }>()
  const specificCategory = String(params.productName || '')
  const currDirectory = ['Search', specificCategory]

  const [loading, setLoading] = useState(true)
  const [clear, setClear] = useState(false)
  const [isMenu, setIsMenu] = useState(false)
  const productsData = useRef<any[]>([])
  const dataChecked = useRef(false)

  async function fetchData() {
    productsData.current = []
    dataChecked.current = false
    setLoading(true)

    try {
      const response = await searchProductHandler({ productName: specificCategory })

      if (response.status === 200 && response.data?.data) {
        productsData.current = response.data.data
      }
    } finally {
      dataChecked.current = true
      setLoading(false)
    }
  }

  async function filterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    productsData.current = []
    dataChecked.current = false
    setLoading(true)

    try {
      const response = await toyFilterSearchHandler({
        productName: specificCategory,
        minPrice: String(formData.get('pricefrom') || '0'),
        maxPrice: String(formData.get('priceto') || '999999999'),
        minRating: String(formData.get('rating') || '0'),
        age_group: String(formData.get('age_group') || ''),
        gender: String(formData.get('gender') || ''),
        material: String(formData.get('material') || ''),
        skill_type: String(formData.get('skill_type') || ''),
        brand: String(formData.get('brand') || ''),
        collection_id: String(formData.get('collection_id') || ''),
      })

      if (response.status === 200 && response.data?.data) {
        productsData.current = response.data.data
      }
    } finally {
      dataChecked.current = true
      setLoading(false)
    }
  }

  function toggleClear() {
    setClear((prev) => !prev)
  }

  useLayoutEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear, specificCategory])

  const formatedName = slugToText(specificCategory)

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {currDirectory.map((each, index) => {
            const isLast = index === currDirectory.length - 1

            return (
              <React.Fragment key={`${each}-${index}`}>
                {index === 0 && <HomeIcon className="h-4 w-4" />}
                {isLast ? (
                  <span className="font-semibold text-gray-900">{each === specificCategory ? formatedName : each}</span>
                ) : (
                  <Link href="/" className="hover:text-indigo-600">{each}</Link>
                )}
                {!isLast && <ChevronDoubleRightIcon className="h-4 w-4" />}
              </React.Fragment>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsMenu(true)}
          className="mx-auto w-[200px] rounded-full border-2 px-2 py-2 text-center text-md font-semibold text-primary-600 shadow-sm transition-all duration-500 hover:bg-indigo-500 hover:text-white lg:hidden"
        >
          Filter Products
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <FilterSidebar dataChecked={dataChecked.current} filterSubmit={filterSubmit} toggleClear={toggleClear} mobileMode={false} />
          </aside>

          <SearchProducts dataChecked={dataChecked.current} products={productsData.current} loading={loading} />
        </div>
      </div>

      {isMenu && (
        <SearchMSidebar
          isMenu={isMenu}
          setIsMenu={setIsMenu}
          dataChecked={dataChecked.current}
          filterSubmit={filterSubmit}
          toggleClear={toggleClear}
        />
      )}
    </>
  )
}

export default Search
