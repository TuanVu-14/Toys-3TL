'use client';
// Client/components/Search/Search.tsx
// ĐÃ TÍCH HỢP: ToyFilterSidebar (age_group, gender, material, skill_type)

import React, { useLayoutEffect, useState, useRef, useEffect } from 'react';
import { HomeIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import SearchProducts from './SearchProducts';
import { useParams } from 'next/navigation';
import FilterSidebar from '@/components/FilterSidebar';
import SearchMSidebar from '../Mobile-Interface/SearchMSidebar';
import searchProductHandler, { searchFilteredHandler } from '@/app/api/search';
import ToyFilterSidebar, { ToyFilters } from '@/components/ToyFilterSidebar';
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

const DEFAULT_TOY_FILTERS: ToyFilters = {
  ageGroup: '',
  gender: '',
  material: '',
  skillType: '',
};

const Search = () => {
  const categoryCapture = useParams();
  const specificCategory: any = categoryCapture.productName;
  const currDirectory = ['Search', specificCategory];

  const [loading, setloading] = useState(true);
  const productsData = useRef<Product[]>([]);
  const dataChecked = useRef(false);
  const [clear, setClear] = useState(false);
  const [isMenu, setIsMenu] = useState(false);

  // ── Toy filter state ────────────────────────────────────────────────────────
  const [toyFilters, setToyFilters] = useState<ToyFilters>(DEFAULT_TOY_FILTERS);
  const toyFiltersRef = useRef<ToyFilters>(DEFAULT_TOY_FILTERS);

  // ── Khi toy filters thay đổi → fetch lại ──────────────────────────────────
  useEffect(() => {
    toyFiltersRef.current = toyFilters;
    if (dataChecked.current) {
      applyAllFilters();
    }
  }, [toyFilters]);

  // ── Gộp tất cả filter vào 1 request ───────────────────────────────────────
  async function applyAllFilters(priceRatingParams?: {
    minPrice: string;
    maxPrice: string;
    rating: string;
  }) {
    productsData.current = [];
    dataChecked.current = false;
    setloading(true);

    const tf = toyFiltersRef.current;
    const hasToyFilter =
      tf.ageGroup !== '' || tf.gender !== '' || tf.material !== '' || tf.skillType !== '';
    const hasPriceRating = !!priceRatingParams;

    if (hasToyFilter || hasPriceRating) {
      const response = await toyFilterSearchHandler({
        productName: specificCategory,
        minPrice: priceRatingParams?.minPrice,
        maxPrice: priceRatingParams?.maxPrice,
        minRating: priceRatingParams?.rating,
        ageGroup: tf.ageGroup,
        gender: tf.gender,
        material: tf.material,
        skillType: tf.skillType,
      });
      if (response.status === 200 && response.data) {
        productsData.current = response.data.data;
      }
    } else {
      // Không có filter → dùng search thường
      const response = await searchProductHandler({ productName: specificCategory });
      if (response.status === 200) {
        if (response.data.data.length > 0) productsData.current = response.data.data;
      }
    }

    dataChecked.current = true;
    setloading(false);
  }

  // ── filterSubmit từ FilterSidebar (price/rating) ──────────────────────────
  async function filterSubmit(e: any) {
    e.preventDefault();
    const values = {
      minPrice: e.target.pricefrom.value,
      maxPrice: e.target.priceto.value,
      rating: e.target.rating.value,
    };
    await applyAllFilters(values);
  }

  function handleToyFilterReset() {
    setToyFilters(DEFAULT_TOY_FILTERS);
  }

  async function fetchData() {
    if (productsData.current.length !== 0) productsData.current = [];
    if (!loading) setloading(true);
    const response = await searchProductHandler({ productName: specificCategory });
    switch (response.status) {
      case 200:
        if (response.data.data.length > 0) productsData.current = response.data.data;
        dataChecked.current = true;
        setloading(false);
        break;
      default:
        break;
    }
  }

  function toggleClear() {
    setClear(!clear);
    setToyFilters(DEFAULT_TOY_FILTERS);
  }

  useLayoutEffect(() => {
    fetchData();
  }, [clear]);

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
          <HomeIcon width={35} />
          {currDirectory.map((each, index) => (
            <div className="flex gap-5" key={index}>
              <ChevronDoubleRightIcon width={20} />
              <p className="font-medium capitalize">
                {each === specificCategory ? formatedName : each}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsMenu(true)}
          className="rounded-full lg:hidden px-2 py-2 border-2 font-semibold text-md text-primary-600 whitespace-nowrap w-[200px] mx-auto text-center shadow-sm transition-all duration-500 hover:bg-indigo-500 hover:text-white"
        >
          Filter Products
        </button>

        <section className="flex gap-4">
          {/* ── Sidebar trái ─────────────────────────────────────────────── */}
          <div className="relative ml-4 flex flex-col gap-4">
            {/* Bộ lọc giá/rating cũ */}
            <FilterSidebar
              dataChecked={dataChecked.current}
              filterSubmit={filterSubmit}
              toggleClear={toggleClear}
              mobileMode={false}
            />
            {/* ── Bộ lọc đồ chơi MỚI ── */}
            <ToyFilterSidebar
              filters={toyFilters}
              onChange={setToyFilters}
              onReset={handleToyFilterReset}
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