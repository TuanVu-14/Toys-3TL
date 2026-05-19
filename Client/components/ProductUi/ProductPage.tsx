import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Stars from './Stars';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addItemToCart, addItemToWishlist, formatPrice } from '@/features/UIUpdates/CartWishlist';
import ReviewSection from './Product/ReviewSection';
import ProductNotFound from './Product/ProductNotFound';
import productDataHandler from '@/app/api/product';
import { useParams, useRouter } from 'next/navigation';
import Loading from '../Loading';
import Options from './Product/Options';
import { cartAddHandler, wishlistAddHandler } from '@/app/api/itemLists';
import { useApp } from '@/Helpers/AccountDialog';
import ProductDialogs from './ProductDialogs';
import Link from 'next/link';

interface Review {
  reviewid: number;
  userid: number;
  rating: number;
  title: string;
  comment: string;
  username: string;
  createdat: string;
  productstars: number;
}

interface ProductImage {
  imageid: number;
  imglink: string;
  imgalt: string;
}

interface ProductSize {
  sizeid: number;
  sizename: string;
  instock: boolean;
}

interface ProductColor {
  colorid: number;
  colorname: string;
  colorclass: string;
}

interface Categories {
  subcategory: string;
  maincategory: string;
}

interface Product {
  productid: number;
  title: string;
  description: string;
  stock: number;
  discountedprice: string | number;
  price: string | number;
  stars: number;
  seller: string;
  brand_name?: string;
  manufacturer_info?: string;
  certification_details?: string;
  collection_names?: string;
  reviewcount: number;
  categories: Categories;
  imglink: string;
  imgalt: string;
  imgcollection: ProductImage[];
  colors: ProductColor[];
  sizes: ProductSize[];
  reviews: Review[];
  discount: number;
}

const defaultData: Product = {
  productid: 1,
  title: '',
  description: '',
  stock: 0,
  discountedprice: 0,
  price: 0,
  stars: 0,
  seller: '',
  brand_name: '',
  manufacturer_info: '',
  certification_details: '',
  collection_names: '',
  reviewcount: 0,
  categories: { subcategory: '', maincategory: '' },
  imglink: '',
  imgalt: '',
  imgcollection: [],
  colors: [],
  sizes: [],
  reviews: [],
  discount: 0,
};

const IDGenerator = () => Math.round(Math.random() * 1000 * 1000 * 100);

const normalizeSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

const ProductPage = () => {
  const { appState } = useApp();
  const router = useRouter();
  const isLogged = appState.loggedIn;
  const [btnLoading, setBtnLoading] = useState(false);
  const [stockMessage, setStockMessage] = useState('');
  const [toast, setToast] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState(1);
  const reviewRef = useRef<HTMLDivElement | null>(null);
  const colRef = useRef('Default');
  const sizeRef = useRef('Default');
  const found = useRef(true);
  const dataVar = useRef(defaultData);
  const data = dataVar.current;

  const [selectedColor, setSelectedColor] = useState<ProductColor>({ colorid: 0, colorname: 'Default', colorclass: 'col_default' });
  const [selectedSize, setSelectedSize] = useState<ProductSize>({ sizeid: 0, sizename: 'Default', instock: true });
  const [selectedImage, setSelectedImage] = useState({ imgLink: '', imgAlt: '' });
  const [quantity, setQuantity] = useState(1);
  const params = useParams<{ productID: string }>();
  const [dataChecked, setDataChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogType, setDialogType] = useState<any>(null);

  const dispatch = useAppDispatch();
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount);
  const maxQuantity = Number(data.stock || 0);
  const outOfStock = maxQuantity <= 0 || (data.sizes.length > 0 && !selectedSize.instock);

  const images = useMemo(() => {
    const allImages: ProductImage[] = [
      { imageid: -1, imglink: data.imglink, imgalt: data.imgalt || data.title },
      ...(data.imgcollection || []),
    ].filter((img) => img.imglink);

    return allImages.filter((img, index, arr) => arr.findIndex((x) => x.imglink === img.imglink) === index);
  }, [data.imglink, data.imgalt, data.title, data.imgcollection]);

  const cartItemData = {
    cartItemID: IDGenerator(),
    productID: data.productid,
    productImg: selectedImage.imgLink || data.imglink,
    productAlt: selectedImage.imgAlt || data.imgalt,
    productName: data.title,
    productPrice: Number(data.discountedprice || 0),
    productColor: selectedColor.colorname,
    productSize: selectedSize.sizename,
    productStock: data.stock,
    quantity,
  };

  const wishlistItem = {
    wishlistItemID: IDGenerator(),
    productID: data.productid,
    productImg: selectedImage.imgLink || data.imglink,
    productAlt: selectedImage.imgAlt || data.imgalt,
    productName: data.title,
    productPrice: Number(data.discountedprice || 0),
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function dataRequest() {
    setLoading(true);
    const response = await productDataHandler({ productID: params.productID });
    switch (response.status) {
      case 200:
        dataVar.current = response.data.data;
        setDataChecked(true);
        break;
      default:
        found.current = false;
        setDataChecked(true);
        break;
    }
    setLoading(false);
  }

  async function setUpData() {
    if (!data) return;
    const firstColor = data.colors[0] || { colorid: 0, colorname: 'Default', colorclass: 'col_default' };
    const firstSize = data.sizes.find((size) => size.instock) || data.sizes[0] || { sizeid: 0, sizename: 'Default', instock: true };
    setSelectedColor(firstColor);
    setSelectedSize(firstSize);
    colRef.current = firstColor.colorname;
    sizeRef.current = firstSize.sizename;
    setSelectedImage({ imgLink: data.imglink, imgAlt: data.imgalt || data.title });
  }

  useLayoutEffect(() => {
    if (!dataChecked) dataRequest();
    else setUpData();
  }, [dataChecked]);

  const changeValue = (action: string) => {
    setStockMessage('');
    if (action === 'increase') {
      if (quantity >= maxQuantity) {
        setStockMessage(`Sản phẩm chỉ còn ${maxQuantity} sản phẩm trong kho.`);
        return;
      }
      setQuantity(quantity + 1);
    }
    if (action === 'decrease' && quantity > 1) setQuantity(quantity - 1);
  };

  const handleReviewClick = () => reviewRef.current?.scrollIntoView({ behavior: 'smooth' });

  async function itemStateUpdate(key: string) {
    if (outOfStock) {
      setStockMessage('Sản phẩm đã hết hàng hoặc size đang chọn không còn hàng.');
      return;
    }
    if (quantity > maxQuantity) {
      setStockMessage(`Sản phẩm chỉ còn ${maxQuantity} sản phẩm trong kho.`);
      return;
    }

    setBtnLoading(true);
    switch (key) {
      case 'cart': {
        if (isLogged) {
          const res = await cartAddHandler({
            cartItemID: cartItemData.cartItemID,
            userID: defaultAccount.userID,
            productID: data.productid,
            productPrice: Number(data.discountedprice || 0),
            colorID: selectedColor.colorid,
            sizeID: selectedSize.sizeid,
            quantity,
          });
          if (res.status !== 200) {
            setStockMessage('Số lượng mua vượt quá số lượng trong kho.');
            setBtnLoading(false);
            return;
          }
        }
        dispatch(addItemToCart(cartItemData));
        setToast('Đã thêm sản phẩm vào giỏ hàng');
        break;
      }
      case 'wishlist': {
        if (isLogged) {
          await wishlistAddHandler({
            wishlistItemID: wishlistItem.wishlistItemID,
            userID: defaultAccount.userID,
            productID: data.productid,
          });
        }
        dispatch(addItemToWishlist(wishlistItem));
        setToast('Đã thêm sản phẩm vào yêu thích');
        break;
      }
    }
    setBtnLoading(false);
  }

  function categoryLink(maincategory: string, category: string) {
    return `/sub-category/${normalizeSlug(maincategory)}/${normalizeSlug(category)}`;
  }

  return (
    <>
      {loading && <Loading />}
      {toast && (
        <div className="fixed right-5 top-24 z-[9999] rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
      {!dataChecked && <Loading />}
      {dataChecked && !found.current && <ProductNotFound />}
      {dataChecked && data && found.current && (
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link href="/" className="text-gray-600 hover:text-indigo-600">Trang chủ</Link>
            <span>&gt;</span>
            <Link href={`/categories/${normalizeSlug(data.categories.maincategory)}`} className="capitalize text-gray-600 hover:text-indigo-600">
              {data.categories.maincategory}
            </Link>
            <span>&gt;</span>
            <Link href={categoryLink(data.categories.maincategory, data.categories.subcategory)} className="capitalize text-gray-900 hover:text-indigo-600">
              {data.categories.subcategory}
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img src={selectedImage.imgLink || data.imglink} alt={selectedImage.imgAlt || data.imgalt} className="aspect-square w-full object-contain" />
              </div>
              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {images.map((each) => (
                    <button
                      type="button"
                      key={`${each.imageid}-${each.imglink}`}
                      onClick={() => setSelectedImage({ imgLink: each.imglink, imgAlt: each.imgalt })}
                      className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white p-1 transition ${selectedImage.imgLink === each.imglink ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      <img src={each.imglink} alt={each.imgalt} className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
              <p className="mt-2 text-sm text-gray-500">By {data.seller}</p>

              {data.reviewcount > 0 ? (
                <button onClick={handleReviewClick} className="mt-3 flex items-center gap-3 text-sm">
                  <span>{Number(data.stars || 0).toFixed(1)}</span>
                  <Stars stars={Number(data.stars || 0)} />
                  <span className="text-indigo-600">{data.reviewcount} đánh giá</span>
                </button>
              ) : (
                <button onClick={handleReviewClick} className="mt-3 text-sm text-gray-500 hover:text-indigo-600">Chưa có đánh giá</button>
              )}

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-red-600">{formatPrice(data.discountedprice)}</p>
                  {Number(data.price) > Number(data.discountedprice) && <p className="text-gray-400 line-through">{formatPrice(data.price)}</p>}
                  {Number(data.discount || 0) > 0 && <p className="text-yellow-600">{Number(data.discount)}% off</p>}
                </div>
                <p className="mt-4 font-medium">{outOfStock ? 'Hết hàng' : `Còn ${data.stock} sản phẩm trong kho, giao trong 5 ngày làm việc`}</p>
              </div>

              <div className="mt-5 rounded-lg border border-gray-200 p-4 text-sm leading-7">
                {data.brand_name && <p><b>Thương hiệu:</b> {data.brand_name}</p>}
                {data.manufacturer_info && <p><b>Nhà sản xuất:</b> {data.manufacturer_info}</p>}
                {data.certification_details && <p><b>Chứng chỉ an toàn:</b> {data.certification_details}</p>}
                {data.collection_names && <p><b>Bộ sưu tập:</b> {data.collection_names}</p>}
              </div>

              <div className="mt-6">
                <p className="font-medium">Quantity</p>
                <div className="mt-2 flex items-center">
                  <button type="button" onClick={() => changeValue('decrease')} className="w-12 rounded-l-lg bg-gray-100 text-3xl">-</button>
                  <input
                    type="number"
                    min={1}
                    max={maxQuantity || 1}
                    value={quantity}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!value || value < 1) return setQuantity(1);
                      if (value > maxQuantity) {
                        setStockMessage(`Sản phẩm chỉ còn ${maxQuantity} sản phẩm trong kho.`);
                        return setQuantity(maxQuantity);
                      }
                      setStockMessage('');
                      setQuantity(value);
                    }}
                    className="w-16 bg-gray-100 py-2 text-center outline-none"
                  />
                  <button type="button" onClick={() => changeValue('increase')} className="w-12 rounded-r-lg bg-gray-100 text-3xl">+</button>
                </div>
                {stockMessage && <p className="mt-2 text-sm font-medium text-red-600">{stockMessage}</p>}
              </div>

              <Options
                sizes={data.sizes}
                colors={data.colors}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                colRef={colRef}
                sizeRef={sizeRef}
                cartItemData={cartItemData}
              />

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  disabled={outOfStock || btnLoading}
                  onClick={() => itemStateUpdate('cart')}
                  className="h-12 w-48 rounded-lg bg-yellow-400 font-semibold transition hover:border-2 hover:border-yellow-400 hover:bg-white disabled:cursor-not-allowed disabled:bg-gray-200"
                >
                  {btnLoading ? 'Loading...' : 'ADD TO CART'}
                </button>
                <button
                  disabled={outOfStock || quantity > maxQuantity}
                  onClick={() => router.push(`/checkout/${data.productid}/${selectedSize.sizeid}/${selectedColor.colorid}?qty=${quantity}`)}
                  className="h-12 w-48 rounded-lg border-2 border-yellow-400 font-semibold transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                >
                  BUY NOW
                </button>
              </div>

              <button onClick={() => itemStateUpdate('wishlist')} className="mt-6 flex items-center gap-2 text-gray-600 hover:text-yellow-500">
                <HeartIcon className="h-5 w-5" /> Add to wishlist
              </button>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold">Description:</h2>
            <p className="mt-3 leading-7 text-gray-700">{data.description}</p>
          </div>

          <div ref={reviewRef} className="mt-10">
            <ReviewSection
              data={data.reviews || []}
              reviewCount={data.reviewcount || 0}
              setloading={setLoading}
              setdialogType={setDialogType}
              setselectedReview={setSelectedReview}
              setselectedRating={setSelectedRating}
              allReview={false}
              productID={data.productid}
            />
          </div>
        </div>
      )}
      {dialogType && (
        <ProductDialogs
          dialogType={dialogType}
          setdialogType={setDialogType}
          setloading={setLoading}
          productID={data.productid}
          selectedReview={selectedReview}
          selectedRating={selectedRating}
          setselectedRating={setSelectedRating}
        />
      )}
    </>
  );
};

export default ProductPage;
