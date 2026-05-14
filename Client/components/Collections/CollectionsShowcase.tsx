"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

interface Collection {
  collectionid: number;
  name: string;
  slug: string;
  description?: string;
  banner_url?: string;
  icon_url?: string;
  product_count?: number;
}

const CollectionsShowcase: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/collections`,
        );
        if (response.data?.data) {
          // Lọc chỉ hiển thị những collection đang hoạt động
          const activeCollections = response.data.data.filter(
            (col: any) => col.is_active !== false,
          );
          setCollections(activeCollections);
        }
      } catch (err) {
        console.error("Error fetching collections:", err);
        setError("Không thể tải bộ sưu tập");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-slate-200 h-40"
          />
        ))}
      </div>
    );
  }

  if (error || collections.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          🎯 Bộ sưu tập nổi bật
        </h2>
        <p className="mt-2 text-slate-600">
          Khám phá những chủ đề sản phẩm yêu thích của bạn
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {collections.map((collection) => (
          <Link
            key={collection.collectionid}
            href={`/collections/${collection.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-4 transition-all hover:shadow-lg"
          >
            {/* Background banner */}
            {collection.banner_url ? (
              <div className="absolute inset-0">
                <img
                  src={collection.banner_url}
                  alt={collection.name}
                  className="h-full w-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                />
              </div>
            ) : null}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-40 text-center">
              {/* Icon */}
              {collection.icon_url ? (
                <img
                  src={collection.icon_url}
                  alt={collection.name}
                  className="mb-3 h-12 w-12 object-cover rounded-lg"
                />
              ) : (
                <div className="mb-3 h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-xl">
                  📦
                </div>
              )}

              {/* Name */}
              <h3 className="font-semibold text-slate-900 line-clamp-2">
                {collection.name}
              </h3>

              {/* Product count */}
              <p className="mt-2 text-xs text-slate-600">
                {collection.product_count || 0} sản phẩm
              </p>

              {/* Arrow */}
              <div className="mt-3 transform transition-transform group-hover:translate-x-1">
                <svg
                  className="h-5 w-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CollectionsShowcase;
