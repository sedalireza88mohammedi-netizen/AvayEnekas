
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faTelegram } from '@fortawesome/free-brands-svg-icons';
library.add(faInstagram);
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react";
import "./Footer.css"
import { faCircleCheck, faThumbsUp, faTruck } from '@fortawesome/free-regular-svg-icons';
import { faCube } from '@fortawesome/free-solid-svg-icons/faCube';
function Footer() {
    const navigate = useNavigate()
    const neshanUrl = "https://neshan.org/maps/search/آوای انعکاس، قم";



    return (
        <>
            <footer className="footer">
                <div className="RightSide">
                    <div className="FooterLogo">آوای <span className="FooterLogo2">انعکاس</span></div>
                    <h2 className="AboutUsTitle">درباره آوای انعکاس</h2>
                    <div className="AboutUs"></div>
                    <p className="DeatelseAboutUs">فروشگاه ما با ارایه مجموعه ای متنوع از محصولات صوتی و تصویری ، تجربه ای آسان و مطمئن برای خرید آنلاین فراهم کرده است. با ضمانت کیفیت، ارسال سریع و پشتیبانی حرفه ای، همراه شما هستیم و امروز آوای انعکاس حرفه‌ای‌ترین و به‌روزترین تجهیزات صوت، تصویر و نورپردازی را ارائه می‌کند. همچنین ما  تمامی خدمات طراحی، مهندسی، مشاوره و اجرای تجهیزات صوت، تصویر و نورپردازی را برای سالن‌های همایش، کنفرانس، سینما، حسینیه‌ها و ... ارائه می‌دهیم.
                    </p>
                    <h3 className="ourNumber">تلفن ما:09027741653</h3>
                    <section className='WithUs' >همراه ما باشید</section>

                    <div className="iconContainerFooter">
                        <a title='پیج اینستگرام ما' href="https://www.instagram.com/enekas_ava?igsh=MWVob2ppamdlcWtqMg==" target='_blank'><FontAwesomeIcon icon={faInstagram} /></a>
                        <a title='نشانی ایتا ما' href="https://eitaa.com/enekas_ava" target='_blank'><img src="src/assets/Images/Itta-Icon.jpg" alt="ایتای ما" /></a>
                        <a href="#" target='_blank'><FontAwesomeIcon icon={faTelegram} /></a>
                    </div>

                </div>

                <div className="LeftSide">
                    <div className="PoruductListFooter">
                        <ul className="footerList">
                            <h2>محصولات</h2>
                            <li>
                                <Link>باند</Link>
                            </li>
                            <li>
                                <Link>آمپلی فایر</Link>
                            </li>
                            <li>
                                <Link>باند پسیو</Link>
                            </li>
                            <li>
                                <Link>میکسر دیجیتال</Link>
                            </li>
                            <li>
                                <Link>پاور میکسر</Link>
                            </li>
                            <li>
                                <Link>میکرفون</Link>
                            </li>
                        </ul>
                    </div>

                    <div className="EasyToch">
                        <ul className="footerList">
                            <h2>دسترسی آسان</h2>
                            <li>
                                <Link onClick={() => { navigate("/") }}>صفحه اصلی</Link>
                            </li>
                            <li>
                                <Link>درباره ما </Link>
                            </li>
                            <li>
                                <Link> ارتباط با ما</Link>
                            </li>
                            <li>
                                <Link> دسته بندی ها</Link>
                            </li>

                            <li>
                                <Link>مشاوره رایگان</Link>
                            </li>
                        </ul>
                    </div>

<div className="footer-map" onClick={() => window.open(neshanUrl, "_blank")}>
                        <img title="موقعیت مکانی فروشگاه آوای" src="src/assets/Images/Map-Image.jpg" alt="لوکیشن فروشگاه آوای انعکاس" className="map-image" />
                    </div>

                </div>



                <section className="borderFooter"></section>

                <div className='trustContainer'>
                    <div className='trustItem'>
                        <span className='trustIcon Truck'><FontAwesomeIcon icon={faTruck} /></span>
                        <div className='trustText'>
                            <span className='trustTitle'>ارسال سریع</span>
                            <span className='trustSubtitle'>در کمترین زمان ممکن</span>
                        </div>
                    </div>

                    <span className='trustDivider'></span>

                    <div className='trustItem'>
                        <span className='trustIcon'><FontAwesomeIcon icon={faCircleCheck} /></span>
                        <div className='trustText'>
                            <span className='trustTitle'>ضمانت بازگشت کالا</span>
                            <span className='trustSubtitle'>حداکثر ۱۰ روز کاری</span>
                        </div>
                    </div>

                    <span className='trustDivider'></span>

                    <div className='trustItem'>
                        <span className='trustIcon'><FontAwesomeIcon icon={faThumbsUp} /></span>
                        <div className='trustText'>
                            <span className='trustTitle'>اصالت کالا</span>
                            <span className='trustSubtitle'>از بهترین برندها</span>
                        </div>
                    </div>
                </div>

                <div className='TrustDigitalContaner'>
                    <div className="TrustDigital"></div>
                    <div className="TrustDigital"></div>
                    <div className="TrustDigital"></div>
                </div>

                <br />

            </footer>
            <footer className="footerBar">استریو صوتی تصویری آوای انعکاس</footer>
        </>
    )
}
export default Footer