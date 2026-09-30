import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import './RatingStars.css';

function formatFaStars(value) {
  return value.toLocaleString('fa-IR', { maximumFractionDigits: 1 });
}

export default function RatingStars({ rating = 0, size = 14, showValue = true }) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));
  const rounded = Math.round(value * 10) / 10;
  if (rounded <= 0) return null;
  return (
    <div className="rating-single" style={{ gap: Math.max(2, Math.round(size * 0.25)) }}>
      <FontAwesomeIcon icon={faStar} className="rating-single-star" style={{ fontSize: size }} />
      {showValue && (
        <span className="rating-single-value" style={{ fontSize: Math.round(size * 0.9) }}>
          {formatFaStars(rounded)}
        </span>
      )}
    </div>
  );
}