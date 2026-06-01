"use client";

import React, { useEffect, useState } from "react";
import {
  createChildProfile,
  deleteChildProfile,
  getBirthdayCoupons,
  getChildProfiles,
  getGiftSuggestions,
  runBirthdayReminderHandler,
  updateChildProfile,
} from "@/app/api/couponsApi";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ChildProfileFormProps {
  userId: number;
}

interface ChildProfile {
  child_id: number;
  user_id: number;
  child_name: string;
  birth_date: string;
  gender?: string | null;
  favorite_category?: string | null;
  favorite_skill?: string | null;
  note?: string | null;
}

interface BirthdayCoupon {
  usercouponid: number;
  userid: number;
  couponid: number;
  child_id: number | null;
  is_used: boolean;
  usedat?: string | null;
  code: string;
  description?: string | null;
  discountpercentage: number;
  maxdiscountamount?: number | null;
  minpurchaseamount?: number | null;
  validfrom?: string | null;
  validuntil?: string | null;
  event_type?: string | null;
  child_name?: string | null;
  birth_date?: string | null;
}

interface GiftSuggestion {
  productid: number;
  title: string;
  price: string | number;
  discount?: string | number | null;
  current_price?: string | number | null;
  imglink?: string | null;
  image_alt?: string | null;
  age_group?: string | null;
  brand?: string | null;
  skill_type?: string | null;
  material?: string | null;
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
}

function normalizeToyPrice(value?: string | number | null) {
  const amount = Number(value || 0);
  if (!amount || amount <= 0) return 0;

  // Một số dữ liệu seed cũ lưu giá kiểu 15, 20 thay vì 150000, 200000.
  // Khi hiển thị gợi ý quà, quy đổi các giá nhỏ này sang VNĐ cho đúng giao diện bán hàng.
  if (amount > 0 && amount < 1000) return amount * 10000;
  return amount;
}

function formatMoney(value?: string | number | null) {
  const amount = normalizeToyPrice(value);
  if (!amount || amount <= 0) return "Liên hệ";
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function getProductPrice(product: GiftSuggestion) {
  const price = Number(product.price || 0);
  const currentPrice = Number(product.current_price || 0);
  const discountPercent = Number(product.discount || 0);

  if (currentPrice > 0) return currentPrice;
  if (price > 0 && discountPercent > 0 && discountPercent < 100) {
    return Math.round(price * (1 - discountPercent / 100));
  }
  return price;
}

function safeImageUrl(value?: string | null) {
  const image = String(value || "").trim();
  const lower = image.toLowerCase();

  if (!image || ["im", "/im", "img", "/img", "null", "undefined"].includes(lower)) {
    return "/images/no-image.png";
  }

  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/") || image.startsWith("data:")) {
    return image;
  }

  return `/images/${image}`;
}

function productImage(product: GiftSuggestion) {
  return safeImageUrl(product.imglink);
}

function getBirthdayStatus(birthDateValue?: string | null) {
  if (!birthDateValue) return "Chưa có ngày sinh";

  const today = new Date();
  const birthDate = new Date(birthDateValue);
  let birthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  if (birthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    birthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diff = birthday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hôm nay là sinh nhật của bé";
  if (days <= 7) return `Còn ${days} ngày nữa đến sinh nhật - hệ thống sẽ tạo mã giảm giá`;
  return `Còn ${days} ngày nữa đến sinh nhật`;
}

const emptyForm = {
  childName: "",
  birthDate: "",
  gender: "",
  favoriteCategory: "",
  favoriteSkill: "",
  note: "",
};

const ChildProfileForm = ({ userId }: ChildProfileFormProps) => {
  const [childName, setChildName] = useState(emptyForm.childName);
  const [birthDate, setBirthDate] = useState(emptyForm.birthDate);
  const [gender, setGender] = useState(emptyForm.gender);
  const [favoriteCategory, setFavoriteCategory] = useState(emptyForm.favoriteCategory);
  const [favoriteSkill, setFavoriteSkill] = useState(emptyForm.favoriteSkill);
  const [note, setNote] = useState(emptyForm.note);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [coupons, setCoupons] = useState<BirthdayCoupon[]>([]);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);

  function resetForm() {
    setChildName("");
    setBirthDate("");
    setGender("");
    setFavoriteCategory("");
    setFavoriteSkill("");
    setNote("");
    setEditingChildId(null);
  }

  async function loadMarketingData() {
    if (!userId) return;

    setPageLoading(true);
    const [childRes, couponRes, suggestionRes] = await Promise.all([
      getChildProfiles(userId),
      getBirthdayCoupons(userId),
      getGiftSuggestions(userId),
    ]);

    if (childRes.status === 200 && childRes.data?.data) setChildren(childRes.data.data);
    if (couponRes.status === 200 && couponRes.data?.data) setCoupons(couponRes.data.data);
    if (suggestionRes.status === 200 && suggestionRes.data?.data) setSuggestions(suggestionRes.data.data);
    setPageLoading(false);
  }

  function handleEdit(child: ChildProfile) {
    setEditingChildId(child.child_id);
    setChildName(child.child_name || "");
    setBirthDate(toInputDate(child.birth_date));
    setGender(child.gender || "");
    setFavoriteCategory(child.favorite_category || "");
    setFavoriteSkill(child.favorite_skill || "");
    setNote(child.note || "");
    setMessage("Đang sửa hồ sơ bé. Sau khi sửa bấm Cập nhật hồ sơ bé.");
  }

  async function handleDelete(child: ChildProfile) {
    const ok = window.confirm(`Bạn có chắc muốn xóa hồ sơ của bé ${child.child_name}?`);
    if (!ok) return;

    setLoading(true);
    setMessage("");

    const response = await deleteChildProfile({ child_id: child.child_id, user_id: userId });

    if (response.status === 200) {
      setMessage("Đã xóa hồ sơ bé.");
      if (editingChildId === child.child_id) resetForm();
      await loadMarketingData();
    } else {
      setMessage(response.data?.message || "Không thể xóa hồ sơ bé.");
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      setMessage("Bạn cần đăng nhập để lưu thông tin bé.");
      return;
    }

    if (!childName || !birthDate) {
      setMessage("Vui lòng nhập tên bé và ngày sinh.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      user_id: userId,
      child_name: childName.trim(),
      birth_date: birthDate,
      gender,
      favorite_category: favoriteCategory,
      favorite_skill: favoriteSkill,
      note,
    };

    const response = editingChildId
      ? await updateChildProfile({ child_id: editingChildId, ...payload })
      : await createChildProfile(payload);

    if (response.status === 201 || response.status === 200) {
      await runBirthdayReminderHandler();
      setMessage(
        editingChildId
          ? "Đã cập nhật hồ sơ bé. Nếu bé sắp sinh nhật trong vòng 7 ngày, hệ thống sẽ tạo/cập nhật nhắc hẹn."
          : "Đã lưu thông tin bé. Nếu bé sắp sinh nhật trong vòng 7 ngày, hệ thống sẽ tạo mã và gửi thông báo.",
      );
      resetForm();
      await loadMarketingData();
    } else {
      setMessage(response.data?.message || "Không thể lưu thông tin bé. Vui lòng thử lại.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMarketingData();
  }, [userId]);

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-5">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="mb-1 text-xl font-semibold">Hồ sơ của bé</h2>
            <p className="text-sm text-gray-500">
              Nhập ngày sinh của bé để hệ thống nhắc sinh nhật, tạo mã giảm giá và gửi thông báo.
            </p>
          </div>
          {editingChildId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4" /> Hủy sửa
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Tên bé *</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Ví dụ: Minh Anh"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-salmon"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Ngày sinh *</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-salmon"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-salmon"
            >
              <option value="">Không chọn</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Sở thích / danh mục yêu thích</label>
            <select
              value={favoriteCategory}
              onChange={(e) => setFavoriteCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-salmon"
            >
              <option value="">Không chọn</option>
              <option value="LEGO">LEGO</option>
              <option value="STEM">STEM</option>
              <option value="Mô hình">Mô hình</option>
              <option value="Nhà bếp">Nhà bếp</option>
              <option value="Búp bê">Búp bê</option>
              <option value="Đồ chơi vận động">Đồ chơi vận động</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Kỹ năng muốn phát triển</label>
            <select
              value={favoriteSkill}
              onChange={(e) => setFavoriteSkill(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-salmon"
            >
              <option value="">Không chọn</option>
              <option value="Tư duy">Tư duy</option>
              <option value="Vận động">Vận động</option>
              <option value="Ngôn ngữ">Ngôn ngữ</option>
              <option value="Sáng tạo">Sáng tạo</option>
              <option value="Giao tiếp">Giao tiếp</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Bé thích xe, robot, màu xanh..."
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-salmon"
            />
          </div>

          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-salmon px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Đang lưu..." : editingChildId ? "Cập nhật hồ sơ bé" : "Thêm hồ sơ bé"}
            </button>
            {editingChildId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        {message && <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-700">{message}</p>}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Hồ sơ bé đã lưu</h3>

        {pageLoading ? (
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        ) : children.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có hồ sơ bé. Hãy thêm ngày sinh để hệ thống nhắc sinh nhật.</p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div key={child.child_id} className="rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold">{child.child_name}</p>
                    <p className="text-gray-600">Ngày sinh: {formatDate(child.birth_date)}</p>
                    <p className="text-gray-600">Giới tính: {child.gender || "Chưa chọn"}</p>
                    {(child.favorite_category || child.favorite_skill || child.note) && (
                      <p className="mt-2 text-gray-600">
                        Sở thích: {child.favorite_category || "N/A"} | Kỹ năng: {child.favorite_skill || "N/A"} {child.note ? `| ${child.note}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="rounded-lg bg-white px-3 py-2 text-orange-700 shadow-sm">
                      {getBirthdayStatus(child.birth_date)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(child)}
                        className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm shadow-sm hover:text-salmon"
                      >
                        <PencilIcon className="h-4 w-4" /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(child)}
                        className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm text-red-600 shadow-sm hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Mã giảm giá sinh nhật</h3>

        {coupons.length === 0 ? (
          <p className="text-sm text-gray-500">Hiện chưa có mã sinh nhật. Mã sẽ được tạo khi sinh nhật của bé còn trong vòng 7 ngày.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((item) => (
              <div key={item.usercouponid || item.couponid} className="rounded-lg border border-dashed border-orange-400 p-4">
                <p className="text-sm">Bé: <b>{item.child_name || "Hồ sơ bé"}</b></p>
                <p className="my-1 text-xl font-bold text-orange-600">{item.code}</p>
                <p className="text-sm">
                  Giảm {Number(item.discountpercentage || 0)}% - Hạn dùng: {formatDate(item.validuntil)}
                </p>
                <p className="text-sm text-gray-600">
                  Đơn tối thiểu: {formatMoney(item.minpurchaseamount)} | Giảm tối đa: {formatMoney(item.maxdiscountamount)}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  Trạng thái: {item.is_used ? "Đã sử dụng" : "Chưa sử dụng"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Gợi ý quà tặng</h3>
            <p className="text-xs text-gray-500">
              Sản phẩm được gợi ý theo độ tuổi, sở thích và kỹ năng trong hồ sơ bé.
            </p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có gợi ý quà tặng.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {suggestions.map((product) => {
              const price = Number(product.price || 0);
              const currentPrice = getProductPrice(product);
              const discountPercent = Number(product.discount || 0);

              return (
                <div key={product.productid} className="flex gap-3 rounded-lg border p-3 text-sm transition hover:border-orange-300 hover:shadow-sm">
                  <img
                    src={productImage(product)}
                    alt={product.image_alt || product.title}
                    className="h-24 w-24 flex-shrink-0 rounded-lg border object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/no-image.png";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold">{product.title}</p>
                    <p className="text-gray-600">Thương hiệu: {product.brand || "N/A"}</p>
                    <p className="text-gray-600">Độ tuổi: {product.age_group || "N/A"}</p>
                    <p className="text-gray-600">Kỹ năng: {product.skill_type || "N/A"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-orange-600">{formatMoney(currentPrice)}</span>
                      {discountPercent > 0 && price > currentPrice ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">{formatMoney(price)}</span>
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                            -{discountPercent}%
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildProfileForm;
