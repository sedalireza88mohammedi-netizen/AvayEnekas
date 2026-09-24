import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { PackageX } from 'lucide-react';
import "./Catagoryes.css";
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../../api';
import { usePageMeta } from '../../useSeo';
import RatingStars from '../../RatingStars';
import SafeImg from '../../SafeImg';
import { FavButton, AddToCartBtn } from '../../ProductActions';

const toPersianDigits = (num) =>
  num.toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatPrice = (price) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function ProductCard({ product }) {
  return (
    <div className="product-card-shell cat-shell">
      <Link to={`/Product/${product.id}`} className="product-card">
        <div className="product-image-wrapper">
          <SafeImg
            src={product.image}
            alt={product.title}
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
          />
        </div>
        <div className="product-info-top">
          <h3 className="product-title" title={product.title}>{product.title}</h3>
          {product.subtitle && (
            <span className="product-subtitle" title={product.subtitle}>{product.subtitle}</span>
          )}
        </div>
        <div className="product-rating-row">
          <RatingStars rating={product.rating} size={13} />
        </div>
        <div className="product-price-section">
          <div className="price-details">
            {product.oldPrice > product.price && (
              <span className="old-price">{toPersianDigits(formatPrice(product.oldPrice))}</span>
            )}
            <div className="new-price">
              <span>{toPersianDigits(formatPrice(product.price))}</span>
              <span className="currency">تومان</span>
            </div>
          </div>
          {product.discount > 0 ? (
            <div className="discount-badge">{toPersianDigits(product.discount)}٪</div>
          ) : null}
        </div>
      </Link>
    
    </div>
  );
}

export default function Catagoryes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(search);

  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('default');

  usePageMeta({
    title: category
      ? `دسته‌بندی ${category} | آوای انعکاس`
      : 'دسته‌بندی محصولات صوتی و تصویری | آوای انعکاس',
    description: 'خرید تجهیزات صوتی و تصویری: باند، میکروفون، میکسر، آمپلی فایر و کابل از فروشگاه آوای انعکاس.',
  });

  const resetFilters = () => {
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setSort('default');
  };

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((cats) => active && setCategories(cats))
      .catch(() => active && setCategories([]));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProducts({ category: category || undefined, search: search || undefined, limit: 200 })
      .then((data) => { if (active) setAllProducts(data); })
      .catch(() => active && setAllProducts([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category, search]);

  const brandOptions = [...new Set(allProducts.map((p) => p.subtitle).filter(Boolean))].sort();

  const products = (() => {
    let list = allProducts;
    if (brand) list = list.filter((p) => (p.subtitle || '').toLowerCase().includes(brand.toLowerCase()));
    const min = minPrice === '' ? NaN : Number(minPrice);
    const max = maxPrice === '' ? NaN : Number(maxPrice);
    if (!Number.isNaN(min)) list = list.filter((p) => p.price >= min);
    if (!Number.isNaN(max)) list = list.filter((p) => p.price <= max);
    if (minRating > 0) list = list.filter((p) => (p.rating || 0) >= minRating);

    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'newest') list = [...list].sort((a, b) => b.id - a.id);
    return list;
  })();

  const hasFilters = brand || minPrice !== '' || maxPrice !== '' || minRating > 0 || sort !== 'default';

  const selectCategory = (name) => {
    navigate(name ? `/Catagoryes?category=${encodeURIComponent(name)}` : '/Catagoryes');
  };

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/Catagoryes?search=${encodeURIComponent(localSearch.trim())}`);
  };

  const title = category || search || 'همه محصولات';

  return (
    <>
      <div className="app-wrapper">
        <div className="main-content no-scrollbar">
          <form className="cat-search-box" onSubmit={submitSearch} role="search">
            <FontAwesomeIcon icon={faSearch} className="cat-search-icon" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="جستجو در محصولات..."
              aria-label="جستجو در محصولات"
            />
          </form>

          <h2 className="main-title">{title}</h2>

          <div className="cat-filters">
            <select
              className="cat-filter"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              aria-label="برند"
            >
              <option value="">همه برندها</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <div className="cat-filter-price">
              <input
                type="number"
                min="0"
                placeholder="قیمت از"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="حداقل قیمت"
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                placeholder="قیمت تا"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="حداکثر قیمت"
              />
            </div>

            <select
              className="cat-filter"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label="حداقل امتیاز"
            >
              <option value="0">همه امتیازها</option>
              <option value="3">از ۳ به بالا</option>
              <option value="3.5">از ۳.۵ به بالا</option>
              <option value="4">از ۴ به بالا</option>
              <option value="4.5">از ۴.۵ به بالا</option>
            </select>

            <select
              className="cat-filter"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="مرتب‌سازی"
            >
              <option value="default">مرتب‌سازی پیش‌فرض</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
              <option value="rating">بیشترین امتیاز</option>
              <option value="newest">جدیدترین</option>
            </select>

            {hasFilters && (
              <button className="cat-filter-reset" onClick={resetFilters}>
                حذف فیلترها
              </button>
            )}

            <span className="cat-filter-count">
              {toPersianDigits(products.length)} محصول
            </span>
          </div>

          {loading ? (
            <div className="page-loader" />
          ) : products.length === 0 ? (
            <div className="cat-empty">
              <PackageX size={48} />
              <p>محصولی یافت نشد.</p>
            </div>
          ) : (
            <div className="cat-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}