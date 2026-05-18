import React, { useLayoutEffect, useRef, useState } from 'react';
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

const ProductPage = () => {
  const { appState } = useApp();
  const router = useRouter();
  const isLogged = appState.loggedIn;
  const [btnLoading, setBtnLoading] = useState(false);
  const [stockMessage, setStockMessage] = useState('');
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

  const cartItemData = {
    cartItemID: IDGenerator(),
    productID: data.productid,
    productImg: data.imglink,
    productAlt: data.imgalt,
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
    productImg: data.imglink,
    productAlt: data.imgalt,
    productName: data.title,
    productPrice: Number(data.discountedprice || 0),
  };

  async function dataRequest() {
    setLoading(true);
    const response = await productDataHandler({ productID: params.productID });
    switch (response.status) {
      case 200:
        dataVar.current = response.data.data;
        setDataChecked(true);
        break;
      case 500:
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
    setSelectedImage({ imgLink: data.imglink, imgAlt: data.imgalt });
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
        setBtnLoading(false);
        break;
      }
      case 'wishlist':
        if (isLogged) {
          await wishlistAddHandler({
            wishlistItemID: wishlistItem.wishlistItemID,
            userID: defaultAccount.userID,
            productID: data.productid,
          });
        }
        dispatch(addItemToWishlist(wishlistItem));
        setBtnLoading(false);
        break;
    }
  }

  function categoryLink(maincategory: string, category: string) {
    const splitCat = category.split(' ').join('-');
    return `/sub-category/${maincategory}/${splitCat}`;
  }

  return (
    <>
      {loading && <Loading />}
      {!dataChecked && <Loading />}
      {dataChecked && !found.current && <ProductNotFound />}
      {dataChecked && data && found.current && (
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-8 text-sm font-medium">
            <Link href={categoryLink(data.categories.maincategory, data.categories.subcategory)}>
              {data.categories.maincategory} &gt; {data.categories.subcategory}
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <img src={selectedImage.imgLink || data.imglink} alt={selectedImage.imgAlt || data.imgalt} className="w-full rounded-xl object-cover" />
              <div className="mt-4 flex justify-center gap-3">
                {data.imgcollection.map((each) => (
                  <button key={each.imageid} onClick={() => setSelectedImage({ imgLink: each.imglink, imgAlt: each.imgalt })}>
                    <img src={each.imglink} alt={each.imgalt} className="h-14 w-20 rounded-md object-cover ring-1 ring-gray-200" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
              <p className="mt-2 text-sm text-gray-500">By {data.seller}</p>
              <button onClick={handleReviewClick} className="mt-3 flex items-center gap-3 text-sm">
                <span>{data.stars}</span>
                <Stars stars={data.stars} />
                <span className="text-indigo-600">{data.reviewcount} reviews</span>
              </button>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-red-600">{formatPrice(data.discountedprice)}</p>
                  {Number(data.price) > Number(data.discountedprice) && (
                    <p className="text-gray-400 line-through">{formatPrice(data.price)}</p>
                  )}
                  {Number(data.discount || 0) > 0 && <p className="text-yellow-600">{Number(data.discount)}% off</p>}
                </div>
                <p className="mt-4 font-medium">
                  {outOfStock ? 'Out of stock' : `In stock: còn ${data.stock} sản phẩm, giao trong 5 ngày làm việc`}
                </p>
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
                  <button onClick={() => changeValue('decrease')} className="w-12 rounded-l-lg bg-gray-100 text-3xl">-</button>
                  <span className="w-12 bg-gray-100 py-2 text-center">{quantity}</span>
                  <button onClick={() => changeValue('increase')} className="w-12 rounded-r-lg bg-gray-100 text-3xl">+</button>
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
              data={data.reviews}
              reviewCount={data.reviewcount}
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
