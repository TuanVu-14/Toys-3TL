"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bannerDataHandler } from "@/app/api/homeData";
import Loading from "./Loading";

interface BannerItem {
  bannerid?: number;
  id?: number;
  imglink: string;
  redirect_link?: string;
  createdat?: Date;
  updatedat?: Date;
}

const AUTOPLAY_TIME = 3000;

const normalizeBannerLink = (link?: string) => {
  const value = String(link || "").trim();

  if (!value || value === "#") return "/";

  // Trong DB có thể lưu /category/lego-building nhưng Next app dùng /categories/[category]
  if (value.startsWith("/category/")) {
    return value.replace("/category/", "/categories/");
  }

  if (
    value.startsWith("/collections/") ||
    value.startsWith("/categories/") ||
    value.startsWith("/sub-category/") ||
    value.startsWith("/product/") ||
    value.startsWith("/search/")
  ) {
    return value;
  }

  // Nếu DB chỉ lưu slug, đưa sang trang search để tránh 404.
  return `/search/${value.replace(/^\/+/, "")}`;
};

const getBannerArray = (responseData: any): BannerItem[] => {
  const banners = responseData?.banners;
  const data = responseData?.data;

  if (Array.isArray(banners)) return banners;
  if (Array.isArray(banners?.data)) return banners.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback(
    (index: number) => {
      if (banners.length === 0) return;
      setCurrentIndex((index + banners.length) % banners.length);
    },
    [banners.length],
  );

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (banners.length === 0) return 0;
      return (prevIndex + 1) % banners.length;
    });
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (banners.length === 0) return 0;
      return (prevIndex - 1 + banners.length) % banners.length;
    });
  }, [banners.length]);

  useEffect(() => {
    let mounted = true;

    async function sync() {
      try {
        const res = await bannerDataHandler();
        if (!mounted) return;

        if (res.status === 200) {
          const result = getBannerArray(res);
          setBanners(result);
          setCurrentIndex(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    sync();

    return () => {
      mounted = false;
    };
  }, []);

  // Banner tự chạy sau mỗi 3 giây. Khi rê chuột vào banner thì tạm dừng.
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (banners.length <= 1 || isHovering) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, AUTOPLAY_TIME);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length, isHovering]);

  if (loading) return <Loading />;
  if (banners.length === 0) return null;

  return (
    <section
      className="group relative mx-auto mt-8 h-[260px] w-[88vw] overflow-hidden rounded-[28px] bg-gray-100 shadow-[0_18px_45px_rgba(15,23,42,0.12)] sm:h-[340px] lg:h-[500px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="flex h-full w-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((each, index) => (
          <button
            key={each.bannerid || each.id || index}
            type="button"
            aria-label={`Open banner ${index + 1}`}
            onClick={() => router.push(normalizeBannerLink(each.redirect_link))}
            className="relative h-full min-w-full overflow-hidden bg-gray-100 text-left"
          >
            <img
              className={`h-full w-full object-cover transition-transform duration-[1800ms] ease-out will-change-transform ${
                index === currentIndex ? "scale-100" : "scale-105"
              }`}
              src={each.imglink}
              alt={`Banner ${index + 1}`}
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 opacity-60" />
          </button>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={prevSlide}
            className="absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-4xl font-light text-gray-800 shadow-lg backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 sm:left-7"
          >
            ‹
          </button>

          <button
            type="button"
            aria-label="Next banner"
            onClick={nextSlide}
            className="absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-4xl font-light text-gray-800 shadow-lg backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 sm:right-7"
          >
            ›
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-sm">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to banner ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  index === currentIndex ? "w-9 bg-white shadow" : "w-2.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Banner;
