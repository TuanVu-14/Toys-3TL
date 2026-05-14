'use client';

import React, { useLayoutEffect, useState, useRef } from 'react';
import { HomeIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import SubProducts from './SubProducts';
import { useParams } from 'next/navigation';
import FilterSidebar from '@/components/FilterSidebar';
import SearchMSidebar from '../Mobile-Interface/SearchMSidebar';
import subCategoryDataHandler, {
  subCategoryFilteredHandler,
} from '@/app/api/subCategory';

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

const SubCategory = () => {
  const categoryCapture = useParams();
  const specficMainCategory = categoryCapture.maincategory as string;
  const specificCategory = categoryCapture.subcategory as string;

  const currDirectory = [
    'Categories',
    specficMainCategory,
    specificCategory,
  ];

  const [loading, setloading] = useState(true);
  const productsData = useRef<Product[]>([]);
  const dataChecked = useRef(false);
  const categoryID = useRef<number>(0);
  const [clear, setClear] = useState(false);
  const [isMenu, setIsMenu] = useState(false);

  async function filterSubmit(e: any) {
    e.preventDefault();

    productsData.current = [];
    dataChecked.current = false;
    setloading(true);

    const response = await subCategoryFilteredHandler({
      categoryID: categoryID.current,
      minPrice: Number(e.target.pricefrom.value),
      maxPrice: Number(e.target.priceto.value),
      rating: Number(e.target.rating.value),
    });

    if (response.status === 200 && response.data) {
      productsData.current = response.data.data;
    }

    dataChecked.current = true;
    setloading(false);
  }

  async function fetchData() {
    if (productsData.current.length !== 0) {
      productsData.current = [];
    }

    if (!loading) {
      setloading(true);
    }

    const response = await subCategoryDataHandler(
      specficMainCategory,
      specificCategory
    );

    switch (response.status) {
      case 200:
        if (response.data.data.length > 0) {
          productsData.current = response.data.data;
          categoryID.current = response.data.categoryid;
        }

        dataChecked.current = true;
        setloading(false);
        break;

      default:
        dataChecked.current = true;
        setloading(false);
        break;
    }
  }

  function toggleClear() {
    setClear(!clear);
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

      <section className="flex flex-col gap-6 min-h-[1000px]">
        {/* Breadcrumb */}
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

        {/* Mobile filter button */}
        <button
          onClick={() => setIsMenu(true)}
          className="rounded-full lg:hidden px-2 py-2 border-2 font-semibold text-md text-primary-600 whitespace-nowrap w-[200px] mx-auto text-center shadow-sm shadow-transparent transition-all duration-500 hover:bg-indigo-500 hover:text-white"
        >
          Filter Products
        </button>

        <section className="flex">
          {/* Sidebar trái */}
          <div className="relative ml-4 flex flex-col gap-4">
            <FilterSidebar
              dataChecked={dataChecked.current}
              filterSubmit={filterSubmit}
              toggleClear={toggleClear}
              mobileMode={false}
            />
          </div>

          {/* Danh sách sản phẩm */}
          <SubProducts
            dataChecked={dataChecked.current}
            products={productsData.current}
            loading={loading}
          />
        </section>
      </section>
    </>
  );
};

export default SubCategory;