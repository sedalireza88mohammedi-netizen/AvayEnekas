import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, TrendingUp } from "lucide-react";
import { fetchProducts } from "../../../api";
import { usePageMeta } from "../../../useSeo";
import RatingStars from "../../../RatingStars";
import SafeImg from "../../../SafeImg";
import { FavButton } from "../../../ProductActions";
import "./SectionTrending.css";

const SECTION_KEY = "trending";
const SECTION_TITLE = "ترندترین‌ها";
const SECTION_DESCRIPTION = "تازه‌ترین محصولاتی که این روزها در فروشگاه دیده می‌شوند";
const SECTION_ICON = TrendingUp;
const SECTION_ACCENT = "#7c3aed";

const toPersianDigits = (num) => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (digit) => farsiDigits[digit]);
};

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function SectionTrending() {
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
    <div className="SectionTrending" style={{ "--section-accent": SECTION_ACCENT }}>
      <div className="SectionTrending__hero">
        <nav className="SectionTrending__crumbs" aria-label="مسیر صفحه">
          <Link to="/">صفحه اصلی</Link>
          <ChevronLeft size={14} />
          <span>{SECTION_TITLE}</span>
        </nav>

        <div className="SectionTrending__heading">
          <span className="SectionTrending__icon" aria-hidden="true">
            <SECTION_ICON size={26} />
          </span>
          <div className="SectionTrending__heading-text">
            <h1>{SECTION_TITLE}</h1>
            <p>{SECTION_DESCRIPTION}</p>
          </div>
        </div>

        {!loading && !error && (
          <span className="SectionTrending__count">{toPersianDigits(items.length)} محصول</span>
        )}
      </div>

      <main className="SectionTrending__body">
        {loading && (
          <div className="SectionTrending__grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="SectionTrending__card SectionTrending__card--skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="SectionTrending__message SectionTrending__message--error">{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="SectionTrending__empty">
            <span className="SectionTrending__empty-icon" aria-hidden="true">
              <Package size={34} />
            </span>
            <h2>هنوز محصولی در این بخش اضافه نشده است</h2>
            <p>
              محصولات این بخش را کارشناسان فروشگاه انتخاب می‌کنند. تا چند لحظه دیگر سر بزنید یا
              بقیه محصولات فروشگاه را ببینید.
            </p>
            <Link className="SectionTrending__cta" to="/Catagoryes">
              مشاهده دسته‌بندی‌ها
              <ChevronLeft size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionTrending__grid">
            {items.map((product) => (
              <article key={product.id} className="SectionTrending__card">
                <Link className="SectionTrending__media" to={"/Product/" + product.id}>
                  <SafeImg
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    width="320"
                    height="320"
                  />
                  {product.discount > 0 && (
                    <span className="SectionTrending__discount">
                      {toPersianDigits(product.discount)}٪
                    </span>
                  )}
                  <FavButton id={product.id} size={18} />
                </Link>

                <div className="SectionTrending__body">
                  <span className="SectionTrending__category">{product.category}</span>
                  <Link className="SectionTrending__title" to={"/Product/" + product.id}>
                    {product.title}
                  </Link>
                  <RatingStars rating={product.rating} size={14} />

                  <div className="SectionTrending__footer">
                    <div className="SectionTrending__price">
                      {product.discount > 0 && (
                        <span className="SectionTrending__price-old">
                          {toPersianDigits(formatPrice(product.oldPrice))}
                        </span>
                      )}
                      <strong>{toPersianDigits(formatPrice(product.price))}</strong>
                      <span className="SectionTrending__currency">تومان</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionTrending__more">
            <Link to="/" className="SectionTrending__more-link">
              بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
