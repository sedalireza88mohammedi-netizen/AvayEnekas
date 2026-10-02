
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings,
  Search, Plus, Pencil, Trash2, X, ChevronDown, TrendingUp,
  DollarSign, ShoppingBag, AlertTriangle, Radio, Volume2,
  ArrowUpRight, ArrowDownRight, Phone, Mail, Calendar, Package2,
  CheckCircle2, Clock, XCircle, Truck, Menu, Bell, ImagePlus, Video,
  RefreshCw, FileText, MessageSquareText, Send,
  Star, Images, PlusCircle, MinusCircle, FolderOpen, MessagesSquare,
  Layers, Check, Link2, SlidersHorizontal, Eye, EyeOff,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import "./AdminPannel.css";
import { getAccessToken, isLoggedIn } from "../../auth";
import {
  CATEGORY_LIST,
  fetchProducts, createProduct, updateProduct, deleteProduct, updateProductSelection,
  fetchOrders, updateOrderStatus,
  fetchCustomers, setCustomerBlocked, deleteCustomer,
  fetchPopularSearchesAdmin, createPopularSearch, updatePopularSearch, deletePopularSearch,
  fetchArticles, createArticle, updateArticle, deleteArticle,
  fetchAdminMessages, sendAdminMessage, deleteAdminMessage,
  fetchHomeSliders, createHomeSlider, updateHomeSlider, deleteHomeSlider,
  fetchCategorySlides, createCategorySlide, updateCategorySlide, deleteCategorySlide,
  fetchSectionSliders, createSectionSliderItem, updateSectionSliderItem, deleteSectionSlider,
  fetchAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  fetchAllReviews, deleteReview,
  faError,
} from "../AdminPannel/Api.jsx";

/**
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
function cx() {
  var classes = [];
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i]) classes.push(arguments[i]);
  }
  return classes.join(" ");
}

/* ============================== CONSTANTS ============================== */

const PIE_COLORS = ["#16181B", "#3F4247", "#6B7280", "#9CA3AF", "#C9CBCF", "#EDEEF0"];
const CHART_INK = "#24262A";
const ORDER_STATUSES = ["در انتظار پردازش", "در حال ارسال", "تحویل شده", "لغو شده"];

/* ============================== HELPERS ============================== */

const toman = (n) => n.toLocaleString("fa-IR") + " تومان";
const num = (n) => n.toLocaleString("fa-IR");
const sortPopularSearches = (list) =>
  [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);

const statusClass = (status) => {
  switch (status) {
    case "فعال": case "تحویل شده": case "پرداخت شده": case "منتشر شده": case "خوانده شده": return "badge badge--success";
    case "در حال ارسال": case "جدید": return "badge badge--warning";
    case "در انتظار پردازش": case "در انتظار": case "پیش‌نویس": return "badge badge--neutral";
    case "لغو شده": case "ناموجود": case "بازگشت وجه": return "badge badge--danger";
    default: return "badge badge--neutral";
  }
};

const statusIcon = (status) => {
  switch (status) {
    case "تحویل شده": return <CheckCircle2 size={13} />;
    case "در حال ارسال": return <Truck size={13} />;
    case "در انتظار پردازش": return <Clock size={13} />;
    case "لغو شده": return <XCircle size={13} />;
    default: return null;
  }
};

/* ============================== NAV CONFIG ============================== */

const NAV = [
  { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { key: "products", label: "محصولات", icon: Package },
  { key: "special", label: "شگفت‌انگیزها و محبوب‌ها", icon: Star },
  { key: "sliders", label: "اسلایدرهای صفحه اصلی", icon: Images },
  { key: "events", label: "رویدادهای ویژه (بخش‌های منو)", icon: Star },
  { key: "categorySlides", label: "اسلایدر دسته‌بندی‌ها", icon: FolderOpen },
  { key: "categories", label: "دسته‌بندی‌ها", icon: FolderOpen },
  { key: "orders", label: "سفارش‌ها", icon: ShoppingCart },
  { key: "customers", label: "مشتریان", icon: Users },
  { key: "reviews", label: "دیدگاه‌ها", icon: MessagesSquare },
  { key: "popularSearches", label: "جستجوهای پرطرفدار", icon: TrendingUp },
  { key: "messages", label: "پیامک", icon: MessageSquareText },
  { key: "articles", label: "مقالات", icon: FileText },
  { key: "reports", label: "گزارش فروش", icon: BarChart3 },
  { key: "settings", label: "تنظیمات", icon: Settings },
];

/* ============================== SHARED UI ============================== */

function MeterBar({ level = 60 }) {
  var safeLevel = Math.max(0, Math.min(100, level));
  return (
    <div className="meter" role="presentation">
      <div className="meter-bar" style={{ width: safeLevel + "%" }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, positive, level, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx("stat-card", onClick && "stat-card--clickable")}
    >
      <div className="stat-card-top">
        <div className="stat-icon"><Icon size={18} /></div>
        {delta && (
          <span className={cx("stat-delta", positive ? "is-positive" : "is-negative")}>
            {positive ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownRight size={12} aria-hidden="true" />}
            {delta}
          </span>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value mono">{value}</p>
      <MeterBar level={level} />
    </Comp>
  );
}

function Badge({ status }) {
  return (
    <span className={statusClass(status)}>
      {statusIcon(status)}
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="بستن پنجره">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function FullScreenState({ kind, message, onRetry }) {
  return (
    <div className="full-screen-state">
      {kind === "loading" ? (
        <>
          <div className="spinner" role="status" aria-label="در حال بارگذاری" />
          <p className="bold">در حال بارگذاری اطلاعات پنل...</p>
        </>
      ) : (
        <>
          <AlertTriangle size={30} />
          <p className="bold">خطا در دریافت اطلاعات از سرور</p>
          <p>{message}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-primary">
              <RefreshCw size={15} aria-hidden="true" /> تلاش مجدد
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ products, categories, reviews, messages, orders, onGoProducts, onGoOrders }) {
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.threshold).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const selectedCount = products.filter((p) =>
    p.Empressive || p.is_popular || p.is_trending || p.is_best_seller,
  ).length;
  const pendingOrders = (orders || []).filter((o) => o.status === "در انتظار پردازش").length;
  const salesTotal = (orders || []).reduce((s, o) => s + (o.total || 0), 0);

  const stockBadge = (p) => {
    const cls = p.stock === 0 ? "badge--danger" : p.stock <= p.threshold ? "badge--warning" : "badge--success";
    const label = p.stock === 0 ? "ناموجود" : p.stock <= p.threshold ? "کم‌موجودی" : "در دسترس";
    return <span className={cx("badge", cls)}>{label}</span>;
  };

  return (
    <div className="stack">
      <div className="stats-grid">
        <StatCard icon={Package} label="تعداد محصولات" value={num(products.length)} delta={`${num(selectedCount)} ویژه/محبوب`} level={86} onClick={onGoProducts} />
        <StatCard icon={FolderOpen} label="دسته‌بندی‌ها" value={num(categories.length)} delta="دسته فعال" level={64} />
        <StatCard icon={MessagesSquare} label="دیدگاه‌ها" value={num(reviews.length)} delta="نظر ثبت‌شده" level={52} />
        <StatCard icon={MessageSquareText} label="پیام‌های صندوق" value={num(messages.length)} delta="پیام کاربران" level={40} />
        <StatCard icon={ShoppingCart} label="سفارش‌ها" value={num((orders || []).length)} delta={`${num(pendingOrders)} در انتظار پردازش`} level={70} onClick={() => onGoOrders && onGoOrders("همه")} />
        <StatCard icon={DollarSign} label="مجموع فروش" value={toman(salesTotal)} delta="از سفارش‌های ثبت‌شده" level={58} onClick={() => onGoOrders && onGoOrders("همه")} />
        <StatCard icon={Package2} label="کم‌موجودی" value={num(lowStock)} delta="اقلام رو به اتمام" positive={false} level={28} onClick={onGoProducts} />
        <StatCard icon={XCircle} label="ناموجود" value={num(outOfStock)} delta="اقلام بدون موجودی" positive={false} level={12} onClick={onGoProducts} />
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>وضعیت کاتالوگ</h2></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>محصول</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td className="bold">{p.name}</td>
                  <td className="muted small">{p.category}</td>
                  <td className="mono bold">{toman(p.price)}</td>
                  <td className="mono">{p.stock}</td>
                  <td>{stockBadge(p)}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">محصولی ثبت نشده است</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== PRODUCTS ============================== */

const EMPTY_FORM = { name: "", category: CATEGORY_LIST[0], sku: "", price: "", discountPercent: "", stock: "", threshold: "5", rating: "5", description: "", images: [], video: null };

function Products({ products, onCreate, onUpdate, onDelete, onQuickRating }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = p.name.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "همه" || p.category === category;
    return matchSearch && matchCat;
  }), [products, search, category]);

  const openAdd = () => { setForm(EMPTY_FORM); setFormError(""); setModal({ mode: "add" }); };
  const openEdit = (p) => {
    const discountPercent =
      p.oldPrice && Number(p.oldPrice) > 0 && Number(p.price) > 0 && Number(p.oldPrice) > Number(p.price)
        ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100)
        : "";
    setForm({
      name: p.name, category: p.category, sku: p.sku, price: p.price, discountPercent,
      stock: p.stock, threshold: p.threshold,
      rating: p.rating != null ? p.rating : "5",
      description: p.description || "",
      images: (p.images || []).map((img) => ({ ...img })),
      video: p.video ? { ...p.video } : null,
    });
    setFormError("");
    setModal({ mode: "edit", product: p });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newImages = files.map((file) => ({ id: file.name + "-" + file.size + "-" + Date.now(), url: URL.createObjectURL(file), name: file.name, file }));
    setForm((f) => ({ ...f, images: [...f.images, ...newImages] }));
    e.target.value = "";
  };

  const removeImage = (id) => setForm((f) => ({ ...f, images: f.images.filter((img) => img.id !== id) }));

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, video: { url: URL.createObjectURL(file), name: file.name, file } }));
    e.target.value = "";
  };

const removeVideo = () => setForm((f) => ({ ...f, video: null }));

  const submit = async () => {
    if (!form.name || !form.sku || !form.price) return;
    setSubmitting(true);
    setFormError("");
    const payload = {
      name: form.name,
      category: form.category,
      sku: form.sku,
      price: form.price,
      discountPercent: form.discountPercent,
      stock: form.stock,
      threshold: form.threshold,
      rating: form.rating,
      description: form.description,
      imageFiles: form.images.filter((img) => img.file).map((img) => img.file),
      keepImageUrls: form.images.filter((img) => !img.file).map((img) => img.url),
      videoFile: form.video && form.video.file ? form.video.file : null,
      keepVideoUrl: form.video && !form.video.file ? form.video.url : null,
    };
    try {
      if (modal.mode === "add") {
        await onCreate(payload);
      } else {
        await onUpdate(modal.product.id, payload);
      }
      setModal(null);
    } catch (err) {
      setFormError(faError(err, "ذخیره‌سازی با خطا مواجه شد"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      setFormError(faError(err, "حذف با خطا مواجه شد"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbar-filters">
          <div className="search-box">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول یا کد..." />
          </div>
          <div className="select-box">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>همه</option>
              {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
        <button type="button" onClick={openAdd} className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> افزودن محصول
        </button>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>تصویر</th><th>محصول</th><th>دسته‌بندی</th><th>کد کالا</th><th>قیمت</th><th>موجودی</th><th>امتیاز</th><th>وضعیت</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0].url} alt="" className="table-thumb" />
                    ) : (
                      <div className="table-thumb table-thumb--empty"><Package size={14} /></div>
                    )}
                  </td>
                  <td className="bold cell-wide">{p.name}</td>
                  <td className="muted">{p.category}</td>
                  <td className="mono muted">{p.sku}</td>
                  <td className="mono bold">{toman(p.price)}</td>
                  <td>
                    <span
                      className={cx(
                        "mono",
                        p.stock === 0 && "text-danger",
                        p.stock > 0 && p.stock <= p.threshold && "text-warning"
                      )}
                    >
                      {num(p.stock)}
                    </span>
                  </td>
                  <td>
                    <div className="rating-stepper rating-stepper--mini">
                      <button type="button" onClick={() => onQuickRating(p, -0.5)} aria-label={"کاهش امتیاز " + p.name}>
                        <MinusCircle size={14} aria-hidden="true" />
                      </button>
                      <span className="mono bold">{Number(p.rating).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}</span>
                      <button type="button" onClick={() => onQuickRating(p, +0.5)} aria-label={"افزایش امتیاز " + p.name}>
                        <PlusCircle size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => openEdit(p)} className="icon-btn" aria-label={"ویرایش " + p.name}>
                        <Pencil size={14} aria-hidden="true" />
                      </button>


<button type="button" onClick={() => setDeleteId(p.id)} className="icon-btn icon-btn--danger" aria-label={"حذف " + p.name}>
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="empty-row">محصولی با این مشخصات پیدا نشد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "افزودن محصول جدید" : "ویرایش محصول"} onClose={() => !submitting && setModal(null)}>
          {formError && <div className="inline-error"><span>{formError}</span></div>}

          <Field label="نام محصول">
            <input disabled={submitting} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً اسپیکر مانیتورینگ استودیویی" />
          </Field>
          <div className="field-grid">
            <Field label="دسته‌بندی">
              <select disabled={submitting} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="کد کالا (SKU)">
              <input disabled={submitting} className="mono" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SPK-1010" />
            </Field>
          </div>
          <div className="field-grid">
            <Field label="قیمت (تومان)">
              <input disabled={submitting} type="number" className="mono" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="درصد تخفیف (اختیاری)">
              <input disabled={submitting} type="number" min="0" max="99" className="mono" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="۰ تا ۹۹" />
            </Field>
          </div>
          {(() => {
            const pct = Math.max(0, Math.min(99, Number(form.discountPercent) || 0));
            const priceNow = Number(form.price) || 0;
            if (pct > 0 && priceNow > 0) {
              const original = Math.round(priceNow / (1 - pct / 100));
              const saved = original - priceNow;
              return (
                <div className="discount-preview">
                  <span>قیمت اصلی: <b>{toman(original)}</b></span>
                  <span>هزینه تخفیف: <b className="text-danger">{toman(saved)}</b></span>
                </div>
              );
            }
            return null;
          })()}
          <div className="field-grid">
            <Field label="موجودی">
              <input disabled={submitting} type="number" className="mono" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
            <Field label="حد هشدار موجودی کم">
              <input disabled={submitting} type="number" className="mono" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
            </Field>
          </div>

          <Field label="امتیاز محصول (۰ تا ۵)">
            <div className="rating-stepper">
              <button type="button" disabled={submitting} onClick={() => setForm((f) => ({ ...f, rating: Math.max(0, (Number(f.rating) || 0) - 0.5) }))} aria-label="کاهش امتیاز">
                <MinusCircle size={16} aria-hidden="true" />
              </button>
              <span className="rating-stepper-value mono">
                {Number(form.rating || 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}
              </span>
              <button type="button" disabled={submitting} onClick={() => setForm((f) => ({ ...f, rating: Math.min(5, (Number(f.rating) || 0) + 0.5) }))} aria-label="افزایش امتیاز">
                <PlusCircle size={16} aria-hidden="true" />
              </button>
            </div>
          </Field>

          <Field label="توضیحات محصول">
            <textarea
              rows={6}
              disabled={submitting}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="مشخصات فنی، ویژگی‌ها و توضیح کامل محصول..."
            />
            <p className="muted small" style={{ textAlign: "left", marginTop: 4 }}>{num(form.description.length)} کاراکتر</p>
          </Field>

          <Field label={"تصاویر محصول" + (form.images.length ? " (" + num(form.images.length) + ")" : "")}>
            <label className="upload-box">
              <ImagePlus size={17} aria-hidden="true" />
              <span>افزودن عکس — انتخاب چند فایل هم‌زمان مجاز است</span>
              <input type="file" accept="image/*" multiple disabled={submitting} onChange={handleImageUpload} hidden />
            </label>
            {form.images.length > 0 && (
              <div className="image-grid">
                {form.images.map((img) => (
                  <div key={img.id} className="image-thumb">
                    <img src={img.url} alt="" />
                    <button type="button" onClick={() => removeImage(img.id)} className="image-thumb-remove" aria-label="حذف تصویر">
                      <X size={12} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label="ویدئوی معرفی محصول">
            {!form.video ? (
              <label className="upload-box">
                <Video size={17} aria-hidden="true" />
                <span>افزودن ویدئوی توضیحات محصول</span>
                <input type="file" accept="video/*" disabled={submitting} onChange={handleVideoUpload} hidden />
              </label>
            ) : (
              <div className="video-preview">
                <video src={form.video.url} controls />
                <div className="video-preview-footer">
                  <span className="mono small muted">{form.video.name}</span>
                  <button type="button" onClick={removeVideo} disabled={submitting} className="link-btn">حذف ویدئو</button>
                </div>
              </div>
            )}
          </Field>

<div className="modal-actions">
            <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary btn-block">
              {submitting ? "در حال ذخیره..." : modal.mode === "add" ? "افزودن محصول" : "ذخیره تغییرات"}
            </button>
            <button type="button" onClick={() => setModal(null)} disabled={submitting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="حذف محصول" onClose={() => !deleting && setDeleteId(null)}>
          {formError && <div className="inline-error"><span>{formError}</span></div>}
          <p className="muted" style={{ marginBottom: 24 }}>آیا از حذف این محصول مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p>
          <div className="modal-actions">
            <button type="button" onClick={confirmDelete} disabled={deleting} className="btn btn-danger btn-block">
              {deleting ? "در حال حذف..." : "حذف محصول"}
            </button>
            <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== HOME SLIDERS ============================== */

const EMPTY_SLIDER = { title: "", link: "", active: true, imageFile: null, imagePreview: null };

function HomeSliders({ sliders, onCreate, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SLIDER);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleId, setToggleId] = useState(null);

  const openAdd = () => { setForm({ ...EMPTY_SLIDER }); setFormError(""); setModal({ mode: "add" }); };
  const openEdit = (s) => {
    setForm({ title: s.title, link: s.link || "", active: s.active, imageFile: null, imagePreview: null });
    setFormError("");
    setModal({ mode: "edit", slider: s });
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
    e.target.value = "";
  };

  const submit = async () => {
    if (modal.mode === "add" && !form.imageFile) { setFormError("انتخاب عکس اسلایدر الزامی است"); return; }
    setSubmitting(true);
    setFormError("");
    const payload = { title: form.title, link: form.link, active: form.active, imageFile: form.imageFile };
    try {
      if (modal.mode === "add") await onCreate(payload);
      else await onUpdate(modal.slider.id, payload);
      setModal(null);
    } catch (err) {
      setFormError(faError(err, "ذخیره اسلایدر با خطا مواجه شد"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (s) => {
    setToggleId(s.id);
    try {
      await onUpdate(s.id, { title: s.title, link: s.link || "", active: !s.active });
    } catch (err) {
      setFormError(faError(err, "بروزرسانی اسلایدر با خطا مواجه شد"));
    } finally {
      setToggleId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      setFormError(faError(err, "حذف اسلایدر با خطا مواجه شد"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <p className="toolbar-hint">این اسلایدرها در ابتدای صفحه اصلی نمایش داده می‌شوند.</p>
        <button type="button" onClick={openAdd} className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> افزودن اسلایدر
        </button>
      </div>

      {formError && <div className="inline-error"><span>{formError}</span></div>}

      {sliders.length === 0 ? (
        <div className="card empty-panel">
          <Images size={40} className="muted" />
          <p className="muted">هنوز اسلایدی اضافه نشده است. با دکمه «افزودن اسلایدر» شروع کنید.</p>
        </div>
      ) : (
        <div className="slider-grid">
          {sliders.map((s) => (
            <div key={s.id} className={cx("slider-card", !s.active && "is-inactive")}>
              <div className="slider-card-image">
                {s.image ? <img src={s.image} alt={s.title} /> : <Images size={28} className="muted" />}
                {!s.active && <span className="slider-card-hidden">نامرئی</span>}
              </div>
              <div className="slider-card-body">
                <p className="bold small">{s.title || "بدون عنوان"}</p>
                {s.link && <p className="muted small slider-card-link" title={s.link}>{s.link}</p>}
                <div className="slider-card-actions">
                  <button type="button" onClick={() => toggleActive(s)} disabled={toggleId === s.id} className={cx("switch", s.active && "is-on")} aria-label={s.active ? "غیرفعال کردن اسلایدر" : "فعال کردن اسلایدر"} role="switch" aria-checked={s.active}>
                    <span className="switch-knob" />
                  </button>
                  <button type="button" onClick={() => openEdit(s)} className="icon-btn" aria-label="ویرایش اسلایدر">
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setDeleteId(s.id)} className="icon-btn icon-btn--danger" aria-label="حذف اسلایدر">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "افزودن اسلایدر جدید" : "ویرایش اسلایدر"} onClose={() => !submitting && setModal(null)}>
          {formError && <div className="inline-error"><span>{formError}</span></div>}
          <Field label="عنوان اسلایدر">
            <input disabled={submitting} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً فروشگاه تخصصی آوای انعکاس" />
          </Field>
          <Field label="لینک (اختیاری)">
            <input disabled={submitting} dir="ltr" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/Catagoryes?category=اسپیکر" />
          </Field>
          <Field label="عکس اسلایدر">
            {form.imagePreview ? (
              <div className="slider-upload-preview">
                <img src={form.imagePreview} alt="" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageFile: null, imagePreview: null }))} className="icon-btn icon-btn--danger" aria-label="حذف عکس جدید">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="upload-box">
                <ImagePlus size={17} aria-hidden="true" />
                <span>{modal.mode === "add" ? "انتخاب عکس اسلایدر" : "جایگزینی عکس فعلی (اختیاری)"}</span>
                <input type="file" accept="image/*" disabled={submitting} onChange={handleImage} hidden />
              </label>
            )}
          </Field>
          <Field label="نمایش در صفحه اصلی">
            <label className="check-line">
              <input type="checkbox" disabled={submitting} checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span>{form.active ? "فعال" : "غیرفعال"}</span>
            </label>
          </Field>
          <div className="modal-actions">
            <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary btn-block">
              {submitting ? "در حال ذخیره..." : modal.mode === "add" ? "افزودن اسلایدر" : "ذخیره تغییرات"}
            </button>
            <button type="button" onClick={() => setModal(null)} disabled={submitting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="حذف اسلایدر" onClose={() => !deleting && setDeleteId(null)}>
          <p className="muted" style={{ marginBottom: 24 }}>آیا از حذف این اسلایدر مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p>
          <div className="modal-actions">
            <button type="button" onClick={confirmDelete} disabled={deleting} className="btn btn-danger btn-block">
              {deleting ? "در حال حذف..." : "حذف اسلایدر"}
            </button>
            <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== CATEGORY SLIDES ============================== */

const EMPTY_CAT_SLIDE = {
  title: "", category: "", link: "", order: 0, active: true,
  imageFile: null, imagePreview: null,
};

function CategorySlides({ slides, onCreate, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_CAT_SLIDE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleId, setToggleId] = useState(null);

  const openAdd = () => { setForm({ ...EMPTY_CAT_SLIDE }); setFormError(""); setModal({ mode: "add" }); };
  const openEdit = (s) => {
    setForm({
      title: s.title || "", category: s.category || "", link: s.link || "",
      order: s.order || 0, active: s.active, imageFile: null, imagePreview: null,
    });
    setFormError("");
    setModal({ mode: "edit", slide: s });
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, imageFile: file, imagePreview: URL.createObjectURL(file) }));
    e.target.value = "";
  };

  const submit = async () => {
    if (!form.title.trim()) { setFormError("عنوان اسلایدر دسته‌بندی را وارد کنید"); return; }
    setSubmitting(true);
    setFormError("");
    const payload = {
      title: form.title.trim(),
      category: form.category,
      link: form.link,
      order: form.order,
      active: form.active,
      imageFile: form.imageFile,
    };
    try {
      if (modal.mode === "add") await onCreate(payload);
      else await onUpdate(modal.slide.id, payload);
      setModal(null);
    } catch (err) {
      setFormError(faError(err, "ذخیره اسلایدر دسته‌بندی با خطا مواجه شد"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (s) => {
    setToggleId(s.id);
    try {
      await onUpdate(s.id, {
        title: s.title, category: s.category || "", link: s.link || "",
        order: s.order || 0, active: !s.active,
      });
    } catch (err) {
      setFormError(faError(err, "بروزرسانی اسلایدر با خطا مواجه شد"));
    } finally {
      setToggleId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      setFormError(faError(err, "حذف اسلایدر با خطا مواجه شد"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <p className="toolbar-hint">
          این کاشی‌ها جای اسلایدر خودکار دسته‌بندی‌ها در صفحه اصلی را می‌گیرند. اگر هیچ‌کدام فعال نباشند،
          دسته‌بندی‌ها به‌صورت خودکار از روی محصولات ویژه ساخته می‌شوند.
        </p>
        <button type="button" onClick={openAdd} className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> افزودن اسلایدر دسته‌بندی
        </button>
      </div>

      {formError && <div className="inline-error"><span>{formError}</span></div>}

      {slides.length === 0 ? (
        <div className="card empty-panel">
          <FolderOpen size={40} className="muted" />
          <p className="muted">هنوز اسلایدر دسته‌بندی‌ای اضافه نشده است. در حال حاضر دسته‌بندی‌ها به‌صورت خودکار نمایش داده می‌شوند.</p>
        </div>
      ) : (
        <div className="slider-grid">
          {slides.map((s) => (
            <div key={s.id} className={cx("slider-card", !s.active && "is-inactive")}>
              <div className="slider-card-image">
                {s.image ? <img src={s.image} alt={s.title} /> : <FolderOpen size={28} className="muted" />}
                {!s.active && <span className="slider-card-hidden">نامرئی</span>}
              </div>
              <div className="slider-card-body">
                <p className="bold small">{s.title || "بدون عنوان"}</p>
                {s.category && <p className="muted small">دسته: {s.category}</p>}
                {s.link && <p className="muted small slider-card-link" title={s.link}>{s.link}</p>}
                <div className="slider-card-actions">
                  <button type="button" onClick={() => toggleActive(s)} disabled={toggleId === s.id} className={cx("switch", s.active && "is-on")} aria-label={s.active ? "غیرفعال کردن" : "فعال کردن"} role="switch" aria-checked={s.active}>
                    <span className="switch-knob" />
                  </button>
                  <button type="button" onClick={() => openEdit(s)} className="icon-btn" aria-label="ویرایش اسلایدر دسته‌بندی">
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setDeleteId(s.id)} className="icon-btn icon-btn--danger" aria-label="حذف اسلایدر دسته‌بندی">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "افزودن اسلایدر دسته‌بندی" : "ویرایش اسلایدر دسته‌بندی"} onClose={() => !submitting && setModal(null)}>
          {formError && <div className="inline-error"><span>{formError}</span></div>}
          <Field label="عنوان (روی کاشی نمایش داده می‌شود)">
            <input disabled={submitting} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً اسپیکر و باند" />
          </Field>
          <div className="field-grid">
            <Field label="دسته‌بندی (اختیاری)">
              <input disabled={submitting} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مثلاً اسپیکر" />
            </Field>
            <Field label="ترتیب نمایش">
              <input disabled={submitting} className="mono" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label="لینک مقصد (اختیاری)">
            <input disabled={submitting} dir="ltr" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/AllProductList?search=اسپیکر" />
          </Field>
          <Field label="تصویر کاشی (اختیاری)">
            {form.imagePreview ? (
              <div className="slider-upload-preview">
                <img src={form.imagePreview} alt="" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageFile: null, imagePreview: null }))} className="icon-btn icon-btn--danger" aria-label="حذف عکس جدید">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="upload-box">
                <ImagePlus size={17} aria-hidden="true" />
                <span>{modal.mode === "add" ? "انتخاب تصویر" : "جایگزینی تصویر فعلی (اختیاری)"}</span>
                <input type="file" accept="image/*" disabled={submitting} onChange={handleImage} hidden />
              </label>
            )}
          </Field>
          <Field label="نمایش در صفحه اصلی">
            <label className="check-line">
              <input type="checkbox" disabled={submitting} checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span>{form.active ? "فعال" : "غیرفعال"}</span>
            </label>
          </Field>
          <div className="modal-actions">
            <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary btn-block">
              {submitting ? "در حال ذخیره..." : modal.mode === "add" ? "افزودن" : "ذخیره تغییرات"}
            </button>
            <button type="button" onClick={() => setModal(null)} disabled={submitting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="حذف اسلایدر دسته‌بندی" onClose={() => !deleting && setDeleteId(null)}>
          <p className="muted" style={{ marginBottom: 24 }}>آیا از حذف این اسلایدر مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p>
          <div className="modal-actions">
            <button type="button" onClick={confirmDelete} disabled={deleting} className="btn btn-danger btn-block">
              {deleting ? "در حال حذف..." : "حذف اسلایدر"}
            </button>
            <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== ORDERS ============================== */

function Orders({ orders, onUpdateStatus, initialStatusFilter }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || "همه");
  const [detail, setDetail] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.includes(search);
    const matchStatus = statusFilter === "همه" || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    setUpdatingStatus(true);
    setError("");
    try {
      await onUpdateStatus(id, status);
      setDetail((d) => (d && d.id === id ? { ...d, status } : d));
    } catch (err) {
      setError(err.message || "بروزرسانی وضعیت با خطا مواجه شد");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbar-filters">
          <div className="search-box">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی شماره سفارش یا مشتری..." />
          </div>
          <div className="select-box">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>همه</option>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>شماره سفارش</th><th>مشتری</th><th>تاریخ</th><th>تعداد اقلام</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="mono bold">{o.id}</td>
                  <td>{o.customer}</td>
                  <td className="mono muted">{o.date}</td>
                  <td className="mono muted">{num(o.items)}</td>
                  <td className="mono bold">{toman(o.total)}</td>
                  <td><Badge status={o.payment} /></td>
                  <td><Badge status={o.status} /></td>


<td>
                    <button type="button" onClick={() => setDetail(o)} className="link-btn" aria-label={"مشاهده جزئیات سفارش " + o.id}>
                      مشاهده
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="empty-row">سفارشی پیدا نشد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Modal title={"جزئیات سفارش " + detail.id} onClose={() => setDetail(null)}>
          {error && <div className="inline-error"><span>{error}</span></div>}
          <div className="detail-list">
            <div className="detail-row"><span className="muted">مشتری</span><span className="bold">{detail.customer}</span></div>
            <div className="detail-row"><span className="muted">تاریخ ثبت</span><span className="mono">{detail.date}</span></div>
            <div className="detail-row"><span className="muted">تعداد اقلام</span><span className="mono">{num(detail.items)}</span></div>
            <div className="detail-row"><span className="muted">مبلغ کل</span><span className="mono bold">{toman(detail.total)}</span></div>
            <div className="detail-row"><span className="muted">وضعیت پرداخت</span><Badge status={detail.payment} /></div>
          </div>
          <Field label="بروزرسانی وضعیت سفارش">
            <div className="status-grid">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(detail.id, s)}
                  className={cx("status-btn", detail.status === s && "is-active")}
                  aria-pressed={detail.status === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </Modal>
      )}
    </div>
  );
}

/* ============================== CUSTOMERS ============================== */
/* مدیریت مشتریان: مسدود/رفع مسدود و حذف حساب.                            */
/* حذف، فقط حساب و داده‌های شخصی را پاک می‌کند و سوابق سفارش حفظ می‌شود.  */

function Customers({ customers, onBlockToggle, onDelete }) {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return customers;
    return customers.filter(
      (c) => (c.name || "").includes(q) || (c.phone || "").includes(q),
    );
  }, [customers, search]);

  const act = async (id, fn) => {
    setBusyId(id);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(faError(e, "عملیات انجام نشد؛ دوباره تلاش کنید"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const target = removeTarget;
    setRemoveTarget(null);
    if (!target) return;
    setDetail((d) => (d && d.id === target.id ? null : d));
    await act(target.id, () => onDelete(target));
  };

  return (
    <div className="stack">
      <div className="search-box search-box--standalone">
        <Search size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی مشتری..." />
      </div>

      {error && <p className="form-error">{error}</p>}
      {customers.length === 0 && (
        <p className="empty-row">
          هنوز مشتری واقعی ثبت نشده است؛ هر حساب که با ورود شماره ساخته شود اینجا دیده می‌شود.
        </p>
      )}

      <div className="customers-grid">
        {filtered.map((c) => {
          const busy = busyId === c.id;
          return (
            <div key={c.id} className={cx("card", "customer-card", c.is_blocked && "is-blocked")}>
              <button
                type="button"
                onClick={() => setDetail(c)}
                className="customer-card-main"
                aria-label={"مشاهده پروفایل " + c.name}
              >
                <div className="customer-card-top">
                  <div className="customer-avatar">{c.name.slice(0, 1)}</div>
                  <div className="customer-info">
                    <p className="bold">{c.name}</p>
                    <p className="mono muted small">{c.phone}</p>
                  </div>
                </div>
                <div className="customer-stats">
                  <div><p className="muted small">سفارش‌ها</p><p className="mono bold">{num(c.orders)}</p></div>
                  <div><p className="muted small">خرید کل</p><p className="mono bold small">{toman(c.spent)}</p></div>
                </div>
              </button>

              <div className="customer-card-actions">
                {c.is_blocked ? (
                  <span className="badge badge--danger">مسدود</span>
                ) : (
                  <span className="badge badge--success">فعال</span>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={busy}
                  onClick={() => act(c.id, () => onBlockToggle(c, !c.is_blocked))}
                >
                  {busy ? "..." : c.is_blocked ? "رفع مسدودی" : "مسدود کردن"}
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  disabled={busy}
                  onClick={() => setRemoveTarget(c)}
                >
                  <Trash2 size={14} /> حذف
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && customers.length > 0 && (
          <p className="empty-row" style={{ gridColumn: "1/-1" }}>مشتری‌ای پیدا نشد</p>
        )}
      </div>

      {removeTarget && (
        <Modal title="حذف مشتری" onClose={() => setRemoveTarget(null)}>
          <div className="stack">
            <p className="small">
              حساب <strong>{removeTarget.name}</strong> با شماره{" "}
              <span className="mono">{removeTarget.phone}</span> برای همیشه حذف می‌شود و امکان ورود او
              (دریافت کد تأیید) بسته می‌ماند.
            </p>
            <p className="muted small">
              سوابق سفارش حذف نمی‌شود و بدون حساب مشتری باقی می‌ماند. این عمل قابل بازگشت نیست.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setRemoveTarget(null)}>
                انصراف
              </button>
              <button type="button" className="btn btn--danger" onClick={confirmDelete}>
                حذف دائمی
              </button>
            </div>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title="پروفایل مشتری" onClose={() => setDetail(null)}>
          <div className="customer-profile-head">
            <div className="customer-avatar customer-avatar--lg">{detail.name.slice(0, 1)}</div>
            <div>
              <p className="bold">{detail.name}</p>
              <p className="mono muted small">مشتری از {detail.joined}</p>
            </div>
          </div>
          <div className="detail-list">
            <div className="detail-row"><span className="muted"><Phone size={14} /> شماره تماس</span><span className="mono">{detail.phone}</span></div>
            <div className="detail-row"><span className="muted"><Mail size={14} /> ایمیل</span><span className="mono small">{detail.email}</span></div>
            <div className="detail-row"><span className="muted"><Package2 size={14} /> تعداد سفارش</span><span className="mono bold">{num(detail.orders)}</span></div>
            <div className="detail-row"><span className="muted"><DollarSign size={14} /> مجموع خرید</span><span className="mono bold">{toman(detail.spent)}</span></div>
            <div className="detail-row">
              <span className="muted"><AlertTriangle size={14} /> وضعیت حساب</span>
              <span className={detail.is_blocked ? "badge badge--danger" : "badge badge--success"}>
                {detail.is_blocked ? "مسدود — ورود با OTP بسته است" : "فعال"}
              </span>
            </div>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busyId === detail.id}
              onClick={() =>
                act(detail.id, async () => {
                  await onBlockToggle(detail, !detail.is_blocked);
                  setDetail((d) => (d ? { ...d, is_blocked: !d.is_blocked } : d));
                })
              }
            >
              {detail.is_blocked ? "رفع مسدودی" : "مسدود کردن"}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => { setRemoveTarget(detail); setDetail(null); }}
            >
              <Trash2 size={14} /> حذف مشتری
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================== POPULAR SEARCHES (جستجوهای پرطرفدار) ================== */
/* ادمین خودش تعیین می‌کند چه عبارت‌هایی در جستجوی سایت پیشنهاد شوند.   */

function PopularSearches({ items, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState({ term: "", order: 0, active: true });
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const term = form.term.trim();
    if (!term) return;
    setBusy(true);
    setError("");
    try {
      if (editId) await onUpdate(editId, { term, order: form.order, active: form.active });
      else await onCreate({ term, order: form.order, active: form.active });
      setForm({ term: "", order: form.order + 1, active: true });
      setEditId(null);
    } catch (err) {
      setError(faError(err, "ثبت عبارت انجام نشد؛ دوباره تلاش کنید"));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setError("");
    setForm({ term: item.term, order: item.order, active: item.active });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ term: "", order: 0, active: true });
  };

  const toggleActive = async (item) => {
    setListError("");
    try {
      await onUpdate(item.id, { term: item.term, order: item.order, active: !item.active });
    } catch (err) {
      setListError(faError(err, "تغییر وضعیت انجام نشد"));
    }
  };

  const remove = async (item) => {
    setListError("");
    try {
      await onDelete(item.id);
    } catch (err) {
      setListError(faError(err, "حذف انجام نشد"));
    }
  };

  return (
    <div className="stack">
      <form className="card stack" onSubmit={submit}>
        <p className="bold">افزودن / ویرایش عبارت پیشنهادی</p>
        <p className="muted small">
          این عبارت‌ها در جعبه جستجوی سایت به‌عنوان «جستجوهای پرطرفدار» نمایش داده می‌شوند.
          اگر هیچ عبارت فعالی ثبت نشود، پایه سایت به‌صورت خودکار پرجستجوترین عبارت‌های واقعی کاربران را نشان می‌دهد.
        </p>

        <div className="field">
          <label htmlFor="ps-term">عبارت جستجو</label>
          <input
            id="ps-term"
            value={form.term}
            onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
            placeholder="مثلاً میکروفون Rode"
            maxLength={80}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="ps-order">ترتیب نمایش</label>
            <input
              id="ps-order"
              type="number"
              min={0}
              max={999}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            فعال باشد
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          {editId && (
            <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
              انصراف از ویرایش
            </button>
          )}
          <button type="submit" className="btn" disabled={busy || !form.term.trim()}>
            {busy ? "..." : editId ? "ذخیره تغییرات" : "افزودن عبارت"}
          </button>
        </div>
      </form>

      {listError && <p className="form-error">{listError}</p>}

      <div className="card">
        <div className="section-head">
          <TrendingUp size={18} />
          <h2>عبارت‌های ثبت‌شده ({num(items.length)})</h2>
        </div>

        {items.length === 0 ? (
          <p className="empty-row">هنوز عبارتی ثبت نشده است.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ترتیب</th>
                  <th>عبارت</th>
                  <th>جستجوی واقعی</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={cx(item.active && "is-active")}>
                    <td className="mono">{num(item.order)}</td>
                    <td>{item.term}</td>
                    <td className="mono muted">{num(item.count)}</td>
                    <td>
                      <span className={item.active ? "badge badge--success" : "badge badge--neutral"}>
                        {item.active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleActive(item)}>
                        {item.active ? "غیرفعال کردن" : "فعال کردن"}
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => startEdit(item)}>
                        <Pencil size={14} /> ویرایش
                      </button>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(item)}>
                        <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== ARTICLES ============================== */
/* مدیریت کامل مقالات (و ویدیوهای داخل هر مقاله) که در بخش مقالات    */
/* کامپوننت Home سایت نمایش داده می‌شن.                               */

const ARTICLE_STATUSES = ["منتشر شده", "پیش‌نویس"];
const EMPTY_ARTICLE_FORM = { title: "", excerpt: "", content: "", category: "", author: "", publishedAt: "", status: "پیش‌نویس", coverImage: null, videos: [] };

function Articles({ articles, onCreate, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_ARTICLE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => articles.filter((a) => {
    const matchSearch = a.title.includes(search) || (a.category || "").includes(search);
    const matchStatus = statusFilter === "همه" || a.status === statusFilter;
    return matchSearch && matchStatus;
  }), [articles, search, statusFilter]);

  const openAdd = () => { setForm(EMPTY_ARTICLE_FORM); setFormError(""); setModal({ mode: "add" }); };
  const openEdit = (a) => {
    setForm({
      title: a.title, excerpt: a.excerpt || "", content: a.content || "",
      category: a.category || "", author: a.author || "", publishedAt: a.publishedAt || "",
      status: a.status,
      coverImage: a.coverImage ? { ...a.coverImage } : null,
      videos: (a.videos || []).map((v) => ({ ...v })),
    });
    setFormError("");
    setModal({ mode: "edit", article: a });
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, coverImage: { url: URL.createObjectURL(file), name: file.name, file } }));
    e.target.value = "";
  };

  const removeCover = () => setForm((f) => ({ ...f, coverImage: null }));

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newVideos = files.map((file) => ({ id: file.name + "-" + file.size + "-" + Date.now(), url: URL.createObjectURL(file), name: file.name, file }));
    setForm((f) => ({ ...f, videos: [...f.videos, ...newVideos] }));
    e.target.value = "";
  };

  const removeVideo = (id) => setForm((f) => ({ ...f, videos: f.videos.filter((v) => v.id !== id) }));

  const submit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    setFormError("");
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      author: form.author,
      publishedAt: form.publishedAt,
      status: form.status,
      coverImageFile: form.coverImage && form.coverImage.file ? form.coverImage.file : null,

keepCoverImageUrl: form.coverImage && !form.coverImage.file ? form.coverImage.url : null,
      videoFiles: form.videos.filter((v) => v.file).map((v) => v.file),
      keepVideoUrls: form.videos.filter((v) => !v.file).map((v) => v.url),
    };
    try {
      if (modal.mode === "add") {
        await onCreate(payload);
      } else {
        await onUpdate(modal.article.id, payload);
      }
      setModal(null);
    } catch (err) {
      setFormError(err.message || "ذخیره‌سازی مقاله با خطا مواجه شد");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      setFormError(err.message || "حذف مقاله با خطا مواجه شد");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbar-filters">
          <div className="search-box">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی عنوان یا دسته‌بندی مقاله..." />
          </div>
          <div className="select-box">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>همه</option>
              {ARTICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
        <button type="button" onClick={openAdd} className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> افزودن مقاله
        </button>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>تصویر</th><th>عنوان</th><th>دسته‌بندی</th><th>تاریخ</th><th>تعداد ویدیو</th><th>وضعیت</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.coverImage ? (
                      <img src={a.coverImage.url} alt="" className="table-thumb" />
                    ) : (
                      <div className="table-thumb table-thumb--empty"><FileText size={14} /></div>
                    )}
                  </td>
                  <td className="bold cell-wide">{a.title}</td>
                  <td className="muted">{a.category || "—"}</td>
                  <td className="mono muted">{a.publishedAt || "—"}</td>
                  <td className="mono muted">{num((a.videos || []).length)}</td>
                  <td><Badge status={a.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => openEdit(a)} className="icon-btn" aria-label={"ویرایش " + a.title}>
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => setDeleteId(a.id)} className="icon-btn icon-btn--danger" aria-label={"حذف " + a.title}>
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="empty-row">مقاله‌ای پیدا نشد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "افزودن مقاله جدید" : "ویرایش مقاله"} onClose={() => !submitting && setModal(null)}>
          {formError && <div className="inline-error"><span>{formError}</span></div>}

          <Field label="عنوان مقاله">


<input disabled={submitting} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً چطور اسپیکر مانیتورینگ انتخاب کنیم؟" />
          </Field>
          <Field label="خلاصه مقاله">
            <textarea rows={2} disabled={submitting} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="یک یا دو جمله معرفی مقاله" />
          </Field>
          <Field label="متن کامل مقاله">
            <textarea rows={5} disabled={submitting} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="متن کامل مقاله..." />
          </Field>
          <div className="field-grid">
            <Field label="دسته‌بندی">
              <input disabled={submitting} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مثلاً راهنمای خرید" />
            </Field>
            <Field label="نویسنده">
              <input disabled={submitting} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="نام نویسنده" />
            </Field>
          </div>
          <div className="field-grid">
            <Field label="تاریخ انتشار">
              <input disabled={submitting} className="mono" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} placeholder="1404/06/01" />
            </Field>
            <Field label="وضعیت انتشار">
              <select disabled={submitting} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ARTICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="تصویر شاخص مقاله">
            {!form.coverImage ? (
              <label className="upload-box">
                <ImagePlus size={17} aria-hidden="true" />
                <span>افزودن تصویر شاخص</span>
                <input type="file" accept="image/*" disabled={submitting} onChange={handleCoverUpload} hidden />
              </label>
            ) : (
              <div className="image-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <div className="image-thumb">
                  <img src={form.coverImage.url} alt="" />
                  <button type="button" onClick={removeCover} className="image-thumb-remove" aria-label="حذف تصویر شاخص">
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label={"ویدیوهای مقاله" + (form.videos.length ? " (" + num(form.videos.length) + ")" : "")}>
            <label className="upload-box">
              <Video size={17} aria-hidden="true" />
              <span>افزودن ویدیو — انتخاب چند فایل هم‌زمان مجاز است</span>
              <input type="file" accept="video/*" multiple disabled={submitting} onChange={handleVideoUpload} hidden />
            </label>
            {form.videos.length > 0 && (
              <div className="video-list">
                {form.videos.map((v) => (
                  <div key={v.id} className="video-preview">
                    <video src={v.url} controls />
                    <div className="video-preview-footer">
                      <span className="mono small muted">{v.name}</span>
                      <button type="button" onClick={() => removeVideo(v.id)} disabled={submitting} className="link-btn">حذف ویدیو</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div className="modal-actions">
            <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary btn-block">


{submitting ? "در حال ذخیره..." : modal.mode === "add" ? "افزودن مقاله" : "ذخیره تغییرات"}
            </button>
            <button type="button" onClick={() => setModal(null)} disabled={submitting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="حذف مقاله" onClose={() => !deleting && setDeleteId(null)}>
          {formError && <div className="inline-error"><span>{formError}</span></div>}
          <p className="muted" style={{ marginBottom: 24 }}>آیا از حذف این مقاله مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p>
          <div className="modal-actions">
            <button type="button" onClick={confirmDelete} disabled={deleting} className="btn btn-danger btn-block">
              {deleting ? "در حال حذف..." : "حذف مقاله"}
            </button>
            <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="btn btn-secondary">انصراف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ====================== SECTION SLIDERS (عضویت محصول در ریل بخش‌ها) ====================== */

const SLIDER_TABS = [
  { key: "amazing", label: "شگفت‌انگیزها", hint: "محصولاتی که در ریل «پیشنهاد شگفت‌انگیز» صفحه اصلی دیده می‌شوند." },
  { key: "popular", label: "محبوب‌ها", hint: "محصولاتی که در ریل «محبوب‌ترین‌ها» صفحه اصلی دیده می‌شوند." },
];

function SectionSliders({ sliders, products, onAdd, onUpdate, onDelete }) {
  const [activeKey, setActiveKey] = useState(SLIDER_TABS[0].key);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(null);

  const active = SLIDER_TABS.find((s) => s.key === activeKey) || SLIDER_TABS[0];

  const members = useMemo(
    () =>
      [...(sliders || [])]
        .filter((s) => s.section === active.key)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id),
    [sliders, active.key],
  );

  const memberIds = useMemo(() => new Set(members.map((m) => m.product?.id)), [members]);
  const candidates = useMemo(
    () => products.filter((p) => !memberIds.has(p.id) && matchesProduct(p, search)),
    [products, memberIds, search],
  );

  const run = async (key, action) => {
    setPending(key);
    try {
      await action();
    } catch (err) {
      /* وضعیت سرور تغییری نکرده است؛ مدیر می‌تواند دوباره تلاش کند */
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="stack">
      <div className="info-note">
        <SlidersHorizontal size={15} aria-hidden="true" />
        <span>
          محصولاتی که اینجا اضافه می‌کنید فقط در ریل مربوطه در صفحه اصلی نمایش داده می‌شوند. این لیست کاملاً از بخش‌های ویژه جداست؛ حذف محصول از اینجا آن را از بخش ویژه‌اش حذف نمی‌کند و یک محصول می‌تواند در هر دو ریل باشد.
        </span>
      </div>

      <div className="special-tabs" role="tablist" aria-label="ریل‌های صفحه اصلی">
        {SLIDER_TABS.map((s) => {
          const count = (sliders || []).filter((item) => item.section === s.key).length;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={s.key === active.key}
              className={cx("special-tab", s.key === active.key && "is-active")}
              onClick={() => setActiveKey(s.key)}
            >
              <span className="special-tab-label">{s.label}</span>
              <span className="special-tab-count">{num(count)}</span>
            </button>
          );
        })}
      </div>

      <div className="special-head">
        <h2>{active.label}</h2>
        <span className="muted">{active.hint}</span>
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>محصولات این ریل</h2></div>
        <div className="special-grid">
          {members.map((item) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item.id} className={cx("special-chip", !item.active && "is-muted")}>
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0].url} alt="" className="special-chip-thumb" />
                ) : (
                  <div className="special-chip-thumb special-chip-thumb--empty"><Package size={14} /></div>
                )}
                <div className="special-chip-body">
                  <span className="special-chip-name" title={product.name}>{product.name}</span>
                  <span className="special-chip-meta muted">
                    {product.category} · {product.sku}
                    {!item.active ? " · پنهان" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="special-chip-remove"
                  disabled={pending === item.id}
                  title={item.active ? "پنهان کردن از ریل" : "نمایش در ریل"}
                  aria-label={(item.active ? "پنهان کردن " : "نمایش ") + product.name}
                  onClick={() => run(item.id, () => onUpdate(item.id, { active: !item.active }))}
                >
                  {item.active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  className="special-chip-remove"
                  disabled={pending === item.id}
                  title="حذف از این ریل"
                  aria-label={"حذف " + product.name + " از " + active.label}
                  onClick={() => run(item.id, () => onDelete(item.id))}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="special-empty">هنوز محصولی به ریل «{active.label}» اضافه نشده است.</p>
          )}
        </div>
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>افزودن محصول به «{active.label}»</h2></div>
        <div className="toolbar">
          <div className="toolbar-filters">
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی نام، کد یا دسته‌بندی محصول..."
              />
            </div>
          </div>
        </div>
        <div className="special-grid">
          {candidates.map((p) => (
            <div key={p.id} className="special-chip">
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0].url} alt="" className="special-chip-thumb" />
              ) : (
                <div className="special-chip-thumb special-chip-thumb--empty"><Package size={14} /></div>
              )}
              <div className="special-chip-body">
                <span className="special-chip-name" title={p.name}>{p.name}</span>
                <span className="special-chip-meta muted">
                  {p.category} · {p.sku}
                </span>
              </div>
              <button
                type="button"
                className="special-chip-add"
                disabled={pending === p.id}
                onClick={() => run(p.id, () => onAdd(active.key, p.id))}
              >
                <Plus size={15} />
                <span>افزودن</span>
              </button>
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="special-empty">محصول دیگری برای افزودن پیدا نشد.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== REPORTS ============================== */

function Reports({ products, orders }) {
  const MONTH_NAMES = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

  const salesByMonth = useMemo(() => {
    const buckets = new Map();
    (orders || []).forEach((o) => {
      const parts = String(o.date || "").split("/");
      const monthIndex = parts.length === 3 ? Number(parts[1]) - 1 : -1;
      if (monthIndex < 0 || monthIndex > 11) return;
      const key = parts[0] + "/" + parts[1];
      buckets.set(key, (buckets.get(key) || 0) + (o.total || 0));
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, total]) => ({
        month: (MONTH_NAMES[Number(key.split("/")[1]) - 1] || key) + " " + key.split("/")[0],
        sales: Math.round(total / 1000000),
      }));
  }, [orders]);

  const totalSales = (orders || []).reduce((s, o) => s + (o.total || 0), 0);
  const totalYear = Math.round(totalSales / 1000000);
  const bestMonth = salesByMonth.reduce((a, b) => (b.sales > a.sales ? b : a), { month: "—", sales: 0 });
  const averageOrder = orders && orders.length ? Math.round(totalSales / orders.length) : 0;

  const soldCount = useMemo(() => {
    const counts = new Map();
    (orders || []).forEach((o) => {
      (o.line_items || []).forEach((li) => {
        counts.set(li.product_id, (counts.get(li.product_id) || 0) + (li.quantity || 0));
      });
    });
    return counts;
  }, [orders]);

  const topProducts = useMemo(() => {
    const ranked = [...(products || [])].sort((a, b) => (soldCount.get(b.id) || 0) - (soldCount.get(a.id) || 0));
    return ranked.slice(0, 5);
  }, [products, soldCount]);

  const categoryShare = useMemo(() => {
    const counts = new Map();
    (products || []).forEach((p) => {
      const name = p.category || "بدون دسته‌بندی";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <div className="stack">
      <div className="stats-grid stats-grid--3">
        <StatCard icon={TrendingUp} label="فروش کل (میلیون تومان)" value={num(totalYear)} delta={num(orders ? orders.length : 0) + " سفارش"} positive level={80} />
        <StatCard icon={Calendar} label="پرفروش‌ترین ماه" value={bestMonth.month} delta={num(bestMonth.sales) + " میلیون"} positive level={95} />
        <StatCard icon={ShoppingBag} label="میانگین سفارش" value={toman(averageOrder)} delta={num(products ? products.length : 0) + " محصول"} positive level={64} />
      </div>

      <div className="card chart-card">
        <h2>فروش ماهانه</h2>
        <p className="muted">بر حسب میلیون تومان — محاسبه‌شده از سفارش‌های واقعی</p>
        {salesByMonth.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "Vazirmatn" }} />
              <Bar dataKey="sales" fill={CHART_INK} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-row">هنوز سفارشی برای نمایش نمودار وجود ندارد</p>
        )}
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>پرفروش‌ترین محصولات</h2></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>رتبه</th><th>محصول</th><th>دسته‌بندی</th><th>فروش (عدد)</th><th>قیمت واحد</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.id}>
                  <td><span className="rank-badge mono">{i + 1}</span></td>
                  <td className="bold">{p.name}</td>
                  <td className="muted">{p.category}</td>
                  <td className="mono">{num(soldCount.get(p.id) || 0)}</td>
                  <td className="mono bold">{toman(p.price)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && <tr><td colSpan={5} className="empty-row">محصولی برای نمایش نیست</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card chart-card">
        <h2>سهم دسته‌بندی‌ها از تعداد محصولات</h2>
        <p className="muted">محاسبه‌شده از محصولات ثبت‌شده</p>
        {products && products.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {categoryShare.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "Vazirmatn" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-row">محصولی برای نمایش نیست</p>
        )}
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsView() {
  const [storeName, setStoreName] = useState("آوای انعکاس");
  const [saved, setSaved] = useState(false);

  return (
    <div className="card settings-card">
      <h2>اطلاعات فروشگاه</h2>
      <p className="muted" style={{ marginBottom: 24 }}>این اطلاعات در فاکتورها و ایمیل‌های سفارش نمایش داده می‌شود</p>

<Field label="نام فروشگاه"><input value={storeName} onChange={(e) => setStoreName(e.target.value)} /></Field>
      <Field label="شماره تماس پشتیبانی"><input className="mono" placeholder="021XXXXXXX" /></Field>
      <Field label="ایمیل فروشگاه"><input placeholder="info@sonicstudio.ir" /></Field>
      <Field label="آدرس"><textarea rows={3} placeholder="تهران، خیابان ..." /></Field>

      <button
        type="button"
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="btn btn-primary"
      >
        {saved ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
        {saved ? "ذخیره شد" : "ذخیره تغییرات"}
      </button>
    </div>
  );
}

/* ============================== SPECIAL SECTIONS ============================== */

/** چهار بخش ویژه سایت؛ هر کدام پرچم مستقل خود را روی محصول دارد. */
const SPECIAL_SECTIONS = [
  { key: "is_featured", label: "شگفت‌انگیزها", hint: "نمایش در پیشنهاد شگفت‌انگیز صفحه اصلی" },
  { key: "is_popular", label: "محبوب‌ترین‌ها", hint: "نمایش در اسلایدر محبوب‌ترین‌ها" },
  { key: "is_trending", label: "ترندترین‌ها", hint: "نمایش در اسلایدر ترندترین‌ها" },
  { key: "is_best_seller", label: "پرفروش‌ترین‌ها", hint: "نمایش در اسلایدر پرفروش‌ترین‌ها" },
];

const matchesProduct = (p, term) => {
  if (!term) return true;
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return (
    (p.name || "").toLowerCase().includes(t) ||
    (p.sku || "").toLowerCase().includes(t) ||
    (p.category || "").toLowerCase().includes(t)
  );
};

function SpecialProducts({ products, onToggleFlag }) {
  const [activeKey, setActiveKey] = useState(SPECIAL_SECTIONS[0].key);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(null);

  const active = SPECIAL_SECTIONS.find((s) => s.key === activeKey) || SPECIAL_SECTIONS[0];
  const inSection = useMemo(
    () => products.filter((p) => !!p[active.key]),
    [products, active.key],
  );
  const candidates = useMemo(
    () => products.filter((p) => !p[active.key] && matchesProduct(p, search)),
    [products, active.key, search],
  );

  const toggle = async (p, next) => {
    setPending(p.id);
    try {
      await onToggleFlag(p, active.key, next);
    } catch (err) {
      /* مدیر می‌تواند دوباره تلاش کند؛ وضعیت سرور تغییری نکرده است */
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="stack">
      <div className="info-note">
        <Star size={15} aria-hidden="true" />
        <span>
          هر بخش جداگانه مدیریت می‌شود؛ محصولی که در این بخش اضافه کنید فقط در اسلایدر همان بخش از صفحه اصلی نمایش داده می‌شود. یک محصول می‌تواند هم‌زمان در چند بخش باشد.
        </span>
      </div>

      <div className="special-tabs" role="tablist" aria-label="بخش‌های ویژه">
        {SPECIAL_SECTIONS.map((s) => {
          const count = products.filter((p) => !!p[s.key]).length;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={s.key === active.key}
              className={cx("special-tab", s.key === active.key && "is-active")}
              onClick={() => setActiveKey(s.key)}
            >
              <span className="special-tab-label">{s.label}</span>
              <span className="special-tab-count">{num(count)}</span>
            </button>
          );
        })}
      </div>

      <div className="special-head">
        <h2>{active.label}</h2>
        <span className="muted">{active.hint}</span>
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>محصولات این بخش</h2></div>
        <div className="special-grid">
          {inSection.map((p) => (
            <div key={p.id} className="special-chip">
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0].url} alt="" className="special-chip-thumb" />
              ) : (
                <div className="special-chip-thumb special-chip-thumb--empty"><Package size={14} /></div>
              )}
              <div className="special-chip-body">
                <span className="special-chip-name" title={p.name}>{p.name}</span>
                <span className="special-chip-meta muted">
                  {p.category} · {Number(p.rating || 0).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
                </span>
              </div>
              <button
                type="button"
                className="special-chip-remove"
                disabled={pending === p.id}
                title="حذف از این بخش"
                aria-label={"حذف " + p.name + " از " + active.label}
                onClick={() => toggle(p, false)}
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {inSection.length === 0 && (
            <p className="special-empty">هنوز محصولی به «{active.label}» اضافه نشده است.</p>
          )}
        </div>
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>افزودن محصول به «{active.label}»</h2></div>
        <div className="toolbar">
          <div className="toolbar-filters">
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی نام، کد یا دسته‌بندی محصول..."
              />
            </div>
          </div>
        </div>
        <div className="special-grid">
          {candidates.map((p) => (
            <div key={p.id} className="special-chip">
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0].url} alt="" className="special-chip-thumb" />
              ) : (
                <div className="special-chip-thumb special-chip-thumb--empty"><Package size={14} /></div>
              )}
              <div className="special-chip-body">
                <span className="special-chip-name" title={p.name}>{p.name}</span>
                <span className="special-chip-meta muted">
                  {p.category} · {p.sku}
                </span>
              </div>
              <button
                type="button"
                className="special-chip-add"
                disabled={pending === p.id}
                onClick={() => toggle(p, true)}
              >
                <Plus size={15} />
                <span>افزودن</span>
              </button>
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="special-empty">محصول دیگری برای افزودن پیدا نشد.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== MESSAGES (پیامک به مشتریان) ============================== */

function MessagesSection({ messages, customers, onSend, onDelete }) {
  const [text, setText] = useState("");
  const [targetMode, setTargetMode] = useState("all");
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [manualPhone, setManualPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackErr, setFeedbackErr] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    setFeedback("");
    setFeedbackErr("");
    try {
      await onDelete(id);
      setFeedback("پیام حذف و از بخش «پیام‌های من» کاربر نیز حذف شد ✓");
    } catch (err) {
      setFeedbackErr(faError(err, "حذف ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  };

  const togglePhone = (phone) => {
    setSelectedPhones((prev) => {
      const s = new Set(prev);
      if (s.has(phone)) s.delete(phone);
      else s.add(phone);
      return s;
    });
  };

  const addManualPhone = () => {
    const p = manualPhone.trim();
    if (!p) return;
    setSelectedPhones((prev) => new Set(prev).add(p));
    setManualPhone("");
  };

  const handleSend = async () => {
    setFeedback("");
    setFeedbackErr("");
    if (!text.trim()) {
      setFeedbackErr("متن پیام را وارد کنید");
      return;
    }
    let phones = [];
    if (targetMode === "all") phones = [];
    else if (selectedPhones.size === 0) {
      setFeedbackErr("حداقل یک مشتری (گیرنده) را انتخاب کنید");
      return;
    } else {
      phones = Array.from(selectedPhones);
    }
    setSubmitting(true);
    try {
      const res = await onSend({ text: text.trim(), target: targetMode, phones });
      setFeedback("پیام برای " + num(res.phones || res.created || phones.length) + " نفر ارسال شد ✓");
      setText("");
      setSelectedPhones(new Set());
    } catch (err) {
      setFeedbackErr(faError(err, "ارسال ناموفق بود"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack messages-section">
      <div className="card">
        <div className="section-head">
          <MessageSquareText size={18} />
          <div>
            <h2>ارسال پیامک به مشتریان</h2>
            <p className="muted small">پیام شما در بخش «پیام‌های من» برای مشتری نمایش داده می‌شود و بالای آیکن زنگش نشانگر قرمز می‌آید.</p>
          </div>
        </div>

        <Field label="متن پیام">
          <textarea
            rows={4}
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="متن پیامک را بنویسید..."
          />
          <p className="muted small" style={{ textAlign: "left", marginTop: 4 }}>{num(text.length)} / ۱٬۰۰۰</p>
        </Field>

        <Field label="گیرنده‌ها">
          <div className="radio-row">
            <label className="radio-label">
              <input type="radio" checked={targetMode === "all"} onChange={() => setTargetMode("all")} />
              همه مشتریان ({num(customers.length)} نفر)
            </label>
            <label className="radio-label">
              <input type="radio" checked={targetMode === "customers"} onChange={() => setTargetMode("customers")} />
              انتخاب مشتری
            </label>
          </div>

          {targetMode === "all" && (
            <>
              <p className="muted small">این پیام برای <strong>{num(customers.length)} مشتری</strong> ارسال می‌شود:</p>
              <div className="customers-chip-list is-preview">
                {customers.map((c) => (
                  <span key={c.id} className="chip">
                    <span className="chip-name">{c.name || "کاربر"}</span>
                    <span className="chip-phone mono">{c.phone}</span>
                  </span>
                ))}
                {customers.length === 0 && <p className="muted small">مشتری ثبت‌شده‌ای وجود ندارد.</p>}
              </div>
            </>
          )}

          {targetMode === "customers" && (
            <>
              <div className="phone-picker-row">
                <input
                  className="mono"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="شماره جدید (مثال: 0912XXXXXXX)"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-ghost" onClick={addManualPhone} disabled={!manualPhone.trim()}>
                  <Plus size={16} /> افزودن
                </button>
              </div>

              <div className="customers-chip-list">
                {customers.map((c) => (
                  <label key={c.id} className={`chip ${selectedPhones.has(c.phone) ? "is-selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selectedPhones.has(c.phone)}
                      onChange={() => togglePhone(c.phone)}
                    />
                    <span className="chip-name">{c.name || "کاربر"}</span>
                    <span className="chip-phone mono">{c.phone}</span>
                  </label>
                ))}
                {customers.length === 0 && <p className="muted small">مشتری ثبت‌شده‌ای وجود ندارد.</p>}
              </div>
              <p className="muted small">
                انتخاب‌شده: {num(selectedPhones.size)} نفر
                {selectedPhones.size > 0 && " — " + Array.from(selectedPhones).join("، ")}
              </p>
            </>
          )}
        </Field>

        {feedback && <p className="form-success">{feedback}</p>}
        {feedbackErr && <p className="form-error">{feedbackErr}</p>}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSend}
          disabled={submitting || !text.trim()}
        >
          <Send size={16} />
          {submitting ? "در حال ارسال..." : "ارسال پیامک"}
        </button>
      </div>

      <div className="card">
        <div className="section-head">
          <Bell size={18} />
          <h2>تاریخچه پیام‌های ارسالی</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>گیرنده</th>
                <th>متن پیام</th>
                <th>وضعیت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">هنوز پیامی ارسال نشده است</td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="bold small">{m.customer || "—"}</span>
                      <span className="mono muted small" dir="ltr"> ({m.phone})</span>
                    </td>
                    <td className="small">{m.text}</td>
                    <td>
                      {m.is_read
                        ? <Badge status="خوانده شده" />
                        : <Badge status="جدید" />}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        aria-label="حذف پیام"
                        title="حذف پیام (برای کاربر هم حذف می‌شود)"
                      >
                        {deletingId === m.id ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== CATEGORIES (دسته‌بندی‌ها) ============================== */

function CategoriesManager({ categories, onCreate, onUpdate, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newSubs, setNewSubs] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSubs, setEditSubs] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const parseSubs = (raw) => raw.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);

  const resetForm = () => { setNewName(""); setNewSubs(""); setError(""); setFeedback(""); };

  const handleCreate = async () => {
    if (!newName.trim()) { setError("نام دسته را وارد کنید"); return; }
    setBusy(true); setError(""); setFeedback("");
    try {
      const subs = parseSubs(newSubs);
      await onCreate({ name: newName.trim(), subgroups: subs });
      resetForm();
      setFeedback("دسته جدید اضافه شد ✓");
    } catch (err) {
      setError(faError(err, "افزودن دسته ناموفق بود"));
    } finally { setBusy(false); }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) { setError("نام دسته را وارد کنید"); return; }
    setBusy(true); setError(""); setFeedback("");
    try {
      const subs = parseSubs(editSubs);
      await onUpdate(editingId, { name: editName.trim(), subgroups: subs });
      setEditingId(null);
      setFeedback("دسته به‌روزرسانی شد ✓");
    } catch (err) {
      setError(faError(err, "ویرایش ناموفق بود"));
    } finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    setBusy(true); setError(""); setFeedback("");
    try {
      await onDelete(id);
      setFeedback("دسته حذف شد ✓");
    } catch (err) {
      setError(faError(err, "حذف ناموفق بود"));
    } finally { setBusy(false); }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="section-head">
          <FolderOpen size={18} />
          <div>
            <h2>افزودن دسته‌بندی جدید</h2>
            <p className="muted small">زیردسته‌ها را با «،» یا Enter از هم جدا کنید.</p>
          </div>
        </div>
        <div className="field-grid">
          <Field label="نام دسته">
            <input disabled={busy} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً کارت صدا" />
          </Field>
          <Field label="زیردسته‌ها (اختیاری)">
            <input disabled={busy} value={newSubs} onChange={(e) => setNewSubs(e.target.value)} placeholder="مثلاً USB، حرفه‌ای، اقتصادی" />
          </Field>
        </div>
        {error && <p className="form-error">{error}</p>}
        {feedback && <p className="form-success">{feedback}</p>}
        <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={busy}>
          <Plus size={16} /> افزودن دسته
        </button>
      </div>

      <div className="card">
        <div className="section-head">
          <Layers size={18} />
          <h2>دسته‌بندی‌های موجود ({num(categories.length)})</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>ترتیب</th><th>نام دسته</th><th>زیردسته‌ها</th><th></th></tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={4} className="empty-row">دسته‌ای ثبت نشده است</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td className="mono muted">{num((c.order ?? 0) + 1)}</td>
                    <td className="bold">
                      {editingId === c.id ? (
                        <input className="mono" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%' }} />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="small">
                      {editingId === c.id ? (
                        <input value={editSubs} onChange={(e) => setEditSubs(e.target.value)} placeholder="زیردسته‌ها با «،» جدا شوند" className="mono" style={{ width: '100%' }} />
                      ) : (
                        (c.subgroups && c.subgroups.length ? c.subgroups.join("، ") : <span className="muted">—</span>)
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {editingId === c.id ? (
                          <>
                            <button type="button" className="icon-btn" onClick={handleUpdate} disabled={busy} aria-label="ذخیره دسته" title="ذخیره">
                              <Check size={14} />
                            </button>
                            <button type="button" className="icon-btn" onClick={() => setEditingId(null)} disabled={busy} aria-label="انصراف">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => { setEditingId(c.id); setEditName(c.name); setEditSubs((c.subgroups || []).join("، ")); setError(""); setFeedback(""); }}
                              aria-label={"ویرایش " + c.name}
                              title="ویرایش"
                            >
                              <Pencil size={14} />
                            </button>
                            <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleDelete(c.id)} disabled={busy} aria-label={"حذف " + c.name}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== REVIEWS (دیدگاه‌ها) ============================== */

function ReviewsManager({ reviews, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("fa-IR"); } catch { return "—"; }
  };

  const handleDelete = async (id) => {
    setDeletingId(id); setError(""); setFeedback("");
    try {
      await onDelete(id);
      setFeedback("دیدگاه حذف شد ✓");
    } catch (err) {
      setError(faError(err, "حذف دیدگاه ناموفق بود"));
    } finally { setDeletingId(null); }
  };

  return (
    <div className="stack">
      {error && <p className="form-error">{error}</p>}
      {feedback && <p className="form-success">{feedback}</p>}
      <div className="card">
        <div className="section-head">
          <MessagesSquare size={18} />
          <h2>دیدگاه‌های ثبت‌شده ({num(reviews.length)})</h2>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>محصول</th><th>کاربر</th><th>امتیاز</th><th>دیدگاه</th><th>تاریخ</th><th></th></tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">دیدگاهی ثبت نشده است</td></tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="bold cell-wide">{r.product_name || ("#" + r.product_id)}</td>
                    <td className="small">{r.author || "—"}</td>
                    <td>
                      <span className="mono bold" style={{ color: "#c28b00" }}>{r.rating != null ? r.rating : "—"}</span>
                      <span className="muted"> / ۵</span>
                    </td>
                    <td className="small">{r.comment || "—"}</td>
                    <td className="mono muted small">{fmtDate(r.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        aria-label="حذف دیدگاه"
                        title="حذف دیدگاه"
                      >
                        {deletingId === r.id ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== MAIN APP ============================== */

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersFilterSeed, setOrdersFilterSeed] = useState("همه");
  const [customers, setCustomers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [sectionSliders, setSectionSliders] = useState([]);
  const [categorySlides, setCategorySlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [signedIn] = useState(() => isLoggedIn() && Boolean(getAccessToken()));

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [productsData, ordersData, customersData, articlesData, messagesData, slidersData, categorySlidesData, categoriesData, reviewsData, popularSearchesData, sectionSlidersData] = await Promise.all([
        fetchProducts(), fetchOrders(), fetchCustomers(), fetchArticles(), fetchAdminMessages(),
        fetchHomeSliders(), fetchCategorySlides(), fetchAdminCategories(), fetchAllReviews(),
        fetchPopularSearchesAdmin(), fetchSectionSliders(),
      ]);
      setProducts(productsData);
      setOrders(ordersData || []);
      setCustomers(customersData);
      setArticles(articlesData || []);
      setPopularSearches(popularSearchesData || []);
      setMessages(messagesData || []);
      setSliders(slidersData || []);
      setSectionSliders(sectionSlidersData || []);
      setCategorySlides(categorySlidesData || []);
      setCategories(categoriesData || []);
      setReviews(reviewsData || []);
    } catch (err) {
      setLoadError(faError(err, "اتصال به سرور برقرار نشد"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selectTab = (key) => {
    setActiveTab(key);
    setMobileNavOpen(false);
  };

  const goToOrders = (filterStatus) => {
    setOrdersFilterSeed(filterStatus || "همه");
    selectTab("orders");
  };

  const handleUpdateOrderStatus = async (id, status) => {
    const updated = await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: (updated && updated.status) || status } : o)));
    return updated;
  };

  const handleCreateArticle = async (payload) => {
    const created = await createArticle(payload);
    setArticles((prev) => [created, ...prev]);
  };

  const handleUpdateArticle = async (id, payload) => {
    const updated = await updateArticle(id, payload);
    setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleBlockCustomer = async (customer, isBlocked) => {
    const updated = await setCustomerBlocked(customer.id, isBlocked);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, is_blocked: Boolean(updated.is_blocked) } : c)),
    );
  };

  const handleDeleteCustomer = async (customer) => {
    await deleteCustomer(customer.id);
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    setOrders((prev) => prev.map((o) => (o.userId === customer.id ? { ...o, userId: null } : o)));
  };

  const handleCreatePopularSearch = async (payload) => {
    const created = await createPopularSearch(payload);
    setPopularSearches((prev) => sortPopularSearches([...prev, created]));
  };

  const handleUpdatePopularSearch = async (id, payload) => {
    const updated = await updatePopularSearch(id, payload);
    setPopularSearches((prev) => sortPopularSearches(prev.map((s) => (s.id === id ? updated : s))));
  };

  const handleDeletePopularSearch = async (id) => {
    await deletePopularSearch(id);
    setPopularSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteArticle = async (id) => {
    await deleteArticle(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateProduct = async (payload) => {
    const created = await createProduct(payload);
    setProducts((prev) => [created, ...prev]);
  };

  const handleUpdateProduct = async (id, payload) => {
    const updated = await updateProduct(id, payload);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDeleteProduct = async (id) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleQuickRating = async (p, delta) => {
    const next = Math.max(0, Math.min(5, Math.round((Number(p.rating) || 0) * 2 + delta * 2) / 2));
    const updated = await updateProductSelection(p.id, { rating: next });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    return updated;
  };

  const handleToggleProductFlag = async (p, flag, value) => {
    const updated = await updateProductSelection(p.id, { [flag]: value });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    return updated;
  };

  const handleCreateSlider = async (payload) => {
    const created = await createHomeSlider(payload);
    setSliders((prev) => [...prev, created]);
  };

  const handleUpdateSlider = async (id, payload) => {
    const updated = await updateHomeSlider(id, payload);
    setSliders((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleDeleteSlider = async (id) => {
    await deleteHomeSlider(id);
    setSliders((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSectionSliderItem = async (section, productId) => {
    const created = await createSectionSliderItem(section, productId);
    setSectionSliders((prev) => [...prev, created]);
  };

  const handleUpdateSectionSlider = async (id, payload) => {
    const updated = await updateSectionSliderItem(id, payload);
    setSectionSliders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    );
  };

  const handleDeleteSectionSlider = async (id) => {
    await deleteSectionSlider(id);
    setSectionSliders((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreateCategorySlide = async (payload) => {
    const created = await createCategorySlide(payload);
    setCategorySlides((prev) => [...prev, created]);
  };

  const handleUpdateCategorySlide = async (id, payload) => {
    const updated = await updateCategorySlide(id, payload);
    setCategorySlides((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleDeleteCategorySlide = async (id) => {
    await deleteCategorySlide(id);
    setCategorySlides((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSendMessage = async (payload) => {
    const res = await sendAdminMessage(payload);
    const list = await fetchAdminMessages();
    setMessages(list || []);
    return res;
  };

  const handleDeleteMessage = async (id) => {
    await deleteAdminMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreateCategory = async (payload) => {
    const created = await createAdminCategory(payload);
    setCategories((prev) => [...prev, created]);
  };

  const handleUpdateCategory = async (id, payload) => {
    const updated = await updateAdminCategory(id, payload);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleDeleteCategory = async (id) => {
    await deleteAdminCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteReview = async (id) => {
    await deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="app" dir="rtl" lang="fa">
        <FullScreenState kind="loading" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="app" dir="rtl" lang="fa">
        <FullScreenState
          kind="error"
          message="پنل مدیریت فقط برای حساب مدیر باز است. لطفاً با شماره مدیر وارد شوید."
          onRetry={loadAll}
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app" dir="rtl" lang="fa">
        <FullScreenState kind="error" message={loadError} onRetry={loadAll} />
      </div>
    );
  }

  return (
    <div className="app" dir="rtl" lang="fa">
      <div className="layout">
        {mobileNavOpen && (
          <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} role="presentation" />
        )}

        <aside className={cx("sidebar", !sidebarOpen && "is-collapsed", mobileNavOpen && "is-mobile-open")} aria-label="منوی اصلی">
          <div className="sidebar-header">
            {sidebarOpen && (
              <div className="sidebar-brand">
                <div className="sidebar-logo">
                  <Volume2 size={17} />
                  <span className="pulse-dot" />
                </div>
                <div className="sidebar-titles">
                  <p className="sidebar-title">آوای انعکاس</p>
                  <p className="sidebar-subtitle">پنل مدیریت</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="icon-btn sidebar-collapse-btn"
              aria-label={sidebarOpen ? "جمع کردن منو" : "باز کردن منو"}
              aria-expanded={sidebarOpen}
            >
              <Menu size={17} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setMobileNavOpen(false)} className="icon-btn sidebar-close-btn" aria-label="بستن منو">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <nav className="nav">
            {NAV.map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectTab(item.key)}
                  className={cx("nav-item", active && "is-active")}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                >
                  <span className="nav-dot" aria-hidden="true" />
                  <item.icon size={17} aria-hidden="true" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="status-panel">
                <div className="status-panel-title"><Radio size={13} className="icon-pulse" /> وضعیت سیستم</div>
                <p>همه سرویس‌ها فعال هستند</p>
              </div>
            </div>
          )}
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="topbar-start">
              <button type="button" onClick={() => setMobileNavOpen(true)} className="icon-btn mobile-menu-btn" aria-label="باز کردن منو">
                <Menu size={18} aria-hidden="true" />
              </button>
              <h1>{NAV.find((n) => n.key === activeTab)?.label}</h1>
            </div>
            <div className="topbar-actions">
              <button type="button" className="icon-btn" aria-label="اعلان‌ها">
                <Bell size={17} aria-hidden="true" />
                <span className="notif-dot" aria-hidden="true" />
              </button>
              <div className="avatar" aria-label="حساب کاربری مدیر" role="img">مد</div>
            </div>
          </header>


<div className="content">
            {activeTab === "dashboard" && (
              <Dashboard
                products={products}
                categories={categories}
                reviews={reviews}
                messages={messages}
                orders={orders}
                onGoProducts={() => selectTab("products")}
                onGoOrders={goToOrders}
              />
            )}
            {activeTab === "products" && (
              <Products
                products={products}
                onCreate={handleCreateProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onQuickRating={handleQuickRating}
              />
            )}
            {activeTab === "events" && (
              <SpecialProducts
                products={products}
                onToggleFlag={handleToggleProductFlag}
              />
            )}
            {activeTab === "special" && (
              <SectionSliders
                sliders={sectionSliders}
                products={products}
                onAdd={handleAddSectionSliderItem}
                onUpdate={handleUpdateSectionSlider}
                onDelete={handleDeleteSectionSlider}
              />
            )}
            {activeTab === "sliders" && (
              <HomeSliders
                sliders={sliders}
                onCreate={handleCreateSlider}
                onUpdate={handleUpdateSlider}
                onDelete={handleDeleteSlider}
              />
            )}
                        {activeTab === "categorySlides" && (
              <CategorySlides
                slides={categorySlides}
                onCreate={handleCreateCategorySlide}
                onUpdate={handleUpdateCategorySlide}
                onDelete={handleDeleteCategorySlide}
              />
            )}
            {activeTab === "categories" && (
              <CategoriesManager
                categories={categories}
                onCreate={handleCreateCategory}
                onUpdate={handleUpdateCategory}
                onDelete={handleDeleteCategory}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewsManager reviews={reviews} onDelete={handleDeleteReview} />
            )}
            {activeTab === "orders" && (
              <Orders
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                initialStatusFilter={ordersFilterSeed}
              />
            )}
            {activeTab === "customers" && (
        <Customers
          customers={customers}
          onBlockToggle={handleBlockCustomer}
          onDelete={handleDeleteCustomer}
        />
      )}

      {activeTab === "popularSearches" && (
        <PopularSearches
          items={popularSearches}
          onCreate={handleCreatePopularSearch}
          onUpdate={handleUpdatePopularSearch}
          onDelete={handleDeletePopularSearch}
        />
      )}
            {activeTab === "messages" && (
              <MessagesSection
                messages={messages}
                customers={customers}
                onSend={handleSendMessage}
                onDelete={handleDeleteMessage}
              />
            )}
            {activeTab === "articles" && (
              <Articles
                articles={articles}
                onCreate={handleCreateArticle}
                onUpdate={handleUpdateArticle}
                onDelete={handleDeleteArticle}
              />
            )}
            {activeTab === "reports" && <Reports products={products} orders={orders} />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
