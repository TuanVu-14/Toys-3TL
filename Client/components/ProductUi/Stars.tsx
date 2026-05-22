import React from 'react';

interface StarsProps {
  stars: number;
  size?: number;
}

const Stars: React.FC<StarsProps> = ({ stars, size = 20 }) => {
  const rating = Math.max(0, Math.min(5, Number(stars || 0)));

  return (
    <span
      className="inline-flex items-center leading-none"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          style={{ fontSize: size, lineHeight: 1 }}
          className={index <= Math.round(rating) ? 'text-orange-400' : 'text-gray-300'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default Stars;
