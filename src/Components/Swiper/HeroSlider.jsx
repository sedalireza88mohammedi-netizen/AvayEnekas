
import React, { useState, useEffect, useRef } from 'react';
import "./HeroSlider.css"

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState('next'); 
  const prevSlideRef = useRef(0); 

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slidesData = [
    {
      id: 1,
      title: 'فروشگاه تخصصی صوتی تصویری آوای انعکاس',
      image: 'Images/MainSwiper Images/Swiper1.jpg',
    },
    {
      id: 2,
      title: 'تجهیزات حرفه‌ای استودیو از آوای انعکاس',
      image: 'Images/MainSwiper Images/Swiper2.jpg',
    },
    {
      id: 3,
      title: 'مشاوره و نصب تخصصی تجهیزات صوت و تصویر',
      image: 'Images/MainSwiper Images/Swiper3.jpg',
    },
  ];

  const changeSlide = (steps) => {
    setCurrentSlide((prev) => {
      const next = (prev + steps + slidesData.length) % slidesData.length;
      prevSlideRef.current = prev;
      return next;
    });
    setDirection(steps > 0 ? 'next' : 'prev');
  };

  const nextSlide = () => changeSlide(1);

  const prevSlide = () => changeSlide(-1);


  const goToSlide = (index) => {
    if (index === currentSlide) return;
    const len = slidesData.length;
    const forwardDist = (index - currentSlide + len) % len;
    const backwardDist = (currentSlide - index + len) % len;
    changeSlide(forwardDist <= backwardDist ? forwardDist : -backwardDist);
  };

  useEffect(() => {
    const timer = setInterval(() => changeSlide(1), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleMouseDown = (e) => {
    setTouchStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (touchStart > 0) {
      setTouchEnd(e.clientX);
    }
  };

  const handleDragEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };


  const getSlideStyle = (index) => {
    if (index === currentSlide) {
      return {
        transform: 'translateX(0)',
        zIndex: 10,
        opacity: 1,
        transition: 'transform 0.6s ease-in-out',
        pointerEvents: 'auto',
      };
    }

    if (index === prevSlideRef.current) {
      const exitX = direction === 'next' ? '-100%' : '100%';
      return {
        transform: `translateX(${exitX})`,
        zIndex: 5,
        opacity: 1,
        transition: 'transform 0.6s ease-in-out',
        pointerEvents: 'none',
      };
    }


    const idleX = direction === 'next' ? '100%' : '-100%';
    return {
      transform: `translateX(${idleX})`,
      zIndex: 0,
      opacity: 1,
      transition: 'none',
      pointerEvents: 'none',
    };
  };

  return (
    <div className="slider-main-container" dir="rtl">
      <div
        className="slider-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}

onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {slidesData.map((slide, index) => (
          <div
            key={slide.id}
            className="slide-item"
            style={getSlideStyle(index)}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="slide-image"
              draggable="false"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>
        ))}
        <div className="slider-pagination">
          {slidesData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={"pagination-dot " + (currentSlide === index ? "active" : "")}
              aria-label={` اسلاید ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}