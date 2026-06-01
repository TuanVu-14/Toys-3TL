import React, { useMemo, useState } from 'react';
import Quickview from '../ProductUi/Quickview';
import Stars from '../ProductUi/Stars';
import NoProduct from './NoProduct';
import Loading from '../Loading';
import Link from 'next/link';
import { formatPrice } from '@/features/UIUpdates/CartWishlist';

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
  images: ProductImage | ProductImage[];
}

const defaultProduct: Product = {
  productid: 0,
  title: '',
  category: '',
  price: '0',
  discount: '0',
  stars: 0,
  isnew: false,
  issale: false,
  isdiscount: false,
  colors: [],
  sizes: [],
  reviewCount: 0,
  images: { imageid: 0, imglink: '', imgalt: '' },
};

const getProductImage = (images: Product['images']) => {
  if (Array.isArray(images)) {
    return images.find((img) => img?.imglink)?.imglink || '';
  }

  return images?.imglink || '';
};

const getProductAlt = (product: Product) => {
  if (Array.isArray(product.images)) {
    return product.images.find((img) => img?.imgalt)?.imgalt || product.title;
  }

  return product.images?.imgalt || product.title;
};

const ProductCard = ({ product }: { product: Product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [productData, setProductData] = useState<Product>(defaultProduct);
  const [open, setOpen] = useState(false);

  const imageSrc = useMemo(() => getProductImage(product.images), [product.images]);
  const imageAlt = useMemo(() => getProductAlt(product), [product]);
  const discountNumber = Number(product.discount || 0);
  const hasDiscount = product.isdiscount && discountNumber > 0;

  return (
    <>
      <div
        className="group relative flex h-[470px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {product.issale && (
          <span className="absolute left-0 top-0 z-10 bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Sale
          </span>
        )}

        {product.isnew && (
          <span className="absolute left-0 top-0 z-10 bg-pink-400 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            New
          </span>
        )}

        {hasDiscount && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
            -{discountNumber}%
          </span>
        )}

        <Link href={`/product/${product.productid}`} className="block">
          <div className="relative h-[260px] w-full overflow-hidden bg-gray-50">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt}
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                Không có ảnh
              </div>
            )}
          </div>
        </Link>

        {isHovered && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setProductData(product);
            }}
            className="absolute left-1/2 top-[210px] z-20 -translate-x-1/2 rounded-full bg-black/80 px-6 py-2 text-sm font-semibold uppercase text-white transition hover:bg-black"
          >
            Quickview
          </button>
        )}

        <div className="flex flex-1 flex-col px-6 py-4">
          <p className="mb-2 line-clamp-1 text-sm font-medium text-pink-400">{product.category}</p>

          <Link href={`/product/${product.productid}`}>
            <h3 className="mb-3 min-h-[56px] text-lg font-medium leading-7 text-gray-700 line-clamp-2 hover:text-primary-600">
              {product.title}
            </h3>
          </Link>

          <div className="mb-3 flex min-h-[24px] items-center gap-2">
            <Stars stars={Number(product.stars || 0)} />
            {product.reviewCount > 0 && (
              <span className="text-sm text-gray-500">{product.reviewCount}</span>
            )}
          </div>

          <div className="mt-auto flex items-center gap-3">
            <span className="text-xl font-bold text-red-500">
              {formatPrice(product.price, product.discount)}
            </span>
            {hasDiscount && (
              <span className="text-base text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      <Quickview open={open} setOpen={setOpen} product={productData} />
    </>
  );
};

const SearchProducts = ({
  dataChecked,
  products,
  loading,
}: {
  dataChecked: boolean;
  products: Product[];
  loading: boolean;
}) => {
  return (
    <section className="w-full">
      <h2 className="mb-6 border-b border-gray-200 pb-3 text-2xl font-bold">Sản phẩm</h2>

      {loading && <Loading />}

      {dataChecked && products.length === 0 && <NoProduct />}

      {dataChecked && products.length > 0 && (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((each) => (
            <ProductCard key={each.productid} product={each} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SearchProducts;
