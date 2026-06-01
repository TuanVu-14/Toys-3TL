"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
} from "@/app/api/admin";
import { formatPrice } from "@/features/UIUpdates/CartWishlist";

type AdminProduct = {
  productid: number;
  title: string;
  description?: string | null;
  categoryid?: number | null;
  category?: string | null;
  price: number;
  discount: number;
  stock: number;
  tags?: string | null;
  imgid?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  age_group?: string | null;
  gender?: string | null;
  material?: string | null;
  skill_type?: string | null;
  brand?: string | null;
  safety_certificates?: string | null;
  low_stock_threshold?: number | null;
  supplier_id?: number | null;
  is_active?: boolean;
  isnew?: boolean;
  issale?: boolean;
  isdiscount?: boolean;
  stars?: number;
};

type Category = { categoryid: number; name: string };

type ProductFormData = {
  title: string;
  description: string;
  categoryid: number;
  price: number;
  discount: number;
  stock: number;
  tags: string;
  imgid: string;
  image_url: string;
  age_group: string;
  gender: string;
  material: string;
  skill_type: string;
  brand: string;
  safety_certificates: string;
  low_stock_threshold: number;
  supplier_id: string;
  isnew: boolean;
  issale: boolean;
  isdiscount: boolean;
  stars: number;
  is_active: boolean;
};

const emptyForm: ProductFormData = {
  title: "",
  description: "",
  categoryid: 0,
  price: 0,
  discount: 0,
  stock: 0,
  tags: "",
  imgid: "",
  image_url: "",
  age_group: "3-5",
  gender: "unisex",
  material: "abs_plastic",
  skill_type: "STEM",
  brand: "",
  safety_certificates: "",
  low_stock_threshold: 10,
  supplier_id: "",
  isnew: false,
  issale: false,
  isdiscount: false,
  stars: 0,
  is_active: true,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-rose-200 px-4 py-2 text-sm outline-none focus:border-rose-500";

function finalPrice(product: AdminProduct) {
  const price = Number(product.price || 0);
  const discount = Math.min(Math.max(Number(product.discount || 0), 0), 100);
  return price * (1 - discount / 100);
}

function productImage(product: Pick<AdminProduct, "image_url" | "imgid">) {
  return product.image_url || product.imgid || "/images/no-image.png";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  // preview ảnh được chọn từ file
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);
      setProducts(productsRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
    } catch (err) {
      setError(
        "Không lấy được sản phẩm. Kiểm tra server, token admin hoặc SQL bổ sung.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((p) =>
      [p.title, p.category, p.brand, p.age_group, p.skill_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [products, search]);

  const handleOpenForm = (product?: AdminProduct) => {
    if (product) {
      setEditingProduct(product);
      const imageUrl = product.image_url || product.imgid || "";
      setFormData({
        title: product.title || "",
        description: product.description || "",
        categoryid: Number(product.categoryid || 0),
        price: Number(product.price || 0),
        discount: Number(product.discount || 0),
        stock: Number(product.stock || 0),
        tags: product.tags || "",
        imgid: product.imgid || "",
        image_url: imageUrl,
        age_group: product.age_group || "3-5",
        gender: product.gender || "unisex",
        material: product.material || "abs_plastic",
        skill_type: product.skill_type || "STEM",
        brand: product.brand || "",
        safety_certificates: product.safety_certificates || "",
        low_stock_threshold: Number(product.low_stock_threshold || 10),
        supplier_id: product.supplier_id ? String(product.supplier_id) : "",
        isnew: !!product.isnew,
        issale: !!product.issale,
        isdiscount: !!product.isdiscount,
        stars: Number(product.stars || 0),
        is_active: product.is_active !== false,
      });
      setImagePreview(imageUrl);
    } else {
      setEditingProduct(null);
      setFormData({ ...emptyForm, categoryid: categories[0]?.categoryid || 0 });
      setImagePreview("");
    }
    setShowForm(true);
  };

  // Lưu ý: backend hiện lưu đường dẫn ảnh dạng varchar(255), không lưu trực tiếp base64.
  // Vì vậy file chọn từ máy chỉ dùng để xem trước; khi lưu hãy nhập đường dẫn ảnh ở ô bên dưới
  // ví dụ: /images/car.jpg hoặc https://...
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPG, PNG, WEBP, ...).");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setError("Ảnh vừa chọn chỉ là xem trước. Hãy nhập đường dẫn ảnh /images/... hoặc URL để lưu vào database.");
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, image_url: "", imgid: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...formData,
      price: Number(formData.price),
      discount: Number(formData.discount),
      stock: Number(formData.stock),
      low_stock_threshold: Number(formData.low_stock_threshold || 10),
      supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
      image_url: (formData.image_url || formData.imgid || "").trim(),
      image_alt: formData.title,
    };

    try {
      if (editingProduct)
        await updateAdminProduct(editingProduct.productid, payload);
      else await createAdminProduct(payload);
      await fetchProducts();
      setShowForm(false);
    } catch {
      setError(
        "Không lưu được sản phẩm. Kiểm tra các trường bắt buộc và database.",
      );
    }
  };

  const handleDelete = async (productID: number) => {
    if (
      !confirm(
        "Ẩn sản phẩm này khỏi cửa hàng? Sản phẩm đã bán sẽ vẫn giữ lịch sử đơn hàng.",
      )
    )
      return;
    try {
      await deleteAdminProduct(productID);
      await fetchProducts();
    } catch {
      setError("Không ẩn được sản phẩm.");
    }
  };

  const stockClass = (product: AdminProduct) => {
    const threshold = Number(product.low_stock_threshold || 10);
    if (product.stock <= threshold) return "bg-rose-100 text-rose-700";
    if (product.stock <= threshold * 2) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-500">
            Quản trị danh mục sản phẩm
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            Quản lý sản phẩm đồ chơi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý giá, tồn kho, độ tuổi, kỹ năng, chất liệu và chứng nhận an
            toàn.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, thương hiệu, độ tuổi..."
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-rose-500"
          />
          <button
            onClick={fetchProducts}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Tải lại
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">Sản phẩm</th>
              <th className="px-5 py-4">Phân loại</th>
              <th className="px-5 py-4">Giá</th>
              <th className="px-5 py-4">Kho</th>
              <th className="px-5 py-4">An toàn</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  className="px-5 py-8 text-center text-slate-500"
                  colSpan={6}
                >
                  Đang tải...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-8 text-center text-slate-500"
                  colSpan={6}
                >
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.productid}
                  className={
                    product.is_active === false ? "bg-slate-50 opacity-60" : ""
                  }
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={productImage(product)}
                        alt={product.image_alt || product.title}
                        className="h-16 w-16 rounded-xl border border-slate-100 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">
                          {product.title}
                        </div>
                        <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {product.description || "Chưa có mô tả"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                      {product.isnew ? (
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                          New
                        </span>
                      ) : null}
                      {product.issale ? (
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-600">
                          Sale
                        </span>
                      ) : null}
                      {product.is_active === false ? (
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600">
                          Đã ẩn
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>{product.category || "Chưa phân loại"}</div>
                    <div className="text-xs text-slate-400">
                      {product.age_group || "—"} • {product.gender || "unisex"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {product.skill_type || "—"} • {product.brand || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      {formatPrice(finalPrice(product))}
                    </div>
                    <div className="text-xs text-slate-400 line-through">
                      {formatPrice(Number(product.price || 0))}
                    </div>
                    {Number(product.discount || 0) > 0 ? (
                      <div className="text-xs font-semibold text-rose-500">
                        -{product.discount}%
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${stockClass(product)}`}
                    >
                      {product.stock} / ngưỡng{" "}
                      {product.low_stock_threshold || 10}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    <div>{product.material || "—"}</div>
                    <div>
                      {product.safety_certificates || "Chưa nhập chứng nhận"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleOpenForm(product)}
                      className="mr-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product.productid)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Ẩn
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleSubmitForm}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Tên sản phẩm
                <input
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Danh mục
                <select
                  required
                  value={formData.categoryid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryid: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                >
                  <option value={0}>Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryid} value={cat.categoryid}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Mô tả
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={inputClass}
                  rows={3}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Giá
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Giảm giá %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Tồn kho
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Ngưỡng cảnh báo tồn thấp
                <input
                  type="number"
                  min={0}
                  value={formData.low_stock_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      low_stock_threshold: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Độ tuổi
                <select
                  value={formData.age_group}
                  onChange={(e) =>
                    setFormData({ ...formData, age_group: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="0-2">0-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-8">6-8</option>
                  <option value="9-12">9-12</option>
                  <option value="12+">12+</option>
                  <option value="All">All</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Giới tính
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="unisex">Mọi giới tính</option>
                  <option value="boy">Bé trai</option>
                  <option value="girl">Bé gái</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Chất liệu
                <input
                  value={formData.material}
                  onChange={(e) =>
                    setFormData({ ...formData, material: e.target.value })
                  }
                  className={inputClass}
                  placeholder="abs_plastic, wood, fabric..."
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Kỹ năng phát triển
                <input
                  value={formData.skill_type}
                  onChange={(e) =>
                    setFormData({ ...formData, skill_type: e.target.value })
                  }
                  className={inputClass}
                  placeholder="STEM, tư duy, vận động..."
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Thương hiệu
                <input
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Mã nhà cung cấp
                <input
                  value={formData.supplier_id}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier_id: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Chứng nhận an toàn
                <textarea
                  value={formData.safety_certificates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safety_certificates: e.target.value,
                    })
                  }
                  className={inputClass}
                  rows={2}
                  placeholder="CE, EN71, ASTM..."
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Tags
                <input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className={inputClass}
                />
              </label>

              {/* ─── Upload ảnh chính ─────────────────────────────────────── */}
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-slate-700">
                  Ảnh chính sản phẩm
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Preview */}
                  {imagePreview ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={imagePreview}
                        alt="Preview ảnh sản phẩm"
                        className="h-40 w-40 rounded-2xl border-2 border-rose-100 object-cover shadow"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow hover:bg-rose-600"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 text-xs text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}

                  {/* URL ảnh + xem trước */}
                  <div className="flex flex-1 flex-col gap-3">
                    <label className="text-sm font-semibold text-slate-700">
                      Đường dẫn ảnh để lưu
                      <input
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value, imgid: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        className={inputClass}
                        placeholder="/images/ten-anh.jpg hoặc https://..."
                      />
                    </label>
                    <label
                      htmlFor="product-image-upload"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 px-4 py-5 text-center transition hover:border-rose-400 hover:bg-rose-100"
                    >
                      <span className="text-2xl">📷</span>
                      <span className="mt-1 text-sm font-semibold text-rose-500">Xem trước ảnh từ máy</span>
                      <span className="mt-1 text-xs text-slate-400">Không lưu base64 vào database</span>
                    </label>
                    <input id="product-image-upload" ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange}/>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isnew}
                  onChange={(e) =>
                    setFormData({ ...formData, isnew: e.target.checked })
                  }
                />{" "}
                Hàng mới
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.issale}
                  onChange={(e) =>
                    setFormData({ ...formData, issale: e.target.checked })
                  }
                />{" "}
                Đang giảm giá
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isdiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, isdiscount: e.target.checked })
                  }
                />{" "}
                Có chiết khấu
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />{" "}
                Đang bán
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 font-semibold text-white hover:bg-rose-600"
              >
                {editingProduct ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
