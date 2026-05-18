import React from 'react';

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

interface Props {
  sizes: ProductSize[];
  colors: ProductColor[];
  selectedColor: ProductColor;
  setSelectedColor: (color: ProductColor) => void;
  selectedSize: ProductSize;
  setSelectedSize: (size: ProductSize) => void;
  colRef: React.MutableRefObject<string>;
  sizeRef: React.MutableRefObject<string>;
  cartItemData?: any;
}

const Options = ({
  sizes,
  colors,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  colRef,
  sizeRef,
}: Props) => {
  const handleColor = (color: ProductColor) => {
    setSelectedColor(color);
    colRef.current = color.colorname;
  };

  const handleSize = (size: ProductSize) => {
    if (!size.instock) return;
    setSelectedSize(size);
    sizeRef.current = size.sizename;
  };

  return (
    <div className="mt-6 space-y-5">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 font-medium text-gray-900">Color</p>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.colorid}
                type="button"
                aria-label={color.colorname}
                title={color.colorname}
                onClick={() => handleColor(color)}
                className={`h-10 w-10 rounded-full border ${color.colorclass || ''} ${
                  selectedColor.colorid === color.colorid ? 'ring-2 ring-indigo-600 ring-offset-2' : 'ring-1 ring-gray-200'
                }`}
              >
                <span className="sr-only">{color.colorname}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-2 font-medium text-gray-900">Size</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sizes.map((size) => (
              <button
                key={size.sizeid}
                type="button"
                disabled={!size.instock}
                onClick={() => handleSize(size)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold uppercase transition ${
                  selectedSize.sizeid === size.sizeid
                    ? 'border-indigo-600 text-indigo-600 ring-1 ring-indigo-600'
                    : 'border-gray-200 text-gray-900 hover:bg-gray-50'
                } ${!size.instock ? 'cursor-not-allowed bg-gray-50 text-gray-300 line-through' : ''}`}
              >
                {size.sizename}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Options;
