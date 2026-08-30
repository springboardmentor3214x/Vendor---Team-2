import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0 to 5 (can be fractional for readOnly display)
  onChange?: (newRating: number) => void;
  readOnly?: boolean;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  readOnly = false,
  size = 18,
  showLabel = false,
  className = ""
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(null);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="inline-flex items-center gap-0.5" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= Math.floor(displayRating);
          const isHalf = !isFilled && starIndex === Math.ceil(displayRating) && displayRating % 1 >= 0.4;
          
          return (
            <button
              key={starIndex}
              type="button"
              disabled={readOnly}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              className={`p-0.5 transition-transform duration-100 ${
                readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 focus:outline-none"
              }`}
              title={readOnly ? `${rating} out of 5` : `Rate ${starIndex} out of 5`}
            >
              <Star
                size={size}
                className={
                  isFilled
                    ? "text-amber-500 fill-amber-500"
                    : isHalf
                    ? "text-amber-500 fill-amber-500/50"
                    : "text-slate-300 fill-none"
                }
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="ml-1.5 text-xs font-extrabold text-slate-700 font-mono">
          {Number(rating).toFixed(1)} / 5.0
        </span>
      )}
    </div>
  );
};
