import React, { useState, useEffect } from 'react';


interface PropType {
  endTime: string;
}

const DealTime: React.FC<PropType> = ({ endTime }) => {
  const calculateTimeRemaining = () => {
    const now = new Date();
    const end = new Date(endTime);
    const timeDifference = end.getTime() - now.getTime();

    if (timeDifference <= 0) {
      return {
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00'
      };
    }

    const seconds = Math.floor((timeDifference / 1000) % 60).toString().padStart(2, '0');
    const minutes = Math.floor((timeDifference / 1000 / 60) % 60).toString().padStart(2, '0');
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');

    return {
      days,
      hours,
      minutes,
      seconds
    };
  };

  const [timeRemaining, setTimeRemaining] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    setTimeRemaining(calculateTimeRemaining());

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='flex gap-5'>
      <div className='flex flex-col bg-gray-200 w-16 h-16 rounded-2xl items-center justify-center'>
        <p className='text-xl font-semibold'>{timeRemaining.days}</p>
        <p className='text-sm text-davysilver'>Ngày</p>
      </div>
      <div className='flex flex-col bg-gray-200 w-16 h-16 rounded-2xl items-center justify-center'>
        <p className='text-xl font-semibold'>{timeRemaining.hours}</p>
        <p className='text-sm text-davysilver'>Giờ</p>
      </div>
      <div className='flex flex-col bg-gray-200 w-16 h-16 rounded-2xl items-center justify-center'>
        <p className='text-xl font-semibold'>{timeRemaining.minutes}</p>
        <p className='text-sm text-davysilver'>Phút</p>
      </div>
      <div className='flex flex-col bg-gray-200 w-16 h-16 rounded-2xl items-center justify-center'>
        <p className='text-xl font-semibold'>{timeRemaining.seconds}</p>
        <p className='text-sm text-davysilver'>Giây</p>
      </div>
    </div>
  );
};

export default DealTime;
