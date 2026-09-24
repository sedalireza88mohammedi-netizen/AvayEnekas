import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ChevronLeft, PackageX, Loader2, CheckCircle2, Star } from 'lucide-react';
import "./ProductDeatelse.css";
import { fetchProduct, fetchProducts, fetchProductReviews, addProductReview } from '../../api';
import { usePageMeta } from '../../useSeo';
import RatingStars from '../../RatingStars';
import SafeImg from '../../SafeImg';
import { FavButton } from '../../ProductActions';
import { useCartStore } from '../../cartStore';

const toPersianDigits = (num) =>
  num.toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function ProductDeatelse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewOk, setReviewOk] = useState(false);
  const [reviewError, setReviewError] = useState('');

  usePageMeta(
    product
      ? {
          title: `${product.title} | آوای انعکاس`,
          description: `خرید ${product.title} با قیمت ${toPersianDigits(formatPrice(product.price))} تومان از فروشگاه آوای انعکاس.`,
        }
      : { title: 'محصول | آوای انعکاس' }
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    setQuantity(1);
    setAdded(false);

    fetchProduct(id)
      .then((p) => {
        if (!active) return;
        if (!p) { setNotFound(true); return; }
        setProduct(p);
        setActiveImage(0);
        setReviews([]);
        setReviewOk(false);
        setReviewError('');
        loadReviews(p.id);
        if (p.category) {
          fetchProducts({ category: p.category })
            .then((list) => active && setRelated(list.filter((x) => String(x.id) !== String(id)).slice(0, 8)))
            .catch(() => active && setRelated([]));
        }
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [id]);

  const loadReviews = async (productId) => {
    setReviewsLoading(true);
    try {
      const data = await fetchProductReviews(productId);
      setReviews(data.results || []);
      setReviewsCount(data.count || 0);
    } catch {
      setReviews([]);
      setReviewsCount(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  const reviewAverage = reviews.length
    ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
    : 0;

  const handleSubmitReview = async () => {
    const comment = reviewForm.comment.trim();
    if (!comment) { setReviewError('لطفاً متن نظر را بنویسید.'); return; }
    setReviewSending(true);
    setReviewError('');
    setReviewOk(false);
    try {
      const payload = { rating: reviewForm.rating, comment };
      if (reviewForm.name.trim()) payload.name = reviewForm.name.trim();
      await addProductReview(product.id, payload);
      setReviewOk(true);
      setReviewForm((f) => ({ ...f, comment: '', name: f.name }));
      loadReviews(product.id);
    } catch {
      setReviewError('ارسال نظر ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setReviewSending(false);
    }
  };

  const increase = () => setQuantity((q) => Math.min(q + 1, product.stock || 1));
  const decrease = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || adding) return;
    setAdding(true);
    setAdded(false);
    try {
      await addToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      /* در صورت قطعی سرور، خطا نادیده گرفته می‌شود */
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-loader-back"><span className="pd-loader" />در حال بارگذاری...</div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="pd-page">
        <div className="pd-notfound">
          <PackageX size={56} />
          <h2>محصول مورد نظر یافت نشد</h2>
          <p>ممکن است این محصول حذف شده باشد یا آدرس اشتباه است.</p>
          <Link to="/" className="pd-notfound-btn">بازگشت به فروشگاه</Link>
        </div>
      </div>
    );
  }

  const gallery = product.images && product.images.length > 0 ? product.images : [{ url: product.image, name: '' }];
  const outOfStock = !product.stock || product.stock <= 0;

  return (
    <div className="pd-page">
      <nav className="pd-breadcrumb" aria-label="مسیر صفحه">
        <Link to="/">خانه</Link>
        <ChevronLeft size={14} />
        <Link to={`/Catagoryes?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <ChevronLeft size={14} />
        <span>{product.title}</span>
      </nav>

      <div className="pd-layout">
        <div className="pd-gallery">
          <div className="pd-main-image">
            {product.discount > 0 && (
              <span className="pd-discount">{toPersianDigits(product.discount)}٪ تخفیف</span>
            )}
            <SafeImg
              src={gallery[activeImage].url}
              alt={product.title}
              width="480"
              height="480"
            />
          </div>
          {gallery.length > 1 && (
            <div className="pd-thumbs">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`pd-thumb ${i === activeImage ? 'active' : ''}`}
                  aria-label={`تصویر ${toPersianDigits(i + 1)}`}
                >
                  <SafeImg src={img.url} alt={product.title} width="60" height="60" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <div className="pd-title-row">
            <h1 className="pd-title">{product.title}</h1>
            {!outOfStock && (
              <span className="pd-stock-chip">موجود در انبار</span>
            )}
          </div>
          {product.subtitle && <p className="pd-subtitle">{product.subtitle}</p>}

          <div className="pd-rating-line">
            <RatingStars rating={product.rating} size={18} />
            <span className="pd-status">
              {outOfStock ? 'ناموجود' : `موجود در انبار (${toPersianDigits(product.stock)} عدد)`}
            </span>
          </div>

          <div className="pd-fav-row">
            <FavButton id={product.id} />
          </div>

          <div className="pd-price-box">
            {product.oldPrice > product.price && (
              <div className="pd-oldprice">{toPersianDigits(formatPrice(product.oldPrice))} تومان</div>
            )}
            <div className="pd-price">
              {toPersianDigits(formatPrice(product.price))} <span>تومان</span>
            </div>
          </div>

          <div className="pd-actions">
            <div className="pd-qty">
              <button onClick={decrease} disabled={quantity <= 1} aria-label="کاهش تعداد"><Minus size={16} /></button>
              <span>{toPersianDigits(quantity)}</span>
              <button onClick={increase} disabled={outOfStock || quantity >= product.stock} aria-label="افزایش تعداد"><Plus size={16} /></button>
            </div>
            <button className="pd-add-btn" onClick={handleAddToCart} disabled={outOfStock || adding}>
              {adding ? <Loader2 size={18} className="pd-spin" /> : added ? <CheckCircle2 size={18} /> : <ShoppingCart size={18} />}
              {added ? 'به سبد اضافه شد' : adding ? 'در حال افزودن...' : outOfStock ? 'ناموجود' : 'افزودن به سبد خرید'}
            </button>
          </div>

          {added && (
            <div className="pd-added">
              <Link to="/Cart">مشاهده سبد خرید</Link>
            </div>
          )}

          <dl className="pd-meta">
            <div><dt>کد کالا</dt><dd>{product.sku}</dd></div>
            <div><dt>دسته‌بندی</dt><dd>
              <Link to={`/Catagoryes?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
            </dd></div>
            <div><dt>امتیاز</dt><dd>{toPersianDigits(product.rating)} از ۵</dd></div>
          </dl>
        </div>
      </div>

      {product.video && (
        <section className="pd-video">
          <h3 className="pd-video-title">ویدیوی معرفی محصول</h3>
          <div className="pd-video-frame">
            {product.video.match(/(youtube\.com|youtu\.be)/) ? (
              <iframe
                src={product.video.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                title={product.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={product.video} controls playsInline />
            )}
          </div>
        </section>
      )}

      <div className="pd-reviews">
        <div className="pd-reviews-head">
          <h3 className="pd-reviews-title">
            نظرات کاربران{' '}
            {reviewsCount > 0 && <span className="pd-reviews-count">({toPersianDigits(reviewsCount)})</span>}
          </h3>
          {reviews.length > 0 && (
            <span className="pd-reviews-avg">
              میانگین <RatingStars rating={reviewAverage} size={15} /> {toPersianDigits(reviewAverage.toFixed(1))}
            </span>
          )}
        </div>

        {reviewsLoading && <p className="pd-reviews-loading">در حال بارگذاری نظرات...</p>}

        {!reviewsLoading && reviews.length > 0 && (
          <div className="pd-reviews-list">
            {reviews.map((r) => (
              <div key={r.id} className="pd-review">
                <div className="pd-review-top">
                  <strong>{r.author}</strong>
                  <RatingStars rating={r.rating} size={13} />
                </div>
                <p className="pd-review-text">{r.comment}</p>
                <span className="pd-review-date">
                  {new Date(r.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        )}

        {!reviewsLoading && reviews.length === 0 && (
          <p className="pd-reviews-empty">هنوز نظری ثبت نشده است؛ اولین نفری باشید که نظر می‌دهد.</p>
        )}

        <div className="pd-review-form">
          <h4>دیدگاه خود را ثبت کنید</h4>
          <div className="pd-review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                aria-label={`${n} ستاره`}
              >
                <Star
                  size={22}
                  fill={n <= reviewForm.rating ? '#f7a600' : 'transparent'}
                  stroke={n <= reviewForm.rating ? '#f7a600' : '#c7c7c7'}
                />
              </button>
            ))}
          </div>
          <input
            className="pd-review-name"
            placeholder="نام شما (اختیاری)"
            value={reviewForm.name}
            onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={60}
          />
          <textarea
            className="pd-review-comment"
            placeholder="متن نظر..."
            rows={3}
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
          />
          {reviewError && <p className="pd-review-error">{reviewError}</p>}
          {reviewOk && <p className="pd-review-ok">نظر شما ثبت شد.</p>}
          <button className="pd-review-submit" onClick={handleSubmitReview} disabled={reviewSending}>
            {reviewSending ? <Loader2 size={16} className="pd-spin" /> : 'ثبت نظر'}
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pd-related">
          <h3 className="pd-related-title">محصولات مشابه</h3>
          <div className="pd-related-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/Product/${p.id}`} className="pd-related-card">
                <SafeImg src={p.image} alt={p.title} loading="lazy" width="120" height="120" />
                <h4 title={p.title}>{p.title}</h4>
                <RatingStars rating={p.rating} size={11} />
                <span className="pd-related-price">{toPersianDigits(formatPrice(p.price))} تومان</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <button className="pd-back" onClick={() => navigate(-1)} aria-label="بازگشت">
        <ChevronLeft size={18} /> بازگشت
      </button>
    </div>
  );
}