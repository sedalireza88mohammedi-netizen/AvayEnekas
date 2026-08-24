import EmperiseveSwiper from "../../SwiperEmpresive/SwiperEmperisive";
import Menu from "../Menu/Menu"
import HeroSlider from "../Swiper/HeroSlider"
import "./Home.css"
import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from 'react-router-dom';



import "swiper/css";
import CatagorySwiper from "../CatagorySwiper/CatagorySwiper";
import PopularSlider from "../PopulerSwiper/PopulerSwiper";
import Articelse from "../Articles/Articels";


function Home() {



    return (
        <>



            <HeroSlider />
            <EmperiseveSwiper />
            <div className="FirstFullBanner"></div>



            <br />
            <CatagorySwiper />
            <div className="BannerContainer">
                <div className="LeftBannerTwin"></div>
                <div className="RightBannerTwin"></div>
            </div>
            <PopularSlider />
            <div className="FirstFullBanner"></div>

            <Articelse />


        </>
    )
}
export default Home