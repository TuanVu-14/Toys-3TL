'use client';

import React, { useLayoutEffect, useState, useRef, useEffect } from 'react';
import { HomeIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import CategoryProducts from './CategoryProducts';
import CategorySidebar from './CategorySidebar';
import { useParams } from 'next/navigation';
import FilterSidebar from '../FilterSidebar';
import categoryDataHandler from '@/app/api/mainCategory';
import CategoryMSidebar from '../Mobile-Interface/CategoryMSidebar';
import { categoryFilterHandler, categoryOnlyFilterHandler } from '@/app/api/filter';

interface categories {
  categoryid: number;
  name: string;
}

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

type CatalogFilters = {
  age_group: string;
  gender: string;
  material: string;
  skill_type: string;
  brand: string;
  collection_id: string;
};

const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  age_group: '',
  gender: '',
  material: '',
  skill_type: '',
  brand: '',
  collection_id: '',
};

const CategoryPage = () => {
  const categoryCapture = useParams();
  const specificCategory = categoryCapture.category as string | string[];
  const currDirectory = ['Categories', specificCategory];

  const [sidebarLoading, setsidebarLoading] = useState(true);
  const [loading, setloading] = useState(true);
  const categoriesData = useRef<categories[]>([{ categoryid: 0, name: 'All' }]);
  const productsData = useRef<Product[]>([]);
  const dataChecked = useRef(false);
  const [clear, setClear] = useState(false);
  const [isMenu, setIsMenu] = useState(false);
  const [selectedCategoryIndex, setselectedCategoryIndex] = useState<number>(0);

  const catalogFiltersRef = useRef<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const priceRatingRef = useRef({
    minPrice: '0',
    maxPrice: '10000',
    minRating: '1',
  });

  async function applyAllFilters(priceRatingParams?: {
    minPrice: string;
    maxPrice: string;
    minRating: string;
  }) {
    productsData.current = [];
    dataChecked.current = false;
    setloading(true);

    const priceRating = priceRatingParams || priceRatingRef.current;
    priceRatingRef.current = priceRating;

    const filters = catalogFiltersRef.current;

    const hasCatalogFilter =
      filters.age_group !== '' ||
      filters.gender !== '' ||
      filters.material !== '' ||
      filters.skill_type !== '' ||
      filters.brand !== '' ||
      filters.collection_id !== '';

    const hasPriceRating =
      priceRating.minPrice !== '0' ||
      priceRating.maxPrice !== '10000' ||
      priceRating.minRating !== '1';

    try {
      if (hasCatalogFilter || hasPriceRating) {
        const response = await categoryFilterHandler({
          categoryName: specificCategory,
          categoryID: selectedCategoryIndex,
          minPrice: Number(priceRating.minPrice),
          maxPrice: Number(priceRating.maxPrice),
          minRating: Number(priceRating.minRating),
          age_group: filters.age_group,
          gender: filters.gender,
          material: filters.material,
          skill_type: filters.skill_type,
          brand: filters.brand,
          collection_id: filters.collection_id,
        });

        if (response.status === 200 && response.data) {
          productsData.current = response.data.data;
        }
      } else {
        const response = await categoryOnlyFilterHandler({
          categoryID: selectedCategoryIndex,
          categoryName: specificCategory,
        });

        if (response.status === 200 && response.data) {
          productsData.current = response.data.data;
        }
      }
    } catch (error) {
      console.error('applyAllFilters error:', error);
      productsData.current = [];
    }

    dataChecked.current = true;
    setloading(false);
  }

  async function filterSubmit(e: any) {
    e.preventDefault();

    catalogFiltersRef.current = {
      age_group: e.target.age_group?.value || '',
      gender: e.target.gender?.value || '',
      material: e.target.material?.value || '',
      skill_type: e.target.skill_type?.value || '',
      brand: e.target.brand?.value || '',
      collection_id: e.target.collection_id?.value || '',
    };

    const values = {
      minPrice: e.target.pricefrom.value,
      maxPrice: e.target.priceto.value,
      minRating: e.target.rating.value,
    };

    await applyAllFilters(values);
  }

  async function fetchData() {
    if (productsData.current.length !== 0) productsData.current = [];
    if (!loading) setloading(true);

    if (categoriesData.current.length !== 0) {
      categoriesData.current = [{ categoryid: 0, name: 'All' }];
    }

    if (!sidebarLoading) setsidebarLoading(true);

    const response = await categoryDataHandler(specificCategory);

    switch (response.status) {
      case 200:
        categoriesData.current = [
          ...categoriesData.current,
          ...response.data.data.categories,
        ];

        if (response.data.data.products.length > 0) {
          productsData.current = response.data.data.products;
        }

        dataChecked.current = true;
        setsidebarLoading(false);
        setloading(false);
        break;

      default:
        dataChecked.current = true;
        setsidebarLoading(false);
        setloading(false);
        break;
    }
  }

  function toggleClear() {
    catalogFiltersRef.current = DEFAULT_CATALOG_FILTERS;
    priceRatingRef.current = {
      minPrice: '0',
      maxPrice: '10000',
      minRating: '1',
    };
    setClear(!clear);
  }

  useLayoutEffect(() => {
    fetchData();
  }, [clear]);

  useEffect(() => {
    if (dataChecked.current) {
      applyAllFilters();
    }
  }, [selectedCategoryIndex]);

  return (
    <>
      <CategoryMSidebar
        isMenu={isMenu}
        setIsMenu={setIsMenu}
        categoriesData={categoriesData.current}
        sidebarLoading={sidebarLoading}
        selectedCategoryIndex={selectedCategoryIndex}
        setselectedCategoryIndex={setselectedCategoryIndex}
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
              <p className="font-medium capitalize">{each}</p>
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
            <CategorySidebar
              categories={categoriesData.current}
              loading={sidebarLoading}
              selectedCategoryIndex={selectedCategoryIndex}
              setselectedCategoryIndex={setselectedCategoryIndex}
              mobileMode={false}
            />

            <FilterSidebar
              dataChecked={dataChecked.current}
              filterSubmit={filterSubmit}
              toggleClear={toggleClear}
              mobileMode={false}
            />
          </div>

          <CategoryProducts
            dataChecked={dataChecked.current}
            products={productsData.current}
            loading={loading}
          />
        </section>
      </section>
    </>
  );
};

export default CategoryPage;