import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./profile.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBell, faExclamation, faHeart, faLocationDot, faPlus, faShoppingCart, faUser, faChevronDown, faArrowRightFromBracket, faTrash, faStar, faTrashCan, faUserTie, faCheckDouble, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { isLoggedIn, clearAuth, getPhone } from "../../auth";
import {
  getProfile, updateProfile, getMyOrders, getFavorites, removeFavorite,
  getAddresses, addAddress, setDefaultAddress, deleteAddress, getMyMessages,
} from "../../api";
import SafeImg from "../../SafeImg";
import { useCartStore } from "../../cartStore";

library.add(faShoppingCart, faHeart, faBell, faLocationDot, faUser, faExclamation, faChevronDown, faArrowRightFromBracket, faTrash, faStar, faTrashCan, faUserTie, faCheckDouble, faReceipt);

const toPersianDigits = (num) =>
  (num || 0).toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatPrice = (price) =>
  (price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function formatJalali(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return toPersianDigits(
      d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return "";
  }
}

function EmptyState({ message }) {
  return (
    <h2 className="Nothing">
      <FontAwesomeIcon icon={faExclamation} /> {message}
    </h2>
  )
}

function InvoiceView({ order, onBack }) {
  const items = Array.isArray(order.line_items) ? order.line_items : []
  return (
    <div className="InvoiceView">
      <div className="InvoiceTop">
        <h3 className="TitleOptions"><FontAwesomeIcon icon={faReceipt} /> فاکتور سفارش {order.id}</h3>
        <button type="button" className="InvoiceBack" onClick={onBack}>
          بازگشت به سفارش‌ها
        </button>
      </div>
      <h6 className="LineOrder"></h6>

      <div className="InvoiceBlock">
        <h4 className="InvoiceBlockTitle">خلاصه سفارش</h4>
        <div className="InvoiceRow"><span>کد پیگیری</span><strong>{order.id}</strong></div>
        <div className="InvoiceRow"><span>تاریخ ثبت</span><strong>{formatJalali(order.date)}</strong></div>
        <div className="InvoiceRow"><span>وضعیت</span><strong className="InvoiceStatus">{order.status || "—"}</strong></div>
        <div className="InvoiceRow"><span>نحوه پرداخت</span><strong>{order.payment || "—"}</strong></div>
      </div>

      <div className="InvoiceBlock">
        <h4 className="InvoiceBlockTitle">اطلاعات گیرنده</h4>
        {order.customer ? <div className="InvoiceRow"><span>نام و نام خانوادگی</span><strong>{order.customer}</strong></div> : null}
        {order.phone ? <div className="InvoiceRow"><span>شماره تماس</span><strong dir="ltr">{order.phone}</strong></div> : null}
        {order.email ? <div className="InvoiceRow"><span>ایمیل</span><strong dir="ltr">{order.email}</strong></div> : null}
        {order.address ? <div className="InvoiceRow"><span>آدرس</span><strong>{order.address}</strong></div> : null}
      </div>

      {items.length > 0 ? (
        <div className="InvoiceBlock">
          <h4 className="InvoiceBlockTitle">اقلام سفارش ({toPersianDigits(items.length)} ردیف)</h4>
          <div className="InvoiceItems">
            {items.map((item, i) => (
              <div className="InvoiceItem" key={i}>
                {item.image ? (
                  <img className="InvoiceItemImg" src={item.image} alt={item.name} />
                ) : (
                  <div className="InvoiceItemImg InvoiceItemImgEmpty"></div>
                )}
                <div className="InvoiceItemInfo">
                  {item.product_id ? (
                    <Link to={`/Product/${item.product_id}`} className="InvoiceItemName">{item.name}</Link>
                  ) : (
                    <span className="InvoiceItemName">{item.name}</span>
                  )}
                  <span className="InvoiceItemMeta">
                    {toPersianDigits(item.quantity)} × {toPersianDigits(formatPrice(item.price))} تومان
                  </span>
                </div>
                <strong className="InvoiceItemTotal">{toPersianDigits(formatPrice(item.subtotal))} تومان</strong>
              </div>
            ))}
          </div>
          <div className="InvoiceTotalRow">
            <span>جمع کل سفارش</span>
            <strong>{toPersianDigits(formatPrice(order.total || 0))} تومان</strong>
          </div>
        </div>
      ) : (
        <div className="InvoiceBlock">
          <h4 className="InvoiceBlockTitle">اقلام سفارش</h4>
          <p className="muted">هیچ ردیفی برای این سفارش ثبت نشده است ({toPersianDigits(order.items || 0)} قلم کالا).</p>
        </div>
      )}
    </div>
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
  const [selectedOrder, setSelectedOrder] = useState(null)

  const [orders, setOrders] = useState({
    InProgress: [], Delivered: [], Returned: [], Canceled: [],
  })
  const [interestedList, setInterestedList] = useState([])
  const [messages, setMessages] = useState([])
  const [addresses, setAddresses] = useState([])
  const [profile, setProfile] = useState({
    NameAndFamily: "", BirthDate: "", IdCard: "", Email: "", Number: "", gender: "",
  })
  const [newAddress, setNewAddress] = useState({ title: "", address: "", postal_code: "" })
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [loading, setLoading] = useState(true)
  const logged = isLoggedIn()

  const [formData, setFormData] = useState({
    NameAndFamily: "",
    BirthDate: "",
    IdCard: "",
    Email: "",
    Number: ""
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState({ label: "لطفاً انتخاب کنید", value: "" });
  const dropdownRef = useRef(null);

  const currentOrders = orders[activeOrderOption] || []
  const currentOrderConfig = ORDER_STATUS_LIST.find(o => o.key === activeOrderOption)

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { markOneMessageRead } = useCartStore();

  const allMessagesRead = messages.length > 0 && messages.every((m) => m.is_read);

  const openMessage = (msg) => {
    if (!msg.is_read) {
      markOneMessageRead(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
  };

  const markAllMessages = () => {
    messages.forEach((m) => {
      if (!m.is_read) markOneMessageRead(m.id);
    });
    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
  };

  useEffect(() => {
    if (searchParams.get("tab") === "messages") setPage("Messages");
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!logged) { setLoading(false); return; }
    let active = true;

    const load = async () => {
      try {
        const [prof, ords, favs, addrs, msgs] = await Promise.all([
          getProfile().catch(() => ({})),
          getMyOrders().catch(() => ({ InProgress: [], Delivered: [], Returned: [], Canceled: [] })),
          getFavorites().catch(() => []),
          getAddresses().catch(() => []),
          getMyMessages().catch(() => []),
        ]);
        if (!active) return;
        if (prof && prof.NameAndFamily) {
          setFormData({
            NameAndFamily: prof.NameAndFamily || "",
            BirthDate: prof.BirthDate || "",
            IdCard: prof.IdCard || "",
            Email: prof.Email || "",
            Number: prof.Number || "",
          });
          setProfile(prof);
          if (prof.gender) setSelectedGender({ label: prof.gender === "Male" ? "مرد" : prof.gender === "Female" ? "زن" : prof.gender, value: prof.gender });
        }
        setOrders(ords || { InProgress: [], Delivered: [], Returned: [], Canceled: [] });
        setInterestedList(favs || []);
        setAddresses(addrs || []);
        setMessages(msgs || []);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [logged]);

  const handleSelectOption = (label, value) => {
    setSelectedGender({ label, value });
    setIsDropdownOpen(false);
    setErrorMessage("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage("");
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    if (!formData.NameAndFamily.trim()) {
      setErrorMessage("لطفاً نام و نام خانوادگی را وارد کنید.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    const finalData = {
      ...formData,
      gender: selectedGender.value
    };

    try {
      await updateProfile(finalData);
      setSuccessMessage("اطلاعات پروفایل با موفقیت ثبت شد!");
    } catch {
      setErrorMessage("در ذخیره‌سازی اطلاعات خطایی رخ داد. دوباره تلاش کنید.");
    }
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const reloadFavorites = async () => {
    const favs = await getFavorites().catch(() => []);
    setInterestedList(favs);
  };

  const handleRemoveFavorite = async (productId) => {
    await removeFavorite(productId).catch(() => {});
    reloadFavorites();
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.title.trim() || !newAddress.address.trim()) {
      setErrorMessage("عنوان و متن آدرس الزامی است.");
      return;
    }
    await addAddress(newAddress).catch(() => {});
    setNewAddress({ title: "", address: "", postal_code: "" });
    setShowAddAddress(false);
    setErrorMessage("");
    const addrs = await getAddresses().catch(() => []);
    setAddresses(addrs);
  };

  const handleDeleteAddress = async (id) => {
    await deleteAddress(id).catch(() => {});
    const addrs = await getAddresses().catch(() => []);
    setAddresses(addrs);
  };

  const handleDefaultAddress = async (id) => {
    await setDefaultAddress(id).catch(() => {});
    const addrs = await getAddresses().catch(() => []);
    setAddresses(addrs);
  };

  if (loading) {
    return (
      <div className="ContaimerAllPro">
        <div className="ProContainer">
          <h2 className="Nothing">در حال بارگذاری...</h2>
        </div>
      </div>
    );
  }

  if (!logged) {
    return (
      <div className="ContaimerAllPro">
        <div className="ProContainer">
          <h2 className="Nothing">برای مشاهده حساب کاربری وارد شوید</h2>
          <div className="AddAddresContaner">
            <Link to="/LogIn/SinUp" className="SubmitProfileBtn">ورود / ثبت‌نام</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ContaimerAllPro">
      <div className="SideBar">
        <img className="AccountImage" src="public/Images/AccountImage.png" alt="تصویر حساب کاربری" />
        <div className="subjects">
          <h3>{profile.NameAndFamily || "کاربر آوای انعکاس"}</h3>
          <h4>{profile.Number || getPhone() || ""}</h4>
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

          <button onClick={() => setPage("Address")} className={page === "Address" ? "sideBar-active" : "OptionBtn"}>
            <FontAwesomeIcon icon={faLocationDot} /> آدرس‌ها
          </button>
          <h6 className="LinePro"></h6>

          <button onClick={() => setPage("Profile")} className={page === "Profile" ? "sideBar-active" : "OptionBtn"}>
            <FontAwesomeIcon icon={faUser} /> پروفایل
          </button>
          <button onClick={() => setPage("OutUser")} className={page === "OutUser" ? "sideBar-active" : "OptionBtn"}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} /> خروج از حساب کاربری
          </button>
        </div>
      </div>

      <div id="ProContainer" className="ProContainer">
        {page === "OutUser" && (<>
          <h2 className="OutUserTitle">از حساب کاربری خارج می‌شوید؟</h2>
          <h3 className="OutUseDeatelse">با خروج از حساب کاربری، به سبد خرید فعلی‌تان دسترسی نخواهید داشت. هروقت بخواهید می‌توانید مجددا وارد شوید و خریدتان را ادامه دهید.</h3>
          <h6 className="LineOrder"></h6>
          <button className="OutUserBtn" onClick={handleLogout}>خروج از حساب کاربری</button>
        </>
        )}
        {page === "Orders" && (
          <>
            {selectedOrder ? (
              <InvoiceView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
            ) : (
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
                      <div key={order.id} className="OrderCard">
                        <div className="OrderCardHead">
                          <strong>کد پیگیری: {order.id}</strong>
                          <span className="OrderCardDate">{order.date || ""}</span>
                        </div>
                        <div className="OrderCardRows">
                          <span>تعداد اقلام: {toPersianDigits(order.items || 0)}</span>
                          <span>مبلغ: {toPersianDigits(formatPrice(order.total))} تومان</span>
                          <span className={order.status === "لغو شده" ? "OrderBadgeBad" : "OrderBadge"}>{order.status}</span>
                        </div>
                        <span className="OrderCardPayment">پرداخت: {order.payment || "—"}</span>
                        <button type="button" className="OrderCardDetails" onClick={() => setSelectedOrder(order)}>
                          <FontAwesomeIcon icon={faReceipt} /> مشاهده فاکتور
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message={currentOrderConfig?.emptyMessage} />
                )}
              </>
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
                  <div key={item.id} className="InterestedCard">
                    <Link to={`/Product/${item.id}`} className="InterestedCardImg">
                      <SafeImg src={item.image} alt={item.title} width="80" height="80" />
                    </Link>
                    <div className="InterestedCardInfo">
                      <Link to={`/Product/${item.id}`} className="InterestedCardTitle">{item.title}</Link>
                      <span className="InterestedCardPrice">{toPersianDigits(formatPrice(item.price))} تومان</span>
                    </div>
                    <button className="InterestedCardRemove" onClick={() => handleRemoveFavorite(item.id)} aria-label="حذف از علاقه‌مندی‌ها">
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="هنوز هیچ محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید" />
            )}
          </>
        )}

        {page === "Messages" && (
          <>
            <div className="ProfileMsgHead">
              <h2 className="TitleOptions"><FontAwesomeIcon icon={faBell} /> پیام‌ها</h2>
              {!allMessagesRead && messages.length > 0 && (
                <button type="button" className="ProfileMsgMarkAll" onClick={markAllMessages}>
                  <FontAwesomeIcon icon={faCheckDouble} /> علامت‌گذاری همه
                </button>
              )}
            </div>
            <h6 className="LineOrder"></h6>
            {messages.length > 0 ? (
              <div className="MessagesList">
                {messages.map(msg => (
                  <button
                    key={msg.id}
                    type="button"
                    className={`MessageCard${msg.is_read ? " is-read" : ""}`}
                    onClick={() => openMessage(msg)}
                  >
                    <span className="MessageCardDot"></span>
                    <span className="MessageCardContent">
                      <span className="MessageCardText">{msg.text}</span>
                      <span className="MessageCardDate">{formatJalali(msg.created_at)}</span>
                    </span>
                  </button>
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
                  <div key={addr.id} className={`AddressCard ${addr.is_default ? "AddressCardDefault" : ""}`}>
                    <div className="AddressCardInfo">
                      <strong>{addr.title}</strong>
                      {addr.is_default && <span className="AddressBadge">آدرس پیش‌فرض</span>}
                      <p>{addr.address}</p>
                      {addr.postal_code && <span className="AddressPostal">{addr.postal_code}</span>}
                    </div>
                    <div className="AddressCardActions">
                      {!addr.is_default && (
                        <button onClick={() => handleDefaultAddress(addr.id)}>انتخاب پیش‌فرض</button>
                      )}
                      <button className="AddressCardDelete" onClick={() => handleDeleteAddress(addr.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="هنوز آدرسی ثبت نکرده‌اید" />
            )}

            {showAddAddress ? (
              <form onSubmit={handleSubmitAddress} className="AddressForm">
                <input
                  placeholder="عنوان آدرس (مثلاً خانه)"
                  value={newAddress.title}
                  onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                />
                <input
                  placeholder="متن آدرس"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                />
                <input
                  placeholder="کد پستی (اختیاری)"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                />
                {errorMessage && <div className="form-error-msg">{errorMessage}</div>}
                <div className="AddressFormBtns">
                  <button type="submit" className="SubmitProfileBtn">ذخیره آدرس</button>
                  <button type="button" className="OutUserBtn" onClick={() => setShowAddAddress(false)}>انصراف</button>
                </div>
              </form>
            ) : (
              <div className="AddAddresContaner">
                <h3 onClick={() => setShowAddAddress(true)}> <FontAwesomeIcon icon={faPlus} /> افزودن آدرس جدید </h3>
              </div>
            )}
          </>
        )}

        {page === "Profile" && (
          <>
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

              {errorMessage && <div className="form-error-msg">{errorMessage}</div>}
              {successMessage && <div className="form-success-msg">{successMessage}</div>}

              <div className="SubmitBtnContainer">
                <button type="submit" className="SubmitProfileBtn">ثبت تغییرات</button>
              </div>
            </form>
            <button onClick={() => navigate("/AdminPannel")} className="AdmiPannelPro">  <FontAwesomeIcon icon={faUserTie} />پنل ادمین </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Profile