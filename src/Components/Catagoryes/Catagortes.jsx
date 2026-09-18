import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { LayoutGrid, PackageX } from 'lucide-react';
import "./Catagoryes.css";
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../../api';
import { usePageMeta } from '../../useSeo';

const toPersianDigits = (num) =>
  num.toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatPrice = (price) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function ProductCard({ product }) {
  return (
    <Link to={`/Product/${product.id}`} className="cat-product-card">
      <div className="cat-product-image-wrapper">
        {product.discount > 0 && (
          <span className="cat-product-discount">{toPersianDigits(product.discount)}٪</span>
        )}
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          width={200}
          height={200}
        />
      </div>
      <div className="cat-product-info">
        <h3 className="cat-product-title">{product.title}</h3>
        {product.subtitle && <span className="cat-product-subtitle">{product.subtitle}</span>}
        <div className="cat-product-price-row">
          <span className="cat-product-price">{toPersianDigits(formatPrice(product.price))} <small>تومان</small></span>
          {product.oldPrice > product.price && (
            <span className="cat-product-oldprice">{toPersianDigits(formatPrice(product.oldPrice))}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Catagoryes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(search);

  usePageMeta({
    title: category
      ? `دسته‌بندی ${category} | آوای انعکاس`
      : 'دسته‌بندی محصولات صوتی و تصویری | آوای انعکاس',
    description: 'خرید تجهیزات صوتی و تصویری: باند، میکروفون، میکسر، آمپلی فایر و کابل از فروشگاه آوای انعکاس.',
  });

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
    fetchProducts({ category: category || undefined, search: search || undefined })
      .then((data) => { if (active) setProducts(data); })
      .catch(() => active && setProducts([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category, search]);

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
        <h1 title="بازگشت به خانه" className="BackFromCatagory" onClick={() => navigate("/")}>
          <FontAwesomeIcon icon={faArrowRight} />
        </h1>

        <div className="sidebar">
          <button
            className={`sidebar-btn ${!category ? 'active' : ''}`}
            onClick={() => selectCategory('')}
          >
            <LayoutGrid size={22} />
            <span>همه</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={`sidebar-btn ${category === cat ? 'active' : ''}`}
            >
              <span>{cat}</span>
            </button>
          ))}
        </div>

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