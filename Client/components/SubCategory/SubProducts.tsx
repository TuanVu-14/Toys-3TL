import React, { useState } from "react";
import Quickview from "../ProductUi/Quickview";
import Stars from "../ProductUi/Stars";
import NoProduct from "./NoProduct";
import Loading from "../Loading";
import Link from "next/link";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

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

const defaultProduct: Product = {
  productid: 0,
  title: "",
  category: "",
  price: "0",
  discount: "0",
  stars: 0,
  isnew: false,
  issale: false,
  isdiscount: false,
  colors: [],
  sizes: [],
  reviewCount: 0,
  images: { imageid: 0, imglink: "", imgalt: "" },
};

const ProductCard = ({ product }: { product: Product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [productData, setProductData] = useState(defaultProduct);
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-md border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {product.issale && (
        <span className="absolute left-2 top-2 z-10 rounded bg-salmon px-2 py-1 text-xs font-semibold text-white">
          SALE
        </span>
      )}

      {product.isnew && (
        <span className="absolute right-2 top-2 z-10 rounded bg-green-500 px-2 py-1 text-xs font-semibold text-white">
          New
        </span>
      )}

      {product.isdiscount && Number(product.discount) > 0 && (
        <span className="absolute left-2 top-10 z-10 rounded bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
          {Number(product.discount)}%
        </span>
      )}

      <Link href={`/product/${product.productid}`} className="block">
        <img
          src={product.images?.imglink || "/images/no-product.png"}
          alt={product.images?.imgalt || product.title}
          className="h-56 w-full rounded-md object-cover"
        />
      </Link>

      {isHovered && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setProductData(product);
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Quickview
        </button>
      )}

      <p className="mt-3 text-xs uppercase tracking-wide text-salmon">{product.category}</p>

      <Link href={`/product/${product.productid}`} className="mt-1 block text-sm font-semibold text-gray-900">
        {product.title}
      </Link>

      <div className="mt-2 flex items-center gap-2">
        <Stars stars={Number(product.stars || 0)} />
        {product.reviewCount > 0 && <span className="text-xs text-gray-500">({product.reviewCount})</span>}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-base font-bold text-gray-900">{formatPrice(product.price, product.discount)}</span>
        {Number(product.discount || 0) > 0 && (
          <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
        )}
      </div>

      <Quickview open={open} setOpen={setOpen} product={productData} />
    </div>
  );
};

const SubProducts = ({
  dataChecked,
  products,
  loading,
}: {
  dataChecked: boolean;
  products: Product[];
  loading: boolean;
}) => {
  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-bold">Products</h2>

      {loading && <Loading />}

      {dataChecked && !loading && products.length === 0 && <NoProduct />}

      {dataChecked && !loading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.productid} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubProducts;
