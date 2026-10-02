import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, Heart } from "lucide-react";
import { fetchProducts } from "../../../api";
import { usePageMeta } from "../../../useSeo";
import RatingStars from "../../../RatingStars";
import SafeImg from "../../../SafeImg";
import { FavButton} from "../../../ProductActions";
import "./SectionPopular.css";

const SECTION_KEY = "popular";
const SECTION_TITLE = "محبوب‌ترین‌ها";
const SECTION_DESCRIPTION = "محصولاتی که بیشتر از همه بین مشتریان انتخاب شده‌اند";
const SECTION_ICON = Heart;
const SECTION_ACCENT = "#e11d48";

const toPersianDigits = (num) => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (digit) => farsiDigits[digit]);
};

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function SectionPopular() {
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
    <div className="SectionPopular" style={{ "--section-accent": SECTION_ACCENT }}>
      <div className="SectionPopular__hero">
        <nav className="SectionPopular__crumbs" aria-label="مسیر صفحه">
          <Link to="/">صفحه اصلی</Link>
          <ChevronLeft size={14} />
          <span>{SECTION_TITLE}</span>
        </nav>

        <div className="SectionPopular__heading">
          <span className="SectionPopular__icon" aria-hidden="true">
            <SECTION_ICON size={26} />
          </span>
          <div className="SectionPopular__heading-text">
            <h1>{SECTION_TITLE}</h1>
            <p>{SECTION_DESCRIPTION}</p>
          </div>
        </div>

        {!loading && !error && (
          <span className="SectionPopular__count">{toPersianDigits(items.length)} محصول</span>
        )}
      </div>

      <main className="SectionPopular__body">
        {loading && (
          <div className="SectionPopular__grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="SectionPopular__card SectionPopular__card--skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="SectionPopular__message SectionPopular__message--error">{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="SectionPopular__empty">
            <span className="SectionPopular__empty-icon" aria-hidden="true">
              <Package size={34} />
            </span>
            <h2>هنوز محصولی در این بخش اضافه نشده است</h2>
            <p>
              محصولات این بخش را کارشناسان فروشگاه انتخاب می‌کنند. تا چند لحظه دیگر سر بزنید یا
              بقیه محصولات فروشگاه را ببینید.
            </p>
            <Link className="SectionPopular__cta" to="/Catagoryes">
              مشاهده دسته‌بندی‌ها
              <ChevronLeft size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionPopular__grid">
            {items.map((product) => (
              <article key={product.id} className="SectionPopular__card">
                <Link className="SectionPopular__media" to={"/Product/" + product.id}>
                  <SafeImg
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    width="320"
                    height="320"
                  />
                  {product.discount > 0 && (
                    <span className="SectionPopular__discount">
                      {toPersianDigits(product.discount)}٪
                    </span>
                  )}
                  <FavButton id={product.id} size={18} />
                </Link>

                <div className="SectionPopular__body">
                  <span className="SectionPopular__category">{product.category}</span>
                  <Link className="SectionPopular__title" to={"/Product/" + product.id}>
                    {product.title}
                  </Link>
                  <RatingStars rating={product.rating} size={14} />

                  <div className="SectionPopular__footer">
                    <div className="SectionPopular__price">
                      {product.discount > 0 && (
                        <span className="SectionPopular__price-old">
                          {toPersianDigits(formatPrice(product.oldPrice))}
                        </span>
                      )}
                      <strong>{toPersianDigits(formatPrice(product.price))}</strong>
                      <span className="SectionPopular__currency">تومان</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="SectionPopular__more">
            <Link to="/" className="SectionPopular__more-link">
              بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
