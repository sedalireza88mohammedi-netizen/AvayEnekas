import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Categories.css";
import { fetchCategories, fetchProducts } from '../../api';
import { usePageMeta } from '../../useSeo';
import { saveSearch } from '../../searchHistory';
import { PackageX } from 'lucide-react';

const FALLBACK_CATEGORIES = ["اسپیکر", "هدفون", "آمپلی‌فایر", "میکروفون", "میکسر", "کابل و اتصالات"];

const toPersianDigits = (num) =>
  num.toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatCount = (n) =>
  toPersianDigits((n || 0).toLocaleString('en-US'));

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(null);
  const [byCategory, setByCategory] = useState({});

  usePageMeta({
    title: 'دسته‌بندی محصولات | آوای انعکاس',
    description: 'همه دسته‌بندی‌های تجهیزات صوتی و تصویری فروشگاه آوای انعکاس: باند، میکسر، آمپلی‌فایر، میکروفون و...',
  });

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then(async (cats) => {
        const list = Array.isArray(cats) && cats.length ? cats : null;
        if (!active) return;
        setCategories(list);
        try {
          const products = await fetchProducts({ limit: 300 });
          const map = {};
          (products || []).forEach((p) => {
            if (!p.category) return;
            if (!map[p.category]) map[p.category] = { count: 0, image: '' };
            map[p.category].count += 1;
            if (!map[p.category].image && p.image) map[p.category].image = p.image;
          });
          if (active) setByCategory(map);
        } catch { /* بدون آمار */ }
      })
      .catch(() => { if (active) setCategories(null); });
    return () => { active = false; };
  }, []);

  const list = categories
    ? categories.map((c) => ({
        name: c.name,
        subgroups: c.subgroups || [],
        count: byCategory[c.name]?.count || 0,
        image: byCategory[c.name]?.image || '',
      }))
    : FALLBACK_CATEGORIES.map((name) => ({
        name,
        subgroups: [],
        count: byCategory[name]?.count || 0,
        image: byCategory[name]?.image || '',
      }));

  const goSubgroup = (term) => {
    saveSearch(term);
    navigate(`/AllProductList?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="cat-page">
      <header className="cat-page-header">
        <h1>دسته‌بندی محصولات</h1>
        <p>محصول صوتی و تصویری موردنظرت را بر اساس دسته پیدا کن</p>
      </header>

      {list.length === 0 ? (
        <div className="cat-empty">
          <PackageX size={48} />
          <span>دسته‌ای برای نمایش وجود ندارد</span>
        </div>
      ) : (
        <div className="cat-grid">
          {list.map((cat) => (
            <article key={cat.name} className="cat-card">
              <Link
                to={`/AllProductList?category=${encodeURIComponent(cat.name)}`}
                className="cat-card-main"
              >
                <div className="cat-card-img">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} loading="lazy" />
                  ) : (
                    <span>{cat.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="cat-card-body">
                  <h3 className="cat-card-name">{cat.name}</h3>
                  <span className="cat-card-count">
                    {cat.count > 0 ? formatCount(cat.count) + ' محصول' : 'مشاهده محصولات'}
                  </span>
                </div>
              </Link>
              {cat.subgroups && cat.subgroups.length > 0 && (
                <ul className="cat-card-subs">
                  {cat.subgroups.slice(0, 6).map((sub) => (
                    <li key={sub}>
                      <button type="button" onClick={() => goSubgroup(sub)}>
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}