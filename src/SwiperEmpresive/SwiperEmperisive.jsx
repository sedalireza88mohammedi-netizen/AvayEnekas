
import React, { useRef, useState, useEffect } from 'react';
import { Clock, Sparkles, ChevronLeft, ArrowLeft } from 'lucide-react';
import "./SwiperEmperisive.css";
import productsData from '../ProductData';

const toPersianDigits = (num) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => farsiDigits[x]);
};

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ProductCard = ({ product }) => (
  <article className="product-card">
    <div className="product-image-wrapper">
      <img
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
  </article>
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
      <a href="#" className="view-all-link">مشاهده همه <ChevronLeft size={16} /></a>
    </div>
  );
};

export default function EmperiseveSwiper() {
  const swiperRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - swiperRef.current.offsetLeft);
    setScrollLeft(swiperRef.current.scrollLeft);
  };
  const handlePointerLeave = () => setIsDragging(false);
  const handlePointerUp = () => setIsDragging(false);
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - swiperRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (swiperRef.current) swiperRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollByAmount = (amount) => {
    if (swiperRef.current) swiperRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="swiper-container" aria-label="پیشنهادهای شگفت‌انگیز">
      <div className="swiper-wrapper-box">
        <button className="nav-btn prev" onClick={() => scrollByAmount(-300)} aria-label="اسلاید قبلی">
          <ChevronLeft size={20} />
        </button>
        <button className="nav-btn next" onClick={() => scrollByAmount(300)} aria-label="اسلاید بعدی">
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
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
          {productsData.filter((product) => product.Empressive).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          <a href="#" className="end-card" aria-label="مشاهده همه محصولات">
            <div className="end-card-icon-wrapper"><ArrowLeft size={24} /></div>
            <span className="end-card-text">مشاهده همه</span>
          </a>
        </div>
      </div>
    </section>
  );
}