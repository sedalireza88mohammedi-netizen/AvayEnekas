import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, Sparkles } from "lucide-react";
import { fetchProducts } from "../../../api";
import { usePageMeta } from "../../../useSeo";
import RatingStars from "../../../RatingStars";
import SafeImg from "../../../SafeImg";
import { FavButton } from "../../../ProductActions";
import "./SectionAmazing.css";

const SECTION_KEY = "amazing";
const SECTION_TITLE = "شگفت‌انگیزها";
const SECTION_DESCRIPTION = "پیشنهادهای ویژه و تخفیف‌دار فروشگاه آوای انعکاس";
const SECTION_ICON = Sparkles;
const SECTION_ACCENT = "#c28b00";

const toPersianDigits = (num) => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (digit) => farsiDigits[digit]);
};

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function SectionAmazing() {
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
    <div className="SectionAmazing" style={{ "--section-accent": SECTION_ACCENT }}>
      <div className="SectionAmazing__hero">
        <nav className="SectionAmazing__crumbs" aria-label="مسیر صفحه">
          <Link to="/">صفحه اصلی</Link>
          <ChevronLeft size={14} />
          <span>{SECTION_TITLE}</span>
        </nav>

        <div className="SectionAmazing__heading">
          <span className="SectionAmazing__icon" aria-hidden="true">
            <SECTION_ICON size={26} />
          </span>
          <div className="SectionAmazing__heading-text">
            <h1>{SECTION_TITLE}</h1>
            <p>{SECTION_DESCRIPTION}</p>
          </div>
        </div>

        {!loading && !error && (
          <span className="SectionAmazing__count">{toPersianDigits(items.length)} محصول</span>
        )}
      </div>

      <main className="SectionAmazing__body">
        {loading && (
          <div className="SectionAmazing__grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="SectionAmazing__card SectionAmazing__card--skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="SectionAmazing__message SectionAmazing__message--error">{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="SectionAmazing__empty">
            <span className="SectionAmazing__empty-icon" aria-hidden="true">
              <Package size={34} />
            </span>
            <h2>هنوز محصولی در این بخش اضافه نشده است</h2>
            <p>
              محصولات این بخش را کارشناسان فروشگاه انتخاب می‌کنند. تا چند لحظه دیگر سر بزنید یا
              بقیه محصولات فروشگاه را ببینید.
            </p>
            <Link className="SectionAmazing__cta" to="/Catagoryes">
              مشاهده دسته‌بندی‌ها
              <ChevronLeft size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionAmazing__grid">
            {items.map((product) => (
              <article key={product.id} className="SectionAmazing__card">
                <Link className="SectionAmazing__media" to={"/Product/" + product.id}>
                  <SafeImg
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    width="320"
                    height="320"
                  />
                  {product.discount > 0 && (
                    <span className="SectionAmazing__discount">
                      {toPersianDigits(product.discount)}٪
                    </span>
                  )}
                  <FavButton id={product.id} size={18} />
                </Link>

                <div className="SectionAmazing__body">
                  <span className="SectionAmazing__category">{product.category}</span>
                  <Link className="SectionAmazing__title" to={"/Product/" + product.id}>
                    {product.title}
                  </Link>
                  <RatingStars rating={product.rating} size={14} />

                  <div className="SectionAmazing__footer">
                    <div className="SectionAmazing__price">
                      {product.discount > 0 && (
                        <span className="SectionAmazing__price-old">
                          {toPersianDigits(formatPrice(product.oldPrice))}
                        </span>
                      )}
                      <strong>{toPersianDigits(formatPrice(product.price))}</strong>
                      <span className="SectionAmazing__currency">تومان</span>
                    </div>

                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionAmazing__more">
            <Link to="/" className="SectionAmazing__more-link">
              بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
