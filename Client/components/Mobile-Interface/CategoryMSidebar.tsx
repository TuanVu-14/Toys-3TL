'use client';

import React, { useEffect, useState } from 'react';
import CategorySidebar from '../Categories/CategorySidebar';
import FilterSidebar from '../FilterSidebar';

interface Category {
  categoryid: number;
  name: string;
}

interface PropsTypes {
  isMenu: boolean;
  setIsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  categoriesData: Category[];
  sidebarLoading: boolean;
  selectedCategoryIndex: number;
  setselectedCategoryIndex: React.Dispatch<React.SetStateAction<number>>;
  dataChecked: boolean;
  filterSubmit: (e: any) => void;
  toggleClear: () => void;
}

const CategoryMSidebar = ({
  isMenu,
  setIsMenu,
  categoriesData,
  sidebarLoading,
  selectedCategoryIndex,
  setselectedCategoryIndex,
  dataChecked,
  filterSubmit,
  toggleClear,
}: PropsTypes) => {
  const [overlayColor, setOverlayColor] = useState('rgba(255, 255, 255, 0)');

  useEffect(() => {
    if (isMenu) {
      const timer = setTimeout(() => {
        setOverlayColor('rgba(0, 0, 0, 0.5)');
      }, 100);

      return () => clearTimeout(timer);
    }

    setOverlayColor('rgba(255, 255, 255, 0)');
  }, [isMenu]);

  if (!isMenu) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-colors duration-300 lg:hidden"
        style={{ backgroundColor: overlayColor }}
        onClick={() => setIsMenu(false)}
      />

      <aside className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-[380px] overflow-y-auto bg-white p-5 shadow-2xl lg:hidden">
        <button
          type="button"
          onClick={() => setIsMenu(false)}
          className="mb-5 rounded-lg border border-gray-200 px-4 py-2 font-semibold"
        >
          Đóng
        </button>

        <CategorySidebar
          categories={categoriesData}
          loading={sidebarLoading}
          selectedCategoryIndex={selectedCategoryIndex}
          setselectedCategoryIndex={setselectedCategoryIndex}
          mobileMode
        />

        <div className="mt-8">
          <FilterSidebar
            dataChecked={dataChecked}
            filterSubmit={filterSubmit}
            toggleClear={toggleClear}
            mobileMode
          />
        </div>
      </aside>
    </>
  );
};

export default CategoryMSidebar;
