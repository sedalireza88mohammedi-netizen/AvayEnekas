import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, Flame } from "lucide-react";
import { fetchProducts } from "../../../api";
import { usePageMeta } from "../../../useSeo";
import RatingStars from "../../../RatingStars";
import SafeImg from "../../../SafeImg";
import { FavButton } from "../../../ProductActions";
import "./SectionBestSeller.css";

const SECTION_KEY = "best_seller";
const SECTION_TITLE = "پرفروش‌ترین‌ها";
const SECTION_DESCRIPTION = "پرفروش‌ترین انتخاب‌های مشتریان آوای انعکاس";
const SECTION_ICON = Flame;
const SECTION_ACCENT = "#f97316";

const toPersianDigits = (num) => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (digit) => farsiDigits[digit]);
};

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function SectionBestSeller() {
  usePageMeta({
    title: SECTION_TITLE + " | آوای انعکاس",
    description: SECTION_DESCRIPTION,
  });

  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchProducts({ section: SECTION_KEY, limit: 100 })
      .then((data) => {
        if (!active) return;
        setProducts(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setError("در حال حاضر امکان دریافت محصولات این بخش وجود ندارد.");
      });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => products || [], [products]);
  const loading = products === null;

  return (
    <div className="SectionBestSeller" style={{ "--section-accent": SECTION_ACCENT }}>
      <div className="SectionBestSeller__hero">
        <nav className="SectionBestSeller__crumbs" aria-label="مسیر صفحه">
          <Link to="/">صفحه اصلی</Link>
          <ChevronLeft size={14} />
          <span>{SECTION_TITLE}</span>
        </nav>

        <div className="SectionBestSeller__heading">
          <span className="SectionBestSeller__icon" aria-hidden="true">
            <SECTION_ICON size={26} />
          </span>
          <div className="SectionBestSeller__heading-text">
            <h1>{SECTION_TITLE}</h1>
            <p>{SECTION_DESCRIPTION}</p>
          </div>
        </div>

        {!loading && !error && (
          <span className="SectionBestSeller__count">{toPersianDigits(items.length)} محصول</span>
        )}
      </div>

      <main className="SectionBestSeller__body">
        {loading && (
          <div className="SectionBestSeller__grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="SectionBestSeller__card SectionBestSeller__card--skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="SectionBestSeller__message SectionBestSeller__message--error">{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="SectionBestSeller__empty">
            <span className="SectionBestSeller__empty-icon" aria-hidden="true">
              <Package size={34} />
            </span>
            <h2>هنوز محصولی در این بخش اضافه نشده است</h2>
            <p>
              محصولات این بخش را کارشناسان فروشگاه انتخاب می‌کنند. تا چند لحظه دیگر سر بزنید یا
              بقیه محصولات فروشگاه را ببینید.
            </p>
            <Link className="SectionBestSeller__cta" to="/Catagoryes">
              مشاهده دسته‌بندی‌ها
              <ChevronLeft size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionBestSeller__grid">
            {items.map((product) => (
              <article key={product.id} className="SectionBestSeller__card">
                <Link className="SectionBestSeller__media" to={"/Product/" + product.id}>
                  <SafeImg
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    width="320"
                    height="320"
                  />
                  {product.discount > 0 && (
                    <span className="SectionBestSeller__discount">
                      {toPersianDigits(product.discount)}٪
                    </span>
                  )}
                  <FavButton id={product.id} size={18} />
                </Link>

                <div className="SectionBestSeller__body">
                  <span className="SectionBestSeller__category">{product.category}</span>
                  <Link className="SectionBestSeller__title" to={"/Product/" + product.id}>
                    {product.title}
                  </Link>
                  <RatingStars rating={product.rating} size={14} />

                  <div className="SectionBestSeller__footer">
                    <div className="SectionBestSeller__price">
                      {product.discount > 0 && (
                        <span className="SectionBestSeller__price-old">
                          {toPersianDigits(formatPrice(product.oldPrice))}
                        </span>
                      )}
                      <strong>{toPersianDigits(formatPrice(product.price))}</strong>
                      <span className="SectionBestSeller__currency">تومان</span>
                    </div>
                  
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionBestSeller__more">
            <Link to="/" className="SectionBestSeller__more-link">
              بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
