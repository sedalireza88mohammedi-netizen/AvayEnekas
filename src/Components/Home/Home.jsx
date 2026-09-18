import EmperiseveSwiper from "../../SwiperEmpresive/SwiperEmperisive";
import HeroSlider from "../Swiper/HeroSlider";
import CatagorySwiper from "../CatagorySwiper/CatagorySwiper";
import PopularSlider from "../PopulerSwiper/PopulerSwiper";
import Articelse from "../Articles/Articels";
import { usePageMeta } from "../../useSeo";
import "./Home.css";

function Home() {
  usePageMeta({
    title: "فروشگاه صوتی تصویری آوای انعکاس | خرید تجهیزات صوت و تصویر",
    description:
      "فروشگاه آوای انعکاس؛ عرضه تخصصی تجهیزات صوتی و تصویری، باند، میکروفون، میکسر و آمپلی فایر با ضمانت اصالت و ارسال سریع.",
  });

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
  );
}
export default Home;