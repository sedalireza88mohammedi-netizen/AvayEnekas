import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Menu.css";
import { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faBurst, faCartShopping, faClockRotateLeft, faFire, faHeart, faHome, faSearch, faSun, faTrash, faUser, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { isLoggedIn as checkLogin } from '../../auth';
import { useAuthSync } from '../../useSeo';
import { fetchProducts, fetchPopularSearches } from '../../api';
import { getSearchHistory, saveSearch, clearSearchHistory } from '../../searchHistory';
import { useCartStore } from '../../cartStore';
import SafeImg from '../../SafeImg';

const CATEGORY_DATA = {
  Band: {
    title: "باند",
    columns: [
      {
        title: "انتخاب باند",
        items: ["بلندگو اکتیو", "بلندگو پسیو", "ساب ووفر", "اسپیکر مانیتور", "اسپیکر دیواری", "اسپیکر سقفی", "اسپیکر ستونی", "اسپیکر شیپوری و هورن"],
      },
      {
        title: "باند براساس قیمت",
        items: ["باند تا 100 میلیون", "باند تا 200 میلیون", "باند تا 300 میلیون"],
      },
    ],
  },
  MicSer: {
    title: "میکسر",
    columns: [
      {
        title: "انتخاب میکسر",
        items: ["میکسر دیجیتال", "میکسر آنالوگ", "پاور میکسر", "ماتریکس دیجیتال"],
      },
      {
        title: "نوع میکسر",
        items: ["میکروفون ارزان", "میکروفون حرفه‌ای", "میکروفون بی‌سیم"],
      },
    ],
  },
  AmpilyFire: {
    title: "آمپلی فایر",
    columns: [
      {
        title: "انتخاب آمپلی فایر",
        items: ["آمپلی فایر اهمی", "آمپلی فایر ولتی و اهمی", "اکو آمپلی فایر", "آمپلی فایر پیجینگ"],
      },
    ],
  },
  Mic: {
    title: "میکروفون",
    columns: [
      { title: "میکروفون دستی", items: ["بی سیم", "با سیم", "رو میزی"] },
      { title: "یقه ای", items: ["بی سیم", "با سیم", "گیشه ای"] },
      { title: "هدمیک", items: ["بی سیم", "با سیم"] },
      { title: "استودیویی", items: ["بی سیم", "با سیم"] },
    ],
  },
};

const HOT_KEYWORDS = ["باند", "میکروفون", "هدفون", "آمپلی فایر", "میکسر", "کابل XLR"];

const toPersianDigits = (num) =>
  num.toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatPrice = (price) =>
  toPersianDigits(price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

function Menu({ isCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Band");
  const [isScrolledDown, setIsScrolledDown] = useState(false); // برای سایه‌ی هدر
  const [navHidden, setNavHidden] = useState(false); // برای باز/بسته شدن ردیف دسته‌بندی‌ها
  const [query, setQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(checkLogin());
  const { cartCount, refreshCart, unreadCount, refreshMessages } = useCartStore();

  // --- جستجوی زنده (سبک دیجی‌کالا) ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchWrapRef = useRef(null);
  const [popular, setPopular] = useState([]);
  const [history, setHistory] = useState(getSearchHistory());

  useAuthSync(useCallback(() => setLoggedIn(checkLogin()), []));

  // بارگذاری جستجوهای پرطرفدار از بک‌اند
  useEffect(() => {
    fetchPopularSearches(10)
      .then((data) => {
        const terms = (Array.isArray(data) ? data : [])
          .map((d) => d.term)
          .filter(Boolean);
        if (terms.length) setPopular(terms);
      })
      .catch(() => {});
  }, []);

  // ردیف دسته‌بندی‌ها موقع اسکرول به پایین بسته و موقع اسکرول به بالا باز می‌شود.
  // با یک آستانه (buffer) کار می‌کند تا نوسانات ریز اسکرول (که باعث گیرکردن/پرش
  // منو در بعضی اندازه‌های صفحه می‌شد) دیگر باعث تعویض مداوم کلاس نشوند.
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const SCROLL_BUFFER = 6;
  const SHOW_ABOVE = 90; // زیر این مقدار همیشه باز است

  useEffect(() => {
    lastScrollY.current = window.pageYOffset || document.documentElement.scrollTop;

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);
        const delta = currentY - lastScrollY.current;

        setIsScrolledDown(currentY > 10);

        if (currentY <= SHOW_ABOVE) {
          setNavHidden(false);
        } else if (delta > SCROLL_BUFFER) {
          setNavHidden(true);
        } else if (delta < -SCROLL_BUFFER) {
          setNavHidden(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // بستن دراپ‌داون با کلیک بیرون از باکس جستجو
  useEffect(() => {
    const onDocClick = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setActiveIndex(-1);
  }, [location.pathname, location.search]);

  useEffect(() => {
    refreshCart();
    refreshMessages();
  }, [location.pathname, refreshCart, refreshMessages]);

  // اگر ردیف دسته‌بندی‌ها موقع اسکرول بسته شد، مگامنوی باز را هم ببند
  useEffect(() => {
    if (navHidden) setIsOpen(false);
  }, [navHidden]);

  // جستجوی زنده با تاخیر (Debounce)
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts({ search: value })
        .then((data) => {
          setResults((data || []).slice(0, 6));
          setActiveIndex(-1);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setActiveIndex(-1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (value) setHistory(saveSearch(value));
    navigate(value ? `/Catagoryes?search=${encodeURIComponent(value)}` : "/Catagoryes");
    closeSearch();
  };

  const handleKeyDown = (e) => {
    if (!searchOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (query.trim().length >= 2) setSearchOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchOpen(true);
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        setHistory(saveSearch(query.trim()));
        navigate(`/Product/${results[activeIndex].id}`);
        closeSearch();
      } else {
        handleSearch(e);
      }
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  };

  const goToProduct = (id) => {
    navigate(`/Product/${id}`);
    closeSearch();
  };

  const linkQuery = (value) => `/Catagoryes?search=${encodeURIComponent(value)}`;

  const openSelected = (value) => {
    setHistory(saveSearch(value));
    navigate(linkQuery(value));
    closeSearch();
  };

  const clearHistory = () => setHistory(clearSearchHistory());

  const hasQuery = query.trim().length >= 2;

  return (
    <>
      <header className="Header">
        <p>فروشگاه صوتی تصویری <span className="AvayHeader">آوای</span> انعکاس</p>
      </header>

      <div className={`HeaderWrapper ${isScrolledDown ? 'scrolled' : ''} ${navHidden ? 'nav-hidden' : ''} ${isCart ? "cart-page-margin" : ""}`}>
        <div className="MenuTop">
          <Link to="/" className="logo">آوای <span className="logo2">انعکاس</span></Link>

          <form className="search-container" onSubmit={handleSearch} role="search" ref={searchWrapRef}>
            <FontAwesomeIcon icon={faSearch} className="searchIcon" />
            <input
              className="search"
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder='  جستجو در آوای انعکاس'
              aria-label="جستجو در سایت"
              autoComplete="off"
            />

            {searchOpen && (
              <div className="search-pop">
                {hasQuery ? (
                  <>
                    {results.length > 0 ? (
                      <>
                        <div className="search-pop-head">پیشنهادها</div>
                        <ul className="search-pop-list">
                          {results.map((p, i) => (
                            <li key={p.id}>
                              <div
                                className={`search-pop-item ${i === activeIndex ? 'active' : ''}`}
                                onClick={() => goToProduct(p.id)}
                                onMouseEnter={() => setActiveIndex(i)}
                                role="button"
                                tabIndex={-1}
                              >
                                <SafeImg className="search-pop-thumb" src={p.image} alt={p.title} width="48" height="48" />
                                <div className="search-pop-info">
                                  <span className="search-pop-title">{p.title}</span>
                                  <span className="search-pop-price">{formatPrice(p.price)} <span>تومان</span></span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="search-pop-footer">
                          <button type="button" className="search-pop-viewall" onClick={handleSearch}>
                            <span>مشاهده همه نتایج</span>
                            <span className="search-pop-chevron">‹</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="search-pop-empty">محصولی با این عبارت پیدا نشد</div>
                    )}
                  </>
                ) : (
                  <div className="search-pop-hot">
                    {history.length > 0 && (
                      <>
                        <div className="search-pop-head search-pop-head-row">
                          <span><FontAwesomeIcon icon={faClockRotateLeft} className="search-pop-head-icon" /> تاریخچه جستجو</span>
                          <button type="button" className="search-pop-clear" onClick={clearHistory} aria-label="پاک کردن تاریخچه">
                            <FontAwesomeIcon icon={faTrash} /> پاک کردن
                          </button>
                        </div>
                        <div className="search-pop-chips">
                          {history.map((t) => (
                            <span key={t} className="search-pop-chip" onClick={() => openSelected(t)} role="button" tabIndex={-1}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="search-pop-head"><span className="search-pop-head-fire">🔥</span> جستجوهای پرطرفدار</div>
                    <div className="search-pop-chips">
                      {(popular.length ? popular : HOT_KEYWORDS).map((k) => (
                        <span key={k} className="search-pop-chip search-pop-chip-hot" onClick={() => openSelected(k)} role="button" tabIndex={-1}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="LeftHed">
            <Link to="/AdminPannel" className="AdminPannel"><h6 className="AdminPannel">
              <FontAwesomeIcon icon={faUserTie} />پنل ادمین   </h6>
            </Link>
            {loggedIn ? (
              <Link to="/Profile" className="UserContainer">
                <FontAwesomeIcon icon={faUser} />
                <span>حساب کاربری</span>
              </Link>
            ) : (
              <Link to="/LogIn/SinUp" className="UserContainer">
                <FontAwesomeIcon icon={faUser} />
                <span>ثبت نام | ورود</span>
              </Link>
            )}

            <div className="BorderLine"></div>

             <button className="massege-btn" onClick={() => navigate("/Profile?tab=messages")} aria-label=" پیام ها">
              <FontAwesomeIcon icon={faBell} />
              {unreadCount > 0 && <span className="bell-unread-badge">{toPersianDigits(unreadCount)}</span>}
            </button>

            <button className="cart-btn" onClick={() => navigate("/Cart")} aria-label="سبد خرید">
              <FontAwesomeIcon icon={faCartShopping} />
              {cartCount > 0 && <span className="cart-count-badge">{toPersianDigits(cartCount)}</span>}
            </button>

            
          </div>
        </div>

        <div className="Border"></div>

        <nav className="Menu" aria-label="منوی اصلی">
          <ul>
            <li
              className="category-trigger"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <button type="button" className="trigger-btn" onClick={() => setIsOpen((v) => !v)}>
                <span className="hamburger"><FontAwesomeIcon icon={faBars} /></span>
                <span>دسته‌بندی کالاها</span>
              </button>

              {isOpen && (
                <div className="digikala-mega-menu">
                  <div className="sidebar">
                    {Object.keys(CATEGORY_DATA).map((catKey) => (
                      <div
                        key={catKey}
                        className={`sidebar-item ${activeCategory === catKey ? "active" : ""}`}
                        onMouseEnter={() => setActiveCategory(catKey)}
                      >
                        {CATEGORY_DATA[catKey].title}
                      </div>
                    ))}
                  </div>
                  <div className="content-area">
                    {CATEGORY_DATA[activeCategory].columns.map((col, colIndex) => (
                      <div key={colIndex} className="menu-column">
                        <h4 className="column-title-MegaMenu">
                          <span className="title-text">{col.title}</span>
                          <span className="chevron">›</span>
                        </h4>
                        <ul className="item-list">
                          {col.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="item-link">
                              <Link onClick={() => { setIsOpen(false); setHistory(saveSearch(item)); }} to={linkQuery(item)}>{item}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>

            <li><Link to="/"><FontAwesomeIcon icon={faBurst} /> شگفت‌انگیزها</Link></li>
            <li><Link to="/"><FontAwesomeIcon icon={faSun} /> ترندترین‌ها</Link></li>
            <li><Link to="/"><FontAwesomeIcon icon={faFire} /> پرفروش‌ترین‌ها</Link></li>
            <li><Link to="/"><FontAwesomeIcon icon={faHeart} /> محبوب‌ترین‌ها</Link></li>
          </ul>
        </nav>
      </div>

      <nav className="MobileMenu" aria-label="منوی موبایل">
        <div className="IconMenuContainer">
          <NavLink className={({ isActive }) => (isActive ? "active-link" : "")} to="/">
            <FontAwesomeIcon icon={faHome} />
            <span>خانه</span>
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active-link" : "")} to="/Catagoryes">
            <FontAwesomeIcon icon={faBars} />
            <span>دسته‌بندی</span>
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active-link" : "")} to="/Cart">
            <FontAwesomeIcon icon={faCartShopping} />
            <span>سبد خرید</span>
          </NavLink>
          {loggedIn ? (
            <NavLink className={({ isActive }) => (isActive ? "active-link" : "mobUser")} to="/Profile">
              <FontAwesomeIcon icon={faUser} />
              <span>آوای من</span>
            </NavLink>
          ) : (
            <NavLink className={({ isActive }) => (isActive ? "active-link" : "mobUser")} to="/LogIn/SinUp">
              <FontAwesomeIcon icon={faUser} />
              <span>آوای من</span>
            </NavLink>
          )}
        </div>
      </nav>
    </>
  );
}

export default Menu;