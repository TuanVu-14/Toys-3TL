import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { bannerDataHandler } from '@/app/api/homeData';
import Loading from './Loading';
import { useRouter } from 'next/navigation';

interface Banner {
  bannerid: number;
  imglink: string;
  redirect_link: string;
  createdat: Date;
  updatedat: Date;
}
const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const data = useRef<Banner[]>([]);
  const [loading, setloading] = useState(true);
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % data.current.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + data.current.length) % data.current.length);
  };
  async function sync(){
    const res = await bannerDataHandler();
    switch (res.status) {
      case 200:
        data.current = res.banners.data;
        setloading(false);
        break;
      default:

        break;
    }
  }
  useLayoutEffect(() => {
    sync();
  }, []);

  useEffect(() => {
  if (data.current.length === 0 || isHovering) return;

  const interval = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % data.current.length);
  }, 5000);

  return () => clearInterval(interval);
}, [data, isHovering]);
  return (
    <div className='relative flex flex-col items-center mt-4 mb-6'>
      <div className='relative max-w-[1300px] overflow-hidden w-full' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <div
          className='flex transition-transform duration-500 relative'
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {loading && <div className='w-screen h-[300px]'>{loading && <div className='absolute left-0 right-0 z-50'><Loading/></div>}</div> }
          {data.current.map((each, index) => (
            <div key={index} className='flex-shrink-0 w-full'>
              <div className='relative'>
                <img
                  onClick={() => router.push(each.redirect_link)}
                  className='max-h-[500px] z-10 rounded-xl object-cover w-full cursor-pointer'
                  src={each.imglink}
                  alt={`Slide ${index + 1}`}
                />
                <div className='absolute z-[15] md:hidden left-14 bottom-0 top-0 mt-auto mb-auto bg-white w-[320px] h-[220px] sm:w-[520px] sm:h-[220px] opacity-50 rounded-xl'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded focus:outline-none'
        onClick={prevSlide}
      >
        &#10094;
      </button>
      <button
        className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded focus:outline-none'
        onClick={nextSlide}
      >
        &#10095;
      </button>
    </div>
  );
};

export default Banner;
