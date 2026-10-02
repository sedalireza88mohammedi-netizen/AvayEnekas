import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSectionSliderProducts, PRODUCT_SECTION_MAP } from '../../api';
import RatingStars from '../../RatingStars';
import SafeImg from '../../SafeImg';
import '../PopulerSwiper/PopulerSwiper.css';

const DRAG_THRESHOLD = 20;

// مسیر صفحه اختصاصی هر بخش ویژه
const SECTION_PAGES = {
  popular: "/Sections/Popular",
  trending: "/Sections/Trending",
  best_seller: "/Sections/BestSeller",
};

const toPersianDigits = (num) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => farsiDigits[x]);
};

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ProductCard = ({ product, onDrag }) => {
  const navigate = useNavigate();
  return (
    <div className="product-card-shell">
      <Link
        to={`/Product/${product.id}`}
        className="product-card"
        draggable="false"
        onClickCapture={(e) => {
          if (onDrag && onDrag()) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          e.preventDefault();
          navigate(`/Product/${product.id}`);
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
            {product.discount > 0 && (
              <span className="old-price">{toPersianDigits(formatPrice(product.oldPrice))}</span>
            )}
            <div className="new-price">
              <span>{toPersianDigits(formatPrice(product.price))}</span>
              <span className="currency">تومان</span>
            </div>
          </div>
          {product.discount > 0 && (
            <div className="discount-badge">{toPersianDigits(product.discount)}٪</div>
          )}
        </div>
      </Link>
    </div>
  );
};

/**
 * اسلایدر عمومی بخش‌های ویژه (محبوب‌ترین، ترندترین، پرفروش‌ترین).
 * فقط محصولاتی را نشان می‌دهد که ادمین برای همین بخش انتخاب کرده است.
 */
export default function SectionSwiper({ section, title }) {
  const meta = PRODUCT_SECTION_MAP[section];
  const swiperRef = useRef(null);
  const dragMoved = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [products, setProducts] = useState(null);

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
    dragMoved.current = false;
  };
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX - swiperRef.current.offsetLeft;
    // حرکت‌های خیلی کوچک (کلیک معمولی) درگ محسوب نمی‌شوند
    if (Math.abs(x - startX) < DRAG_THRESHOLD) return;
    dragMoved.current = true;
    e.preventDefault();
    const walk = (x - startX) * 1.5;
    if (swiperRef.current) swiperRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollByAmount = (amount) => {
    if (swiperRef.current) swiperRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  useEffect(() => {
    let mounted = true;
    fetchSectionSliderProducts(section, 12)
      .then((data) => { if (mounted) setProducts(data); })
      .catch(() => { if (mounted) setProducts([]); });
    return () => { mounted = false; };
  }, [section]);

  // در مرورگرهای RTL اسکرول می‌تواند از انتها شروع شود؛ به ابتدا برگردان
  useEffect(() => {
    if (swiperRef.current) swiperRef.current.scrollLeft = 0;
  }, [products]);

  if (!meta) return null;

  return (
    <>
      <div className="PopulerTitleContainer"><h2>{title || meta.label}</h2></div>
      <div className="BtnNextContainer">
        <button className="nav-btnprevPopuler" onClick={() => scrollByAmount(-300)} aria-label="اسلاید قبلی">
          <ChevronLeft size={20} />
        </button>
        <button className="nav-btnnextprevPopuler" onClick={() => scrollByAmount(300)} aria-label="اسلاید بعدی">
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      <section className="swiper-container" aria-label={meta.label}>
        <div className="swiper-wrapper-box">
          <div
            className="custom-swiper"
            ref={swiperRef}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            {(products || []).map((product) => (
              <ProductCard key={product.id} product={product} onDrag={() => dragMoved.current} />
            ))}
            {products && products.length === 0 && (
              <p className="section-empty">هنوز محصولی برای «{meta.label}» انتخاب نشده است.</p>
            )}
            <Link to={SECTION_PAGES[meta.key]} className="end-card" aria-label="مشاهده همه محصولات این بخش">
              <div className="end-card-icon-wrapper"><ArrowLeft size={24} /></div>
              <span className="end-card-text">مشاهده همه</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}