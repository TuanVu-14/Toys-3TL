'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HomeIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import CategoryProducts from './CategoryProducts';
import CategorySidebar from './CategorySidebar';
import FilterSidebar from '../FilterSidebar';
import CategoryMSidebar from '../Mobile-Interface/CategoryMSidebar';
import categoryDataHandler from '@/app/api/mainCategory';
import { categoryFilterHandler, categoryOnlyFilterHandler } from '@/app/api/filter';

interface Category {
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

const DEFAULT_PRICE_RATING = {
  minPrice: '0',
  maxPrice: '5000000',
  minRating: '0',
};

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCategoryName = (value: string | string[]) => {
  return Array.isArray(value) ? value[0] : value;
};

const formatBreadcrumb = (value: string | string[]) => {
  const text = normalizeCategoryName(value);
  return text.replace(/-/g, ' ');
};

const CategoryPage = () => {
  const categoryCapture = useParams();
  const specificCategory = categoryCapture.category as string | string[];

  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [clear, setClear] = useState(false);
  const [isMenu, setIsMenu] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const categoriesData = useRef<Category[]>([{ categoryid: 0, name: 'All' }]);
  const productsData = useRef<Product[]>([]);
  const dataChecked = useRef(false);
  const catalogFiltersRef = useRef<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const priceRatingRef = useRef(DEFAULT_PRICE_RATING);

  async function applyAllFilters(priceRatingParams?: {
    minPrice: string;
    maxPrice: string;
    minRating: string;
  }) {
    productsData.current = [];
    dataChecked.current = false;
    setLoading(true);

    const priceRating = priceRatingParams || priceRatingRef.current;
    const minPrice = Math.max(0, toNumber(priceRating.minPrice, 0));
    const maxPrice = Math.max(minPrice, toNumber(priceRating.maxPrice, 5000000));
    const minRating = Math.min(5, Math.max(0, toNumber(priceRating.minRating, 0)));

    priceRatingRef.current = {
      minPrice: String(minPrice),
      maxPrice: String(maxPrice),
      minRating: String(minRating),
    };

    const filters = catalogFiltersRef.current;
    const hasCatalogFilter = Object.values(filters).some((value) => value !== '');
    const hasPriceRating =
      minPrice !== 0 || maxPrice !== 5000000 || minRating !== 0;

    try {
      if (hasCatalogFilter || hasPriceRating) {
        const response = await categoryFilterHandler({
          categoryName: specificCategory,
          categoryID: selectedCategoryIndex,
          minPrice,
          maxPrice,
          minRating,
          age_group: filters.age_group,
          gender: filters.gender,
          material: filters.material,
          skill_type: filters.skill_type,
          brand: filters.brand,
          collection_id: filters.collection_id,
        });

        if (response.status === 200 && response.data) {
          productsData.current = response.data.data || [];
        }
      } else {
        const response = await categoryOnlyFilterHandler({
          categoryID: selectedCategoryIndex,
          categoryName: specificCategory,
        });

        if (response.status === 200 && response.data) {
          productsData.current = response.data.data || [];
        }
      }
    } catch (error) {
      console.error('applyAllFilters error:', error);
      productsData.current = [];
    }

    dataChecked.current = true;
    setLoading(false);
  }

  async function filterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    catalogFiltersRef.current = {
      age_group: String(formData.get('age_group') || ''),
      gender: String(formData.get('gender') || ''),
      material: String(formData.get('material') || ''),
      skill_type: String(formData.get('skill_type') || ''),
      brand: String(formData.get('brand') || ''),
      collection_id: String(formData.get('collection_id') || ''),
    };

    await applyAllFilters({
      minPrice: String(formData.get('pricefrom') || '0'),
      maxPrice: String(formData.get('priceto') || '5000000'),
      minRating: String(formData.get('rating') || '0'),
    });
  }

  async function fetchData() {
    productsData.current = [];
    categoriesData.current = [{ categoryid: 0, name: 'All' }];
    dataChecked.current = false;
    setLoading(true);
    setSidebarLoading(true);

    const response = await categoryDataHandler(specificCategory);

    if (response.status === 200 && response.data?.data) {
      categoriesData.current = [
        ...categoriesData.current,
        ...(response.data.data.categories || []),
      ];
      productsData.current = response.data.data.products || [];
    }

    dataChecked.current = true;
    setSidebarLoading(false);
    setLoading(false);
  }

  function toggleClear() {
    catalogFiltersRef.current = DEFAULT_CATALOG_FILTERS;
    priceRatingRef.current = DEFAULT_PRICE_RATING;
    setSelectedCategoryIndex(0);
    setClear((prev) => !prev);
  }

  useLayoutEffect(() => {
    fetchData();
  }, [clear, specificCategory]);

  useEffect(() => {
    if (dataChecked.current) {
      applyAllFilters();
    }
  }, [selectedCategoryIndex]);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 py-10 lg:px-10">
        <div className="mb-10 flex items-center gap-5 text-xl">
          <Link href="/" className="transition hover:text-primary-600" aria-label="Trang chủ">
            <HomeIcon width={35} />
          </Link>

          <div className="flex items-center gap-5">
            <ChevronDoubleRightIcon width={20} />
            <Link href="/categories" className="font-medium capitalize transition hover:text-primary-600">
              Categories
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <ChevronDoubleRightIcon width={20} />
            <Link
              href={`/categories/${normalizeCategoryName(specificCategory)}`}
              className="font-medium capitalize transition hover:text-primary-600"
            >
              {formatBreadcrumb(specificCategory)}
            </Link>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[280px_1fr] xl:grid-cols-[330px_1fr]">
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <CategorySidebar
                categories={categoriesData.current}
                loading={sidebarLoading}
                selectedCategoryIndex={selectedCategoryIndex}
                setselectedCategoryIndex={setSelectedCategoryIndex}
                mobileMode={false}
              />
            </div>

            <div className="mt-8">
              <FilterSidebar
                dataChecked={dataChecked.current}
                filterSubmit={filterSubmit}
                toggleClear={toggleClear}
                mobileMode={false}
              />
            </div>
          </aside>

          <main>
            <button
              onClick={() => setIsMenu(true)}
              className="mx-auto mb-8 block w-[200px] rounded-full border-2 px-2 py-2 text-center text-md font-semibold text-primary-600 shadow-sm transition-all duration-500 hover:bg-indigo-500 hover:text-white lg:hidden"
            >
              Filter Products
            </button>

            <CategoryProducts
              dataChecked={dataChecked.current}
              products={productsData.current}
              loading={loading}
            />
          </main>
        </div>
      </section>

      <CategoryMSidebar
        isMenu={isMenu}
        setIsMenu={setIsMenu}
        categoriesData={categoriesData.current}
        sidebarLoading={sidebarLoading}
        selectedCategoryIndex={selectedCategoryIndex}
        setselectedCategoryIndex={setSelectedCategoryIndex}
        dataChecked={dataChecked.current}
        filterSubmit={filterSubmit}
        toggleClear={toggleClear}
      />
    </>
  );
};

export default CategoryPage;
