import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Menu.css";
import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBurst, faCartShopping, faFire, faHeart, faHome, faSearch, faSun, faUser, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { isLoggedIn as checkLogin } from '../../auth';
import { useAuthSync } from '../../useSeo';

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

function Menu({ isCart }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Band");
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [query, setQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(checkLogin());

  useAuthSync(useCallback(() => setLoggedIn(checkLogin()), []));

  const winScroll = useCallback(() => {
    const top = window.pageYOffset || document.documentElement.scrollTop;
    setIsScrolledDown(top > 80);
  }, []);

  // اسکرول فقط در کامپوننت منو گوش داده می‌شود
  useEffect(() => {
    window.addEventListener('scroll', winScroll, { passive: true });
    return () => window.removeEventListener('scroll', winScroll);
  }, [winScroll]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = query.trim();
    navigate(value ? `/Catagoryes?search=${encodeURIComponent(value)}` : "/Catagoryes");
  };

  const linkQuery = (value) => `/Catagoryes?search=${encodeURIComponent(value)}`;

  return (
    <>
      <header className="Header">
        <p>فروشگاه صوتی تصویری <span className="AvayHeader">آوای</span> انعکاس</p>
      </header>

      <div className={`HeaderWrapper ${isScrolledDown ? 'scrolled' : ''} ${isCart ? "cart-page-margin" : ""}`}>
        <div className="MenuTop">
          <Link to="/" className="logo">آوای <span className="logo2">انعکاس</span></Link>

          <form className="search-container" onSubmit={handleSearch} role="search">
            <FontAwesomeIcon icon={faSearch} className="searchIcon" />
            <input
              className="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='  جستجو در آوای انعکاس'
              aria-label="جستجو در سایت"
            />
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
            <button className="cart-btn" onClick={() => navigate("/Cart")} aria-label="سبد خرید">
              <FontAwesomeIcon icon={faCartShopping} />
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
                              <Link onClick={() => setIsOpen(false)} to={linkQuery(item)}>{item}</Link>
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