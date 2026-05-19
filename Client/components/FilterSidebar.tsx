"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactStars from "react-stars";
import { catalogFilterOptionsHandler } from "@/app/api/filter";

const inputClass =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5";
const labelClass = "block mb-2 text-sm font-medium text-gray-900";

type Brand = {
  brand_id: number;
  name: string;
};

type Collection = {
  collection_id: number;
  name: string;
};

type FilterOptions = {
  ageGroups: string[];
  genders: { value: string; label: string }[];
  materials: string[];
  skillTypes: string[];
  brands: Brand[];
  collections: Collection[];
};

const fallbackOptions: FilterOptions = {
  ageGroups: ["1-3", "2-5", "3-6", "4-8", "5-10", "6-12"],
  genders: [
    { value: "Boys", label: "Bé trai" },
    { value: "Girls", label: "Bé gái" },
    { value: "Unisex", label: "Unisex" },
  ],
  materials: ["ABS Plastic", "Fabric", "Paper", "Plastic", "Rubber", "Wood"],
  skillTypes: ["Creativity", "Logic", "Motor Skills", "Music", "Social Skills", "STEM"],
  brands: [
    { brand_id: 1, name: "LEGO" },
    { brand_id: 2, name: "Fisher-Price" },
    { brand_id: 3, name: "Melissa & Doug" },
    { brand_id: 4, name: "Hot Wheels" },
    { brand_id: 5, name: "VTech" },
    { brand_id: 6, name: "PlayActive" },
  ],
  collections: [
    { collection_id: 1, name: "Bán chạy" },
    { collection_id: 2, name: "STEM thông minh" },
    { collection_id: 3, name: "Quà Noel" },
    { collection_id: 4, name: "Mầm non 2-5 tuổi" },
    { collection_id: 5, name: "Vận động ngoài trời" },
  ],
};

const genderLabel = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized === "boys" || normalized === "boy") return "Bé trai";
  if (normalized === "girls" || normalized === "girl") return "Bé gái";
  if (normalized === "unisex") return "Unisex";
  return value;
};

const normalizeOptions = (data?: Partial<FilterOptions>): FilterOptions => {
  if (!data) return fallbackOptions;

  return {
    ageGroups: data.ageGroups?.length ? data.ageGroups : fallbackOptions.ageGroups,
    genders: data.genders?.length
      ? data.genders.map((item: any) => ({
          value: item.value || item.label,
          label: genderLabel(item.label || item.value),
        }))
      : fallbackOptions.genders,
    materials: data.materials?.length ? data.materials : fallbackOptions.materials,
    skillTypes: data.skillTypes?.length ? data.skillTypes : fallbackOptions.skillTypes,
    brands: data.brands?.length ? data.brands : fallbackOptions.brands,
    collections: data.collections?.length ? data.collections : fallbackOptions.collections,
  };
};

const FilterSidebar = ({
  dataChecked,
  filterSubmit,
  toggleClear,
  mobileMode,
}: {
  dataChecked: boolean;
  filterSubmit: (e: any) => void;
  toggleClear: () => void;
  mobileMode: boolean;
}) => {
  const [options, setOptions] = useState<FilterOptions>(fallbackOptions);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadFilterOptions() {
      const response = await catalogFilterOptionsHandler();
      if (!mounted) return;

      if (response.status === 200 && response.data?.data) {
        setOptions(normalizeOptions(response.data.data));
      }
    }

    loadFilterOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const optionData = useMemo(() => normalizeOptions(options), [options]);

  const handleClear = () => {
    setFormKey((prev) => prev + 1);
    toggleClear();
  };

  return (
    <form
      key={formKey}
      onSubmit={filterSubmit}
      className={`${mobileMode ? "px-5 py-6" : ""} space-y-8`}
    >
      <div>
        <h6 className="mb-4 text-xl font-semibold">Prices</h6>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pricefrom" className={labelClass}>
              From
            </label>
            <input
              id="pricefrom"
              name="pricefrom"
              type="number"
              min={0}
              step={1000}
              defaultValue={0}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="priceto" className={labelClass}>
              To
            </label>
            <input
              id="priceto"
              name="priceto"
              type="number"
              min={0}
              step={1000}
              defaultValue={5000000}
              className={inputClass}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Giá đang lọc theo VNĐ, ví dụ: 0 đến 5000000.
        </p>
      </div>

      <div>
        <h6 className="mb-4 text-xl font-semibold">Product Catalog</h6>

        <div className="space-y-4">
          <div>
            <label htmlFor="age_group" className={labelClass}>
              Độ tuổi
            </label>
            <select id="age_group" name="age_group" defaultValue="" className={inputClass}>
              <option value="">Tất cả độ tuổi</option>
              {optionData.ageGroups.map((age) => (
                <option key={age} value={age}>
                  {age} tuổi
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gender" className={labelClass}>
              Giới tính
            </label>
            <select id="gender" name="gender" defaultValue="" className={inputClass}>
              <option value="">Tất cả giới tính</option>
              {optionData.genders.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="material" className={labelClass}>
              Chất liệu
            </label>
            <select id="material" name="material" defaultValue="" className={inputClass}>
              <option value="">Tất cả chất liệu</option>
              {optionData.materials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="skill_type" className={labelClass}>
              Kỹ năng phát triển
            </label>
            <select id="skill_type" name="skill_type" defaultValue="" className={inputClass}>
              <option value="">Tất cả kỹ năng</option>
              {optionData.skillTypes.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brand" className={labelClass}>
              Thương hiệu
            </label>
            <select id="brand" name="brand" defaultValue="" className={inputClass}>
              <option value="">Tất cả thương hiệu</option>
              {optionData.brands.map((brand) => (
                <option key={brand.brand_id || brand.name} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="collection_id" className={labelClass}>
              Bộ sưu tập
            </label>
            <select id="collection_id" name="collection_id" defaultValue="" className={inputClass}>
              <option value="">Tất cả bộ sưu tập</option>
              {optionData.collections.map((collection) => (
                <option key={collection.collection_id} value={collection.collection_id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h6 className="mb-4 text-xl font-semibold">Minimum Rating</h6>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="radio" name="rating" value="0" defaultChecked />
            <span className="text-sm font-medium text-gray-700">Tất cả đánh giá</span>
          </label>

          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="rating" value={rating} />
              <ReactStars
                count={5}
                size={22}
                value={rating}
                edit={false}
                half={false}
                color2="#f59e0b"
              />
              <span className="text-sm text-gray-500">trở lên</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!dataChecked}
          className="rounded-lg bg-blue-700 px-7 py-3 text-base font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-200 bg-white px-7 py-3 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          Clear all
        </button>
      </div>
    </form>
  );
};

export default FilterSidebar;
