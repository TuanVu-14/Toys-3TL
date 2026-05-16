'use client';
// Client/components/Search/Search.tsx
// ĐÃ SỬA: bỏ import @/components/ToyFilterSidebar bị thiếu module
// Tích hợp ToyFilterSidebar trực tiếp trong file này.

import React, { useLayoutEffect, useState, useRef, useEffect } from 'react';
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

type ToyFilters = {
  ageGroup: string;
  gender: string;
  material: string;
  skillType: string;
};

type ToyFilterSidebarProps = {
  filters: ToyFilters;
  onChange: React.Dispatch<React.SetStateAction<ToyFilters>>;
  onReset: () => void;
  mobileMode?: boolean;
};

const DEFAULT_TOY_FILTERS: ToyFilters = {
  ageGroup: '',
  gender: '',
  material: '',
  skillType: '',
};

const ToyFilterSidebar = ({ filters, onChange, onReset, mobileMode = false }: ToyFilterSidebarProps) => {
  const updateFilter = (key: keyof ToyFilters, value: string) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <aside
      className={`${
        mobileMode ? 'w-full' : 'hidden lg:flex'
      } flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">Bộ lọc đồ chơi</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          Xóa lọc
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Độ tuổi</label>
        <select
          value={filters.ageGroup}
          onChange={(e) => updateFilter('ageGroup', e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Tất cả</option>
          <option value="1-3">1-3 tuổi</option>
          <option value="2-5">2-5 tuổi</option>
          <option value="3-6">3-6 tuổi</option>
          <option value="4-8">4-8 tuổi</option>
          <option value="5-10">5-10 tuổi</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Giới tính</label>
        <select
          value={filters.gender}
          onChange={(e) => updateFilter('gender', e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Tất cả</option>
          <option value="unisex">Unisex</option>
          <option value="boy">Bé trai</option>
          <option value="girl">Bé gái</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Chất liệu</label>
        <select
          value={filters.material}
          onChange={(e) => updateFilter('material', e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Tất cả</option>
          <option value="ABS Plastic">Nhựa ABS</option>
          <option value="Wood">Gỗ</option>
          <option value="Fabric">Vải</option>
          <option value="Paper">Giấy</option>
          <option value="Metal">Kim loại</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Kỹ năng</label>
        <select
          value={filters.skillType}
          onChange={(e) => updateFilter('skillType', e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Tất cả</option>
          <option value="STEM">STEM</option>
          <option value="Logic">Logic</option>
          <option value="Creativity">Sáng tạo</option>
          <option value="Motor Skills">Vận động tinh</option>
          <option value="Music">Âm nhạc</option>
        </select>
      </div>
    </aside>
  );
};

const Search = () => {
  const categoryCapture = useParams();
  const specificCategory = String(categoryCapture.productName || '');
  const currDirectory = ['Search', specificCategory];

  const [loading, setloading] = useState(true);
  const productsData = useRef<Product[]>([]);
  const dataChecked = useRef(false);
  const [clear, setClear] = useState(false);
  const [isMenu, setIsMenu] = useState(false);

  const [toyFilters, setToyFilters] = useState<ToyFilters>(DEFAULT_TOY_FILTERS);
  const toyFiltersRef = useRef<ToyFilters>(DEFAULT_TOY_FILTERS);

  useEffect(() => {
    toyFiltersRef.current = toyFilters;
    if (dataChecked.current) {
      applyAllFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toyFilters]);

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

    try {
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

        if (response.status === 200 && response.data?.data) {
          productsData.current = response.data.data;
        }
      } else {
        const response = await searchProductHandler({ productName: specificCategory });
        if (response.status === 200 && response.data?.data?.length > 0) {
          productsData.current = response.data.data;
        }
      }
    } finally {
      dataChecked.current = true;
      setloading(false);
    }
  }

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

  function toggleClear() {
    setClear((prev) => !prev);
    setToyFilters(DEFAULT_TOY_FILTERS);
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
          <div className="relative ml-4 flex flex-col gap-4">
            <FilterSidebar
              dataChecked={dataChecked.current}
              filterSubmit={filterSubmit}
              toggleClear={toggleClear}
              mobileMode={false}
            />

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
