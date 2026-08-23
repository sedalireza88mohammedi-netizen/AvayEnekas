import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Menu.css";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars, faBurst, faCartShopping, faFire, faHeart, faHome, faSearch, faSun, faUser, faUserTie } from '@fortawesome/free-solid-svg-icons';


library.add(faBars, faUser, faCartShopping, faHome, faUserTie);

function Menu({ isCart }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Band");
    const [isScrolledDown, setIsScrolledDown] = useState(false);

    const scrollStateRef = useRef({ isScrolledDown: false, isLocked: false, lastScroll: 0 });


    useEffect(() => {
        scrollStateRef.current.isScrolledDown = isScrolledDown;
    }, [isScrolledDown]);


    useEffect(() => {
        const handleScroll = () => {
            const { isScrolledDown: currentStatus, isLocked, lastScroll } = scrollStateRef.current;
            if (isLocked) return;

            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (Math.abs(scrollTop - lastScroll) < 10) return;

            if (scrollTop <= 0) {
                if (currentStatus) {
                    setIsScrolledDown(false);
                    triggerLock();
                }
                scrollStateRef.current.lastScroll = 0;
                return;
            }

            if (scrollTop > 80) {
                if (scrollTop > lastScroll && !currentStatus) {
                    setIsScrolledDown(true);
                    triggerLock();
                } else if (scrollTop < lastScroll && currentStatus) {
                    setIsScrolledDown(false);
                    triggerLock();
                }
            } else {
                if (currentStatus) {
                    setIsScrolledDown(false);
                    triggerLock();
                }
            }

            scrollStateRef.current.lastScroll = scrollTop;
        };

        const triggerLock = () => {
            scrollStateRef.current.isLocked = true;
            setTimeout(() => {
                scrollStateRef.current.isLocked = false;
            }, 350);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isLoggedin = localStorage.getItem("isLoggedin");
    const CategoryDataMenu = {
        Band: {
            title: "باند",
            columns: [
                {
                    title: "انتخاب باند",
                    items: ["بلندگو اکتیو", "بلندگو پسیو", "ساب ووفر", "اسپیکر مانیتور", "اسپیکر دیواری", "اسپیکر سقفی", "اسپیکر ستونی", "اسپیکر شیپوری و هورن"]
                },
                {
                    title: "باند براساس قیمت",
                    items: ["باند تا 100 میلیون", "باند تا 200 میلیون", "باند تا 300 میلیون"]
                },
            ]
        },
        MicSer: {
            title: "میکسر",
            columns: [
                {
                    title: "انتخاب میکسر",
                    items: ["میکسر دیجیتال", "میکسر آنالوگ", "پاور میکسر", "ماتریکس دیجیتال"]
                },
                {
                    title: "نوع میکسر",
                    items: ["میکروفون ارزان", "میکروفون حرفه‌ای", "میکروفون بی‌سیم"]
                },
            ]
        },
        AmpilyFire: {
            title: "آمپلی فایر",
            columns: [
                {
                    title: "انتخاب آمپلی فایر",
                    items: ["آمپلی فایر اهمی", "آمپلی فایر ولتی و اهمی", "اکو آمپلی فایر", "آمپلی فایر پیجینگ"]

                },
            ]
        },
        Mic: {
            title: "میکروفون",
            columns: [
                {
                    title: "میکروفون دستی",
                    items: ["بی سیم", "با سیم", "رو میزی"]
                },
                {
                    title: "یقه ای",
                    items: ["بی سیم", "با سیم", "گیشه ای"]
                },
                {
                    title: "هدمیک",
                    items: ["بی سیم", "با سیم"]
                },
                {
                    title: "استودیویی",
                    items: ["بی سیم", "با سیم"]
                }
            ]
        },
    };

    return (
        <>
            <header className="Header">
                <p>فروشگاه صوتی تصویری <span className="AvayHeader">آوای</span> انعکاس</p>
            </header>

            <div className={`HeaderWrapper ${isScrolledDown ? 'scrolled' : ''} ${isCart ? "cart-page-margin" : ""}`}>
                <div className="MenuTop">
                    <div className="logo">آوای <span className="logo2">انعکاس</span></div>


                    <form className="search-container" onSubmit={(e) => e.preventDefault()}>
                        <FontAwesomeIcon icon={faSearch} className="searchIcon" />
                        <input className="search" type="text" placeholder='  جستجو در آوای انعکاس' aria-label="جستجو در سایت" />
                    </form>

                    <div className="LeftHed">
                        <Link to="/AdminPannel" className="AdminPannel">  <h6 className="AdminPannel">
                            <FontAwesomeIcon icon={faUserTie} />پنل ادمین   </h6>
                        </Link>
                        {
                            isLoggedin ? (
                                <Link to="/Profile" className="UserContainer">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>حساب کاربری</span>
                                </Link>
                            )
                                :
                                (
                                    <Link to="/LogIn/SinUp" className="UserContainer">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>ثبت نام | ورود</span>
                                    </Link>
                                )
                        }

                        <div className="BorderLine"></div>
                        <button className="cart-btn" onClick={() => navigate("/Cart")} aria-label="سبد خرید">
                            <FontAwesomeIcon icon={faCartShopping} />
                        </button>
                    </div>
                </div>

                <div className="Border"></div>


                <nav className="Menu">
                    <ul>
                        <li
                            className="category-trigger"
                            onMouseEnter={() => setIsOpen(true)}
                            onMouseLeave={() => setIsOpen(false)}
                        >
                            <div className="trigger-btn">
                                <span className="hamburger"><FontAwesomeIcon icon={faBars} /></span>
                                <span>دسته‌بندی کالاها</span>
                            </div>

                            {isOpen && (
                                <div className="digikala-mega-menu">
                                    <div className="sidebar">
                                        {Object.keys(CategoryDataMenu).map((catKey) => (
                                            <div
                                                key={catKey}
                                                className={`sidebar-item ${activeCategory === catKey ? "active" : ""}`}
                                                onMouseEnter={() => setActiveCategory(catKey)}
                                            >
                                                {CategoryDataMenu[catKey].title}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="content-area">
                                        {CategoryDataMenu[activeCategory].columns.map((col, colIndex) => (
                                            <div key={colIndex} className="menu-column">


                                                <h4 className="column-title-MegaMenu">
                                                    <span className="title-text">{col.title}</span>
                                                    <span className="chevron">›</span>
                                                </h4>
                                                <ul className="item-list">
                                                    {col.items.map((item, itemIndex) => (
                                                        <li key={itemIndex} className="item-link">
                                                            <Link to="/">{item}</Link>
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
                </nav >
            </div >


            <div nav className="MobileMenu" >
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
                    {
                        isLoggedin ? (
                            <NavLink className={({ isActive }) => (isActive ? "active-link" : "mobUser")} to="/Profile">
                                <FontAwesomeIcon icon={faUser} />
                                <span>آوای من</span>
                            </NavLink>
                        ) : (
                            <NavLink className={({ isActive }) => (isActive ? "active-link" : "mobUser")} to="/LogIn/SinUp">
                                <FontAwesomeIcon icon={faUser} />
                                <span>آوای من</span>
                            </NavLink>
                        )
                    }

                </div>
            </div >
        </>
    );
}

export default Menu;