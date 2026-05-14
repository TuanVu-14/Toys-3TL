import React from "react";
import ReactStars from "react-stars";

const inputClass =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500";

const labelClass = "block mb-2 text-sm font-medium text-gray-900 dark:text-white";

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
  return (
    <div className={`${!mobileMode ? "hidden" : "flex"} lg:flex-col lg:flex`}>
      <form onSubmit={filterSubmit} className="flex flex-col justify-between flex-1">
        <div className="space-y-6">
          <div className="space-y-2">
            <h6 className="text-base font-medium text-black dark:text-white">Prices</h6>

            <div className="flex items-center justify-between col-span-2 space-x-3">
              <div className="w-full">
                <label className={labelClass}>From</label>
                <input
                  type="number"
                  id="pricefrom"
                  name="pricefrom"
                  defaultValue={0}
                  min="0"
                  max="10000"
                  className={inputClass}
                  placeholder="minimum price"
                  required
                />
              </div>

              <div className="w-full">
                <label className={labelClass}>To</label>
                <input
                  type="number"
                  id="priceto"
                  name="priceto"
                  defaultValue={10000}
                  min="1"
                  max="10000"
                  className={inputClass}
                  placeholder="max price"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h6 className="text-base font-medium text-black dark:text-white">
              Product Catalog
            </h6>

            <div>
              <label className={labelClass}>Độ tuổi</label>
              <select name="age_group" defaultValue="" className={inputClass}>
                <option value="">Tất cả độ tuổi</option>
                <option value="0-3">0 - 3 tuổi</option>
                <option value="3-6">3 - 6 tuổi</option>
                <option value="6-12">6 - 12 tuổi</option>
                <option value="12+">12+ tuổi</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Giới tính</label>
              <select name="gender" defaultValue="" className={inputClass}>
                <option value="">Tất cả</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Chất liệu</label>
              <select name="material" defaultValue="" className={inputClass}>
                <option value="">Tất cả chất liệu</option>
                <option value="Gỗ">Gỗ</option>
                <option value="Nhựa ABS">Nhựa ABS</option>
                <option value="Vải">Vải</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Kỹ năng phát triển</label>
              <select name="skill_type" defaultValue="" className={inputClass}>
                <option value="">Tất cả kỹ năng</option>
                <option value="Tư duy">Tư duy</option>
                <option value="Vận động">Vận động</option>
                <option value="Ngôn ngữ">Ngôn ngữ</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Thương hiệu</label>
              <select name="brand" defaultValue="" className={inputClass}>
                <option value="">Tất cả thương hiệu</option>
                <option value="LEGO Technic">LEGO Technic</option>
                <option value="LEGO City">LEGO City</option>
                <option value="LEGO Star Wars">LEGO Star Wars</option>
                <option value="LEGO Creator">LEGO Creator</option>
                <option value="LEGO DUPLO">LEGO DUPLO</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Bộ sưu tập</label>
              <select name="collection_id" defaultValue="" className={inputClass}>
                <option value="">Tất cả bộ sưu tập</option>
                <option value="1">Đồ chơi STEM</option>
                <option value="2">Đồ chơi mô hình</option>
                <option value="3">Đồ chơi nhà bếp</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <h6 className="text-base font-medium text-black dark:text-white">
              Minimum Rating
            </h6>

            {[5, 4, 3, 2, 1].map((rating) => (
              <div className="flex items-center" key={rating}>
                <input
                  id={`${rating}-stars`}
                  type="radio"
                  name="rating"
                  value={rating}
                  defaultChecked={rating === 5}
                  className="w-4 h-4 bg-gray-100 accent-primary-500 border-gray-300 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label className="flex items-center ml-2">
                  <ReactStars
                    count={5}
                    size={20}
                    value={rating}
                    color2={"#ffa500"}
                    edit={false}
                    className="flex gap-1"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-0 left-0 flex justify-center w-full pb-4 mt-6 space-x-4 md:px-4">
          <button
            type="submit"
            disabled={!dataChecked}
            className="w-full px-5 py-2 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-700 dark:hover:bg-primary-800 dark:focus:ring-primary-800"
          >
            Apply filters
          </button>

          <button
            type="button"
            onClick={toggleClear}
            disabled={!dataChecked}
            className="w-full px-5 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            Clear all
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterSidebar;