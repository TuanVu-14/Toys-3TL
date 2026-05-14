"use client";

import React, { useEffect, useState } from "react";
import {
  createChildProfile,
  getBirthdayCoupons,
  getChildProfiles,
  getGiftSuggestions,
} from "@/app/api/couponsApi";

interface ChildProfileFormProps {
  userId: number;
}

interface ChildProfile {
  child_id: number;
  user_id: number;
  child_name: string;
  birth_date: string;
  gender: string;
}

interface BirthdayCoupon {
  child: {
    child_id: number;
    child_name: string;
    birth_date: string;
    gender: string;
  };
  coupon: {
    coupon_id: number;
    code: string;
    discount_percent: number;
    expires_at: string;
  };
}

interface GiftSuggestion {
  productid: number;
  title: string;
  price: string;
  discount: string;
  age_group?: string;
  brand?: string;
  skill_type?: string;
  material?: string;
}

const ChildProfileForm = ({ userId }: ChildProfileFormProps) => {
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [coupons, setCoupons] = useState<BirthdayCoupon[]>([]);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);

  async function loadMarketingData() {
    if (!userId) return;

    const [childRes, couponRes, suggestionRes] = await Promise.all([
      getChildProfiles(userId),
      getBirthdayCoupons(userId),
      getGiftSuggestions(userId),
    ]);

    if (childRes.status === 200 && childRes.data?.data) {
      setChildren(childRes.data.data);
    }

    if (couponRes.status === 200 && couponRes.data?.data) {
      setCoupons(couponRes.data.data);
    }

    if (suggestionRes.status === 200 && suggestionRes.data?.data) {
      setSuggestions(suggestionRes.data.data);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!childName || !birthDate) {
      setMessage("Vui lòng nhập tên bé và ngày sinh.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await createChildProfile({
      user_id: userId,
      child_name: childName,
      birth_date: birthDate,
      gender,
    });

    if (response.status === 201 || response.status === 200) {
      setMessage("Đã lưu thông tin bé thành công.");
      setChildName("");
      setBirthDate("");
      setGender("");
      await loadMarketingData();
    } else {
      setMessage("Không thể lưu thông tin bé. Vui lòng thử lại.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMarketingData();
  }, [userId]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Thông tin bé
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">
              Tên bé
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Ví dụ: Minh Anh"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Ngày sinh
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Giới tính
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            >
              <option value="">Không chọn</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
            >
              {loading ? "Đang lưu..." : "Lưu thông tin bé"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-4 text-sm font-medium text-primary-700">
            {message}
          </p>
        )}
      </div>

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-3">
          Hồ sơ bé đã lưu
        </h3>

        {children.length === 0 ? (
          <p className="text-sm text-gray-500">
            Chưa có hồ sơ bé.
          </p>
        ) : (
          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.child_id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg bg-gray-50 p-3 text-sm"
              >
                <span>
                  <b>{child.child_name}</b> - {child.gender || "Chưa chọn giới tính"}
                </span>
                <span>
                  Ngày sinh: {new Date(child.birth_date).toLocaleDateString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-3">
          Mã giảm giá sinh nhật
        </h3>

        {coupons.length === 0 ? (
          <p className="text-sm text-gray-500">
            Hiện chưa có mã sinh nhật. Mã sẽ được tạo khi sinh nhật của bé còn trong vòng 7 ngày.
          </p>
        ) : (
          <div className="space-y-3">
            {coupons.map((item) => (
              <div
                key={item.coupon.coupon_id}
                className="rounded-lg border border-dashed border-primary-500 p-4"
              >
                <p className="text-sm">
                  Bé: <b>{item.child.child_name}</b>
                </p>
                <p className="text-xl font-bold text-primary-700">
                  {item.coupon.code}
                </p>
                <p className="text-sm">
                  Giảm {item.coupon.discount_percent}% - Hạn dùng:{" "}
                  {new Date(item.coupon.expires_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-3">
          Gợi ý quà tặng
        </h3>

        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Chưa có gợi ý quà tặng.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.map((product) => (
              <div
                key={product.productid}
                className="rounded-lg border p-4 text-sm"
              >
                <p className="font-semibold line-clamp-2">
                  {product.title}
                </p>
                <p>Thương hiệu: {product.brand || "N/A"}</p>
                <p>Độ tuổi: {product.age_group || "N/A"}</p>
                <p>Kỹ năng: {product.skill_type || "N/A"}</p>
                <p className="font-semibold text-primary-700 mt-2">
                  ${product.discount || product.price}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildProfileForm;
