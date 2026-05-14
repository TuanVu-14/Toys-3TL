"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

interface ProductCollection {
  collectionid: number;
  name: string;
  slug: string;
  icon_url?: string;
}

const ProductCollections: React.FC<{ productId: number }> = ({ productId }) => {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        // Giả sử API trả về collections của sản phẩm
        // Có thể cần thêm endpoint riêng hoặc lấy từ product details
        // const response = await axios.get(
        //   `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/collections`
        // );
        // setCollections(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching product collections:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchCollections();
    }
  }, [productId]);

  if (loading || collections.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span>📚</span> Bộ sưu tập
      </h3>

      <div className="mt-4 flex flex-wrap gap-2">
        {collections.map((collection) => (
          <Link
            key={collection.collectionid}
            href={`/collections/${collection.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            {collection.icon_url && (
              <img
                src={collection.icon_url}
                alt={collection.name}
                className="h-5 w-5 rounded"
              />
            )}
            {collection.name}
            <span className="ml-1 text-indigo-500">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ProductCollections;
