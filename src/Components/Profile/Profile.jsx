
import { useState, useEffect, useRef } from "react"
import "./profile.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBell, faExclamation, faHeart, faLocationDot, faPlus, faShoppingCart, faUser, faChevronDown } from '@fortawesome/free-solid-svg-icons';

library.add(faShoppingCart, faHeart, faBell, faLocationDot, faUser, faExclamation, faChevronDown);

// کامپوننت مشترک برای نمایش پیام خالی بودن یک بخش
function EmptyState({ message }) {
    return (
        <h2 className="Nothing">
            <FontAwesomeIcon icon={faExclamation} /> {message}
        </h2>
    )
}

const ORDER_STATUS_LIST = [
    { key: "InProgress", label: "جاری", emptyMessage: "هنوز هیچ سفارش جاری‌ای ندارید" },
    { key: "Delivered", label: "تحویل شده", emptyMessage: "هنوز هیچ سفارشی تحویل داده نشده" },
    { key: "Returned", label: "مرجوع شده", emptyMessage: "هنوز هیچ سفارشی مرجوع نشده" },
    { key: "Canceled", label: "لغو شده", emptyMessage: "هنوز هیچ سفارشی لغو نشده" },
]

function Profile() {
    const [page, setPage] = useState("Profile")
    const [activeOrderOption, setActiveOrderOption] = useState("InProgress")

    // وضعیت‌های داده‌ها
    const [orders, setOrders] = useState({
        InProgress: [], Delivered: [], Returned: [], Canceled: [],
    })
    const [interestedList, setInterestedList] = useState([])
    const [messages, setMessages] = useState([])
    const [addresses, setAddresses] = useState([])

    // استیت‌های مقادیر فرم پروفایل
    const [formData, setFormData] = useState({
        NameAndFamily: "",
        BirthDate: "",
        IdCard: "",
        Email: "",
        Number: ""
    });

    // استیت خطاها و پیام موفقیت
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // استیت‌های مربوط به منوی سفارشی جنسیت
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedGender, setSelectedGender] = useState({ label: "لطفاً انتخاب کنید", value: "" });
    const dropdownRef = useRef(null);

    const currentOrders = orders[activeOrderOption] || []
    const currentOrderConfig = ORDER_STATUS_LIST.find(o => o.key === activeOrderOption)

    // بستن منو با کلیک بیرون از آن
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectOption = (label, value) => {
        setSelectedGender({ label, value });
        setIsDropdownOpen(false);
        setErrorMessage(""); // با انتخاب جنسیت، خطای احتمالی پاک شود
    };

    // بروزرسانی مقادیر فرم به محض تایپ
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setErrorMessage(""); // با هر بار تایپ، خطای قبلی پاک می‌شود
    };

    // تابع اعتبارسنجی و ثبت نهایی
    const handleSubmitProfile = (e) => {
        e.preventDefault();

        // شرط‌های بررسی صحت فیلدها
        if (!formData.NameAndFamily.trim()) {
            setErrorMessage("لطفاً نام و نام خانوادگی را وارد کنید.");
            return;
        }
        if (!formData.BirthDate.trim()) {
            setErrorMessage("لطفاً تاریخ تولد را وارد کنید.");
            return;
        }
        if (!selectedGender.value) {
            setErrorMessage("لطفاً جنسیت خود را انتخاب کنید.");
            return;
        }
        if (!formData.IdCard.trim() || formData.IdCard.length < 8) {
            setErrorMessage("لطفاً کد ملی معتبر وارد کنید.");

return;
        }
        if (!formData.Email.trim() || !formData.Email.includes("@")) {
            setErrorMessage("لطفاً یک ایمیل معتبر وارد کنید.");
            return;
        }
        if (!formData.Number.trim() || formData.Number.length < 10) {
            setErrorMessage("لطفاً شماره تلفن معتبر وارد کنید.");
            return;
        }

        // اگر تمام شرط‌ها درست بود:
        setErrorMessage("");
        const finalData = {
            ...formData,
            gender: selectedGender.value
        };

        console.log("اطلاعات معتبر و آماده ارسال به بک‌اند:", finalData);
        setSuccessMessage("اطلاعات پروفایل با موفقیت ثبت شد!");

        // پاک کردن پیام موفقیت پس از ۴ ثانیه
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    return (
        <div className="ContaimerAllPro">
            <div className="SideBar">
                <img className="AccountImage" src="public/Images/AccountImage.png" alt="تصویر حساب کاربری" />
                <div className="subjects">
                    <h3>سید محمد محمدی</h3>
                    <h4>09027741653</h4>
                </div>

                <div className="Options">
                    <button onClick={() => setPage("Orders")} className={page === "Orders" ? "sideBar-active" : "OptionBtn"}>
                        <FontAwesomeIcon icon={faShoppingCart} /> سفارش‌ها
                    </button>
                    <h6 className="LinePro"></h6>

                    <button onClick={() => setPage("Interested")} className={page === "Interested" ? "sideBar-active" : "OptionBtn"}>
                        <FontAwesomeIcon icon={faHeart} /> علاقه‌مندی‌ها
                    </button>
                    <h6 className="LinePro"></h6>

                    <button onClick={() => setPage("Messages")} className={page === "Messages" ? "sideBar-active" : "OptionBtn"}>
                        <FontAwesomeIcon icon={faBell} /> پیام‌ها
                    </button>
                    <h6 className="LinePro"></h6>

                    <button onClick={() => setPage("Address")} className={page === "SideBar-active" ? "sideBar-active" : "OptionBtn"}>
                        <FontAwesomeIcon icon={faLocationDot} /> آدرس‌ها
                    </button>
                    <h6 className="LinePro"></h6>

                    <button onClick={() => setPage("Profile")} className={page === "Profile" ? "sideBar-active" : "OptionBtn"}>
                        <FontAwesomeIcon icon={faUser} /> پروفایل
                    </button>
                </div>
            </div>

            <div id="ProContainer" className="ProContainer">
                {page === "Orders" && (
                    <>
                        <h2 className="TitleOptions"><FontAwesomeIcon icon={faShoppingCart} /> تاریخچه سفارشات</h2>
                        <div className="optionsOrders">
                            {ORDER_STATUS_LIST.map(status => (
                                <h3
                                    key={status.key}
                                    onClick={() => setActiveOrderOption(status.key)}
                                    className={activeOrderOption === status.key ? "Option-Active" : "statusOptionOrders"}
                                >
                                    {status.label}
                                </h3>
                            ))}
                        </div>
                        <h6 className="LineOrder"></h6>

                        {currentOrders.length > 0 ? (
                            <div className="OrdersList">
                                {currentOrders.map(order => (
                                    <div key={order.id} className="OrderCard"></div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message={currentOrderConfig?.emptyMessage} />
                        )}
                    </>
                )}


{page === "Interested" && (
                    <>
                        <h2 className="TitleOptions"><FontAwesomeIcon icon={faHeart} /> لیست علاقه‌مندی‌ها</h2>
                        <h6 className="LineOrder"></h6>
                        {interestedList.length > 0 ? (
                            <div className="InterestedList">
                                {interestedList.map(item => (
                                    <div key={item.id} className="InterestedCard"></div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="هنوز هیچ محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید" />
                        )}
                    </>
                )}

                {page === "Messages" && (
                    <>
                        <h2 className="TitleOptions"><FontAwesomeIcon icon={faBell} /> پیام‌ها</h2>
                        <h6 className="LineOrder"></h6>
                        {messages.length > 0 ? (
                            <div className="MessagesList">
                                {messages.map(msg => (
                                    <div key={msg.id} className="MessageCard"></div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="پیامی برای نمایش وجود ندارد" />
                        )}
                    </>
                )}

                {page === "Address" && (
                    <>
                        <h2 className="TitleOptions"><FontAwesomeIcon icon={faLocationDot} /> آدرس‌ها</h2>
                        <h6 className="LineOrder"></h6>
                        {addresses.length > 0 ? (
                            <div className="AddressList">
                                {addresses.map(addr => (
                                    <div key={addr.id} className="AddressCard"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <EmptyState message="هنوز آدرسی ثبت نکرده‌اید" />
                                <div className="AddAddresContaner">
                                    <h3> <FontAwesomeIcon icon={faPlus} /> افزودن آدرس جدید </h3>
                                </div>
                            </>
                        )}
                    </>
                )}

                {page === "Profile" && (
                    <form onSubmit={handleSubmitProfile} className="ProfileContainer">
                        <div className="FildContainer">
                            <label htmlFor="NameAndFamily">نام و نام خانوادگی</label>
                            <input 
                                type="text" 
                                name="NameAndFamily" 
                                id="NameAndFamily" 
                                placeholder="سید محمد محمدی" 
                                value={formData.NameAndFamily}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="FildContainer">
                            <label htmlFor="BirthDate">تاریخ تولد</label>
                            <input 
                                type="text" 
                                name="BirthDate" 
                                id="BirthDate" 
                                placeholder="1377/1/6" 
                                value={formData.BirthDate}
                                onChange={handleChange}
                            />
                        </div>
                        
                        {/* منوی سفارشی جنسیت */}

<div className="FildContainer" ref={dropdownRef}>
                            <label>جنسیت</label>
                            <div className="custom-select-wrapper">
                                <div 
                                    className={`custom-select-trigger ${isDropdownOpen ? 'open' : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span style={{ color: selectedGender.value === "" ? "#888" : "#212121" }}>
                                        {selectedGender.label}
                                    </span>
                                    <FontAwesomeIcon icon={faChevronDown} className={`custom-arrow ${isDropdownOpen ? 'rotate' : ''}`} />
                                </div>

                                {isDropdownOpen && (
                                    <div className="custom-options">
                                        <div className="custom-option" onClick={() => handleSelectOption("مرد", "Male")}>
                                            مرد
                                        </div>
                                        <div className="custom-option" onClick={() => handleSelectOption("زن", "Female")}>
                                            زن
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="FildContainer">
                            <label htmlFor="IdCard">کد ملی</label>
                            <input 
                                type="number" 
                                name="IdCard" 
                                id="IdCard" 
                                placeholder="037350854" 
                                value={formData.IdCard}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="FildContainer">
                            <label htmlFor="Email">ایمیل</label>
                            <input 
                                type="email" 
                                name="Email" 
                                id="Email" 
                                placeholder="SedMad@gmail.com" 
                                value={formData.Email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="FildContainer">
                            <label htmlFor="Number">شماره تلفن</label>
                            <input 
                                type="number" 
                                name="Number" 
                                id="Number" 
                                placeholder="09027741653" 
                                value={formData.Number}
                                onChange={handleChange}
                            />
                        </div>

                        {/* نمایش پیام خطا یا موفقیت */}
                        {errorMessage && <div className="form-error-msg">{errorMessage}</div>}
                        {successMessage && <div className="form-success-msg">{successMessage}</div>}

                        {/* دکمه ثبت تغییرات */}
                        <div className="SubmitBtnContainer">
                            <button type="submit" className="SubmitProfileBtn">ثبت تغییرات</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Profile