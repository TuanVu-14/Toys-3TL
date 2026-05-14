"use client";

import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface BrandInfoProps {
  brandName?: string;
  manufacturerInfo?: string;
  certifications?: string;
  logoUrl?: string;
}

const BrandInfo: React.FC<BrandInfoProps> = ({
  brandName,
  manufacturerInfo,
  certifications,
  logoUrl,
}) => {
  if (!brandName && !manufacturerInfo && !certifications) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span>🏭</span> Thông tin nhà sản xuất
      </h3>

      <div className="mt-4 space-y-4">
        {/* Thương hiệu */}
        {brandName && (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                  {brandName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Thương hiệu
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {brandName}
              </p>
            </div>
          </div>
        )}

        {/* Thông tin nhà sản xuất */}
        {manufacturerInfo && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-lg">📍</div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Nhà sản xuất
              </p>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {manufacturerInfo}
              </p>
            </div>
          </div>
        )}

        {/* Chứng chỉ an toàn */}
        {certifications && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                  Chứng chỉ an toàn
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {certifications.split(",").map((cert) => {
                    const trimmedCert = cert.trim();
                    return (
                      <span
                        key={trimmedCert}
                        className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
                      >
                        ✓ {trimmedCert}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
        <p className="flex items-start gap-2">
          <span className="font-semibold">ℹ️</span>
          Tất cả sản phẩm được kiểm định chất lượng an toàn trước khi xuất bán.
        </p>
      </div>
    </section>
  );
};

export default BrandInfo;
