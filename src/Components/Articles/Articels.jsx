import React, { useRef, useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./Articelse.css"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchArticles } from '../../api';
import SafeImg from '../../SafeImg';

export default function Articelse() {
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        let mounted = true;
        fetchArticles()
            .then((data) => { if (mounted) setArticles(data || []); })
            .catch(() => { if (mounted) setArticles([]); });
        return () => { mounted = false; };
    }, []);

    const CATEGORIES_DATA = articles.map((a) => ({
        id: a.id,
        image: a.coverImage && a.coverImage.url ? a.coverImage.url : '',
        title: a.title,
        link: `/Article/${a.id}`,
    }));

    const [columnsPerView, setColumnsPerView] = useState(4);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const containerRef = useRef(null);

    // دسته‌بندی آیتم‌ها به صورت جفت‌های ۲ ردیفه
    const columns = [];
    for (let i = 0; i < CATEGORIES_DATA.length; i += 1) {
        columns.push(CATEGORIES_DATA.slice(i, i + 1));
    }

    // محاسبه هوشمند تعداد ستون‌ها بر اساس عرض صفحه (Responsive recalculation)
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width >= 1024) {
                setColumnsPerView(4);
            } else if (width >= 640) {
                setColumnsPerView(3);
            } else {
                setColumnsPerView(2);
            }
        };

        handleResize(); // مقداردهی اولیه
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, columns.length - columnsPerView);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    // هندل کردن رویدادهای لمسی در موبایل (Touch Swipe Events)
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 40;
        const isRightSwipe = distance < -40;

        // در ساختار راست‌چین (RTL):
        // کشیدن با دست به سمت راست (isRightSwipe): اسلایدها به راست می‌روند و آیتم‌های بعدی نمایش داده می‌شوند.
        if (isRightSwipe && currentIndex < maxIndex) {
            handleNext();
        }
        // کشیدن با دست به سمت چپ (isLeftSwipe): اسلایدها به چپ می‌روند و آیتم‌های قبلی نمایش داده می‌شوند.
        if (isLeftSwipe && currentIndex > 0) {
            handlePrev();
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // کنترل با کلیدهای آرومپ کیبورد (Keyboard Navigation)
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
            handleNext();
        } else if (e.key === 'ArrowRight') {
            handlePrev();
        }
    };

    return(
        <>
         {/* StartCatagorySwiper */}
            {/* بخش اصلی اسلایدر با استانداردهای Accessibility و سئو */}
            <section
                className="slider-container"
                aria-label="اسلایدر  مقالات"
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {/* سربرگ اسلایدر */}
                <header className="slider-header">
                    <div className="slider-title-group">
                        <h2 className="slider-title"> آخرین مقالات</h2>

                    </div>
                </header>

                {/* باکس اصلی اسلایدر و دکمه‌های ناوبری */}
                <div className="slider-wrapper-catagory" ref={containerRef}>
                    {/* دکمه قبلی (سمت راست در RTL) */}
                    <button
                        type="button"
                        className="nav-btn prev"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        aria-label="اسلاید قبلی"
                        title="قبلی"
                    >
                        <ChevronRight size={22} />
                    </button>

                    {/* دکمه بعدی (سمت چپ در RTL) */}
                    <button
                        type="button"
                        className="nav-btn next"
                        onClick={handleNext}
                        disabled={currentIndex >= maxIndex}
                        aria-label="اسلاید بعدی"
                        title="بعدی"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    {/* مسیر اصلی کارت‌ها و هندل کردن رویدادهای لمسی */}
                    <div
                        className="slider-track"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: `translateX(calc(${currentIndex} * (100% / ${columnsPerView} + ${16 / columnsPerView}px)))`,
                        }}
                    >
                        {columns.map((column, colIndex) => (
                            <div className="slider-column" key={`col-${colIndex}`}>
                                {column.map((category) => (
                                    <article key={category.id} className="category-card">

                                        <Link to={category.link}>
                                            {category.image ? (
                                                <SafeImg src={category.image} className="category-image" loading="lazy" />
                                            ) : (
                                                <div className="category-image article-placeholder">{category.title}</div>
                                            )}
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* نشانگرهای صفحه‌بندی (Dots) */}
                <nav className="pagination-container" aria-label="صفحات اسلایدر">
                    {Array.from({ length: maxIndex + 1 }).map((_, dotIndex) => (
                        <button
                            key={dotIndex}
                            type="button"
                            className={`dot ${currentIndex === dotIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(dotIndex)}
                            aria-label={`رفتن به صفحه ${dotIndex + 1}`}
                        />
                    ))}
                </nav>
            </section>
            {/* EndCatagorySwiper */}
        </>
    )
}