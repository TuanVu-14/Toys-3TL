'use client';
// Client/components/Search/Search.tsx
// ĐÃ SỬA: bỏ bộ lọc phụ "Bộ lọc đồ chơi" bị thừa.
// Trang search chỉ còn dùng FilterSidebar chính.

import React, { useLayoutEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { HomeIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import SearchProducts from './SearchProducts';
import { useParams } from 'next/navigation';
import FilterSidebar from '@/components/FilterSidebar';
import SearchMSidebar from '../Mobile-Interface/SearchMSidebar';
import searchProductHandler from '@/app/api/search';
import { toyFilterSearchHandler } from '@/app/api/toyFilter';

interface Color {
  colorid: number;
  name: string;
  colorname: string;
  colorclass: string;
}

interface Size {
  sizeid: number;
  name: string;
  sizename: string;
  instock: boolean;
}

interface ProductImage {
  imageid: number;
  imglink: string;
  imgalt: string;
}

interface Product {
  productid: number;
  title: string;
  category: string;
  price: string;
  discount: string;
  stars: number;
  isnew: boolean;
  issale: boolean;
  isdiscount: boolean;
  colors: Color[];
  sizes: Size[];
  reviewCount: number;
  images: ProductImage;
}

const Search = () => {
  const categoryCapture = useParams();
  const specificCategory = String(categoryCapture.productName || '');
  const currDirectory = ['Search', specificCategory];

  const [loading, setloading] = useState(true);
  const productsData = useRef<Product[]>([]);
  const dataChecked = useRef(false);
  const [clear, setClear] = useState(false);
  const [isMenu, setIsMenu] = useState(false);

  async function fetchData() {
    productsData.current = [];
    if (!loading) setloading(true);

    try {
      const response = await searchProductHandler({ productName: specificCategory });

      if (response.status === 200 && response.data?.data?.length > 0) {
        productsData.current = response.data.data;
      }
    } finally {
      dataChecked.current = true;
      setloading(false);
    }
  }

  async function filterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const minPrice = String(formData.get('pricefrom') || '');
    const maxPrice = String(formData.get('priceto') || '');
    const rating = String(formData.get('rating') || '');

    productsData.current = [];
    dataChecked.current = false;
    setloading(true);

    try {
      const response = await toyFilterSearchHandler({
        productName: specificCategory,
        minPrice,
        maxPrice,
        minRating: rating,
      });

      if (response.status === 200 && response.data?.data) {
        productsData.current = response.data.data;
      }
    } finally {
      dataChecked.current = true;
      setloading(false);
    }
  }

  function toggleClear() {
    setClear((prev) => !prev);
  }

  useLayoutEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear, specificCategory]);

  const formatedName = specificCategory.split('-').join(' ');

  return (
    <>
      <SearchMSidebar
        isMenu={isMenu}
        setIsMenu={setIsMenu}
        dataChecked={dataChecked.current}
        filterSubmit={filterSubmit}
        toggleClear={toggleClear}
      />

      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="transition-all duration-300 hover:text-primary-600">
            <HomeIcon width={35} />
          </Link>

          {currDirectory.map((each, index) => {
            const isLast = index === currDirectory.length - 1;

            return (
              <div className="flex items-center gap-5" key={index}>
                <ChevronDoubleRightIcon width={20} />

                {isLast ? (
                  <p className="font-medium capitalize">
                    {each === specificCategory ? formatedName : each}
                  </p>
                ) : (
                  <Link
                    href="/search"
                    className="font-medium capitalize transition-all duration-300 hover:text-primary-600"
                  >
                    {each}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setIsMenu(true)}
          className="rounded-full lg:hidden px-2 py-2 border-2 font-semibold text-md text-primary-600 whitespace-nowrap w-[200px] mx-auto text-center shadow-sm transition-all duration-500 hover:bg-indigo-500 hover:text-white"
        >
          Filter Products
        </button>

        <section className="flex gap-4">
          <div className="relative ml-4 flex flex-col gap-4">
            <FilterSidebar
              dataChecked={dataChecked.current}
              filterSubmit={filterSubmit}
              toggleClear={toggleClear}
              mobileMode={false}
            />
          </div>

          <SearchProducts
            dataChecked={dataChecked.current}
            products={productsData.current}
            loading={loading}
          />
        </section>
      </section>
    </>
  );
};

export default Search;
