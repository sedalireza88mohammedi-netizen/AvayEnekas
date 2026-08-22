
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
      image: 'src/assets/Images/MainSwiper Images/Swiper1.jpg',
    },
    {
      id: 2,
      image: 'src/assets/Images/MainSwiper Images/Swiper2.jpg',
    },
    {
      id: 3,
      image: 'src/assets/Images/MainSwiper Images/Swiper3.jpg',
    },
  ];

  const nextSlide = () => {
    prevSlideRef.current = currentSlide;
    setDirection('next');
    setCurrentSlide((prev) => (prev === slidesData.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    prevSlideRef.current = currentSlide;
    setDirection('prev');
    setCurrentSlide((prev) => (prev === 0 ? slidesData.length - 1 : prev - 1));
  };


  const goToSlide = (index) => {
    if (index === currentSlide) return;
    const len = slidesData.length;
    const forwardDist = (index - currentSlide + len) % len;
    const backwardDist = (currentSlide - index + len) % len;
    prevSlideRef.current = currentSlide;
    setDirection(forwardDist <= backwardDist ? 'next' : 'prev');
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000); 

    return () => clearInterval(timer);
  }, [slidesData.length, currentSlide]);

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