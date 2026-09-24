import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CalendarDays, User, FolderOpen, PackageX } from 'lucide-react';
import "./ArticleDeatelse.css";
import { fetchArticle, fetchArticles } from '../../api';
import { usePageMeta } from '../../useSeo';
import SafeImg from '../../SafeImg';

const toPersianDigits = (num) =>
  (num || '').toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

export default function ArticleDeatelse() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageMeta(
    article
      ? { title: `${article.title} | آوای انعکاس`, description: article.excerpt || '' }
      : { title: 'مقاله | آوای انعکاس' }
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setArticle(null);

    fetchArticle(id)
      .then((a) => {
        if (!active) return;
        if (!a) { setNotFound(true); return; }
        setArticle(a);
        fetchArticles()
          .then((list) => active && setOthers(list.filter((x) => String(x.id) !== String(id)).slice(0, 5)))
          .catch(() => active && setOthers([]));
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="ad-page">
        <div className="ad-loader-back"><span className="ad-loader" />در حال بارگذاری...</div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="ad-page">
        <div className="ad-notfound">
          <PackageX size={56} />
          <h2>مقاله مورد نظر یافت نشد</h2>
          <Link to="/" className="ad-notfound-btn">بازگشت به فروشگاه</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-page">
      <nav className="ad-breadcrumb" aria-label="مسیر صفحه">
        <Link to="/">خانه</Link>
        <ChevronLeft size={14} />
        <span>{article.title}</span>
      </nav>

      <article className="ad-article">
        <h1 className="ad-title">{article.title}</h1>

        <div className="ad-meta">
          {article.category && (
            <span><FolderOpen size={14} /> {article.category}</span>
          )}
          {article.author && (
            <span><User size={14} /> {article.author}</span>
          )}
          {article.publishedAt && (
            <span><CalendarDays size={14} /> {toPersianDigits(article.publishedAt)}</span>
          )}
        </div>

        {article.coverImage && (
          <div className="ad-cover">
            <SafeImg src={article.coverImage} alt={article.title} />
          </div>
        )}

        {article.excerpt && <p className="ad-excerpt">{article.excerpt}</p>}

        {article.content && (
          <div className="ad-content">
            {article.content.split('\n').map((line, i) =>
              line.trim() ? <p key={i}>{line}</p> : <div key={i} className="ad-spacer" />
            )}
          </div>
        )}

        {article.videos && article.videos.length > 0 && (
          <section className="ad-videos">
            <h3>ویدیوهای مرتبط</h3>
            {article.videos.map((v, i) => {
              const src = v && v.url ? v.url : v;
              return (
                <div key={i} className="ad-video">
                  {String(src).match(/(youtube\.com|youtu\.be)/) ? (
                    <iframe
                      src={String(src).replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={String(src)} controls playsInline />
                  )}
                </div>
              );
            })}
          </section>
        )}
      </article>

      {others.length > 0 && (
        <section className="ad-others">
          <h3>مقالات دیگر</h3>
          <div className="ad-others-grid">
            {others.map((a) => (
              <Link key={a.id} to={`/Article/${a.id}`} className="ad-other-card">
                <h4 title={a.title}>{a.title}</h4>
                {a.excerpt && <p>{a.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}