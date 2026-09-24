import React, { useRef, useState, useEffect } from 'react';
import { Clock, Sparkles, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import "./SwiperEmperisive.css";
import { fetchProducts } from '../api';
import RatingStars from '../RatingStars';
import SafeImg from '../SafeImg';
import { FavButton, AddToCartBtn } from '../ProductActions';

const toPersianDigits = (num) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => farsiDigits[x]);
};

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ProductCard = ({ product, onDrag }) => (
  <div className="product-card-shell">
    <Link
      to={`/Product/${product.id}`}
      className="product-card"
      draggable="false"
      onClickCapture={(e) => {
        if (onDrag && onDrag()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="product-image-wrapper">
        <SafeImg
          src={product.image}
          alt={product.title}
          draggable="false"
          loading="lazy"
          width="200"
          height="200"
        />
      </div>
      <div className="product-info-top">
        <h3 className="product-title" title={product.title}>{product.title}</h3>
        <span className="product-subtitle" title={product.subtitle}>{product.subtitle}</span>
      </div>
      <div className="product-rating-row">
        <RatingStars rating={product.rating} size={13} />
      </div>
      <div className="product-price-section">
        <div className="price-details">
          <span className="old-price">{toPersianDigits(formatPrice(product.oldPrice))}</span>
          <div className="new-price">
            <span>{toPersianDigits(formatPrice(product.price))}</span>
            <span className="currency">تومان</span>
          </div>
        </div>
        <div className="discount-badge">{toPersianDigits(product.discount)}٪</div>
      </div>
    </Link>
    <FavButton id={product.id} />
    <AddToCartBtn product={product} />
  </div>
);

const AmazingOfferCard = () => {
  const [timeLeft, setTimeLeft] = useState(18 * 3600 + 13 * 60 + 40);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="amazing-card">
      <div className="cutout-wrapper"><ChevronLeft size={16} /></div>
      <div style={{ alignSelf: 'flex-start' }}><Sparkles size={24} color="white" /></div>
      <div className="amazing-title">
        <h2>پیشنهاد</h2>
        <h3>شگفت انگیز</h3>
      </div>
      <div className="timer-container">
        <div className="timer-tab"><Clock size={16} color="#c28b00" /></div>
        <div className="timer-box">
          <div className="timer-content">
            <div className="time-unit">
              <span className="time-value">{toPersianDigits(seconds.toString().padStart(2, '0'))}</span>
              <span className="time-label">ثانیه</span>
            </div>
            <span className="time-colon">:</span>
            <div className="time-unit">
              <span className="time-value">{toPersianDigits(minutes.toString().padStart(2, '0'))}</span>
              <span className="time-label">دقیقه</span>
            </div>
            <span className="time-colon">:</span>
            <div className="time-unit">
              <span className="time-value">{toPersianDigits(hours.toString().padStart(2, '0'))}</span>
              <span className="time-label">ساعت</span>
            </div>
          </div>
        </div>
      </div>
      <Link to="/Catagoryes" className="view-all-link">مشاهده همه <ChevronLeft size={16} /></Link>
    </div>
  );
};

export default function EmperiseveSwiper() {
  const swiperRef = useRef(null);
  const dragMoved = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragMoved.current = false;
    setIsDragging(true);
    setStartX(e.pageX - swiperRef.current.offsetLeft);
    setScrollLeft(swiperRef.current.scrollLeft);
  };
  const handlePointerLeave = () => {
    setIsDragging(false);
    dragMoved.current = false;
  };
  const handlePointerUp = () => {
    setIsDragging(false);
  };
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX - swiperRef.current.offsetLeft;
    // حرکت‌های خیلی کوچک (کلیک معمولی) درگ محسوب نمی‌شوند
    if (Math.abs(x - startX) < 10) return;
    dragMoved.current = true;
    e.preventDefault();
    const walk = (x - startX) * 1.5;
    if (swiperRef.current) swiperRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollByAmount = (amount) => {
    if (swiperRef.current) swiperRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const [products, setProducts] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchProducts({ featured: true, limit: 12 })
      .then((data) => { if (mounted) setProducts(data); })
      .catch(() => { if (mounted) setProducts([]); });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="swiper-container" aria-label="پیشنهادهای شگفت‌انگیز">
      <div className="swiper-wrapper-box">
        <button className="nav-btn prev" onClick={() => scrollByAmount(300)} aria-label="اسلاید قبلی">
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button className="nav-btn next" onClick={() => scrollByAmount(-300)} aria-label="اسلاید بعدی">
          <ChevronLeft size={20} />
        </button>

        <div
          className={`custom-swiper ${isDragging ? 'dragging' : ''}`}
          ref={swiperRef}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerLeave}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          <AmazingOfferCard />
          {(products || []).filter((product) => product.Empressive).map((product) => (
            <ProductCard key={product.id} product={product} onDrag={() => dragMoved.current} />
          ))}
          <Link to="/Catagoryes" className="end-card" aria-label="مشاهده همه محصولات">
            <div className="end-card-icon-wrapper"><ArrowLeft size={24} /></div>
            <span className="end-card-text">مشاهده همه</span>
          </Link>
        </div>
      </div>
    </section>
  );
}