import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import './RatingStars.css';

export default function RatingStars({ rating = 0, size = 14, showValue = true }) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));
  return (
    <div className="rating-stars" style={{ gap: Math.max(1, Math.round(size * 0.15)) }} aria-label={`امتیاز ${value} از ۵`}>
      <div className="rating-stars-track" style={{ fontSize: size, width: size * 5 + Math.round(size * 0.15) * 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <FontAwesomeIcon key={i} icon={faStar} className="rating-stars-empty" style={{ fontSize: size }} />
        ))}
        <div className="rating-stars-fill" style={{ width: `${(value / 5) * 100}%` }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <FontAwesomeIcon key={i} icon={faStar} className="rating-stars-full" style={{ fontSize: size }} />
          ))}
        </div>
      </div>
      {showValue && <span className="rating-stars-value" style={{ fontSize: Math.round(size * 0.85) }}>{value.toLocaleString('fa-IR')}</span>}
    </div>
  );
}