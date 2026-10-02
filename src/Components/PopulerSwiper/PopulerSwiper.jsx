import React from "react";
import SectionSwiper from "../SectionSwiper/SectionSwiper";
import "./PopulerSwiper.css";

// محبوب‌ترین‌ها فقط محصولاتی را نشان می‌دهد که ادمین در پنل، بخش محبوب‌ترین‌ها انتخاب کرده است
export default function PopularSlider() {
  return <SectionSwiper section="popular" title="محبوب ترین ها" />;
}
