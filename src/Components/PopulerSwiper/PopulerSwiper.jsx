
import React, { useRef, useState, useEffect } from 'react';
import { Clock, Sparkles, ChevronLeft, ArrowLeft } from 'lucide-react';
import "./PopulerSwiper.css";
import productsData from '../../ProductData';

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






export default function PopularSlider() {
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

    return (<>
   
        <div className="BtnNextContainer">
            <button className="nav-btnprevPopuler" onClick={() => scrollByAmount(-300)} aria-label="اسلاید قبلی">
                <ChevronLeft size={20} />
            </button>
            <button className="nav-btnnextprevPopuler" onClick={() => scrollByAmount(300)} aria-label="اسلاید بعدی">
                <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
        </div>
        <div className='PopulerTitleContainer'><h2>محبوب ترین ها</h2></div>
 
        <section className="swiper-container" aria-label="پیشنهادهای شگفت‌انگیز">
            <div className="swiper-wrapper-box">


                <div
                    className={`custom-swiper ${isDragging ? 'dragging' : ''}`}
                    ref={swiperRef}
                    onPointerDown={handlePointerDown}
                    onPointerLeave={handlePointerLeave}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                >

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
    </>
    );
}