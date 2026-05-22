'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoryDropDown } from '@/app/data';

const Category = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed left-1/2 top-[200px] z-[9999] w-[min(1280px,calc(100vw-48px))] -translate-x-1/2 rounded-xl bg-white p-8 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ${
        ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid max-h-[620px] grid-cols-4 gap-x-8 gap-y-8 overflow-y-auto pr-1">
        {categoryDropDown.map((category) => (
          <div key={category.title} className="min-w-0">
            <Link href={category.catLink} className="block">
              <h3 className="mb-4 border-b border-gray-200 pb-3 text-[18px] font-bold capitalize text-gray-900 hover:text-salmon">
                {category.title}
              </h3>
            </Link>

            <div className="mb-6 flex flex-col gap-3">
              {category.subCategories.map((sub) => (
                <Link
                  key={`${category.title}-${sub.title}`}
                  href={sub.link}
                  className="text-[16px] capitalize tracking-wide text-gray-500 transition hover:text-salmon"
                >
                  {sub.title}
                </Link>
              ))}
            </div>

            {category.imgLink && (
              <Link href={category.imgRedirectLink || category.catLink} className="block overflow-hidden rounded-lg">
                <img
                  src={category.imgLink}
                  alt={category.imgAlt || category.title}
                  className="h-[120px] w-full rounded-lg object-cover transition duration-300 hover:scale-105"
                />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Category;
