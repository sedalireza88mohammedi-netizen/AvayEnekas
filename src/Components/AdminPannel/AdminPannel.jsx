
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings,
  Search, Plus, Pencil, Trash2, X, ChevronDown, TrendingUp,
  DollarSign, ShoppingBag, AlertTriangle, Radio, Volume2,
  ArrowUpRight, ArrowDownRight, Phone, Mail, Calendar, Package2,
  CheckCircle2, Clock, XCircle, Truck, Menu, Bell, ImagePlus, Video,
  RefreshCw, FileText,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import "./AdminPannel.css";
import {
  CATEGORY_LIST,
  fetchProducts, createProduct, updateProduct, deleteProduct,
  fetchOrders, updateOrderStatus,
  fetchCustomers,
  fetchArticles, createArticle, updateArticle, deleteArticle,
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

const statusClass = (status) => {
  switch (status) {
    case "فعال": case "تحویل شده": case "پرداخت شده": case "منتشر شده": return "badge badge--success";
    case "در حال ارسال": return "badge badge--warning";
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
  { key: "orders", label: "سفارش‌ها", icon: ShoppingCart },
  { key: "customers", label: "مشتریان", icon: Users },
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

function Dashboard({ orders, products, onGoOrders, onGoProducts }) {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "در انتظار پردازش").length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.threshold).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="stack">
      <div className="stats-grid">
        <StatCard icon={DollarSign} label="درآمد کل (این ماه)" value={toman(totalRevenue)} delta="۱۲.۴٪" positive level={72} />
        <StatCard icon={ShoppingBag} label="سفارش‌های ثبت‌شده" value={num(orders.length)} delta="۸.۱٪" positive level={58} onClick={() => onGoOrders("همه")} />
        <StatCard icon={Clock} label="در انتظار پردازش" value={num(pendingOrders)} delta="۳.۲٪" positive={false} level={34} onClick={() => onGoOrders("در انتظار پردازش")} />
        <StatCard icon={AlertTriangle} label="موجودی رو به اتمام" value={num(lowStock + outOfStock)} delta="۲ آیتم" positive={false} level={22} onClick={onGoProducts} />
      </div>

      <div className="charts-grid">
        <div className="card chart-card chart-card--wide">
          <div className="chart-card-header">
            <div>
              <h2>روند فروش سالانه</h2>
              <p className="muted">بر حسب میلیون تومان</p>
            </div>
            <span className="chip"><TrendingUp size={12} /> رشد مثبت</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, direction: "rtl", fontFamily: "Vazirmatn" }} />
              <Line type="monotone" dataKey="sales" stroke={CHART_INK} strokeWidth={2.5} dot={{ r: 3, fill: CHART_INK }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">


<h2>سهم دسته‌بندی‌ها</h2>
          <p className="muted">از کل فروش</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
                {categoryShare.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "Vazirmatn" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {categoryShare.slice(0, 4).map((c, i) => (
              <div key={c.name} className="legend-item">
                <span className="legend-label"><span className="legend-dot" style={{ background: PIE_COLORS[i] }} />{c.name}</span>
                <span className="mono">{c.value}٪</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>آخرین سفارش‌ها</h2></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>شماره سفارش</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td className="bold">{o.customer}</td>
                  <td className="mono muted">{o.date}</td>
                  <td className="mono bold">{toman(o.total)}</td>
                  <td><Badge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== PRODUCTS ============================== */

const EMPTY_FORM = { name: "", category: CATEGORY_LIST[0], sku: "", price: "", stock: "", threshold: "5", images: [], video: null };

function Products({ products, onCreate, onUpdate, onDelete }) {
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
    setForm({
      name: p.name, category: p.category, sku: p.sku, price: p.price, stock: p.stock, threshold: p.threshold,
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
      stock: form.stock,
      threshold: form.threshold,
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
      setFormError(err.message || "ذخیره‌سازی با خطا مواجه شد");
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
      setFormError(err.message || "حذف با خطا مواجه شد");
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
                <th>تصویر</th><th>محصول</th><th>دسته‌بندی</th><th>کد کالا</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th></th>
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
              {filtered.length === 0 && <tr><td colSpan={8} className="empty-row">محصولی با این مشخصات پیدا نشد</td></tr>}
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
            <Field label="موجودی">
              <input disabled={submitting} type="number" className="mono" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
          </div>
          <Field label="حد هشدار موجودی کم">
            <input disabled={submitting} type="number" className="mono" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
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

function Customers({ customers }) {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const filtered = customers.filter((c) => c.name.includes(search) || c.phone.includes(search));

  return (
    <div className="stack">
      <div className="search-box search-box--standalone">
        <Search size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی مشتری..." />
      </div>

      <div className="customers-grid">
        {filtered.map((c) => (
          <button key={c.id} type="button" onClick={() => setDetail(c)} className="card customer-card" aria-label={"مشاهده پروفایل " + c.name}>
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
        ))}
        {filtered.length === 0 && <p className="empty-row" style={{ gridColumn: "1/-1" }}>مشتری‌ای پیدا نشد</p>}
      </div>

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
          </div>
        </Modal>
      )}
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

/* ============================== REPORTS ============================== */

function Reports({ products }) {
  const totalYear = salesByMonth.reduce((s, m) => s + m.sales, 0);
  const bestMonth = salesByMonth.reduce((a, b) => (b.sales > a.sales ? b : a));
  const topProducts = [...products].sort((a, b) => b.price * (30 - b.stock) - a.price * (30 - a.stock)).slice(0, 5);

  return (
    <div className="stack">
      <div className="stats-grid stats-grid--3">
        <StatCard icon={TrendingUp} label="فروش سالانه (میلیون تومان)" value={num(totalYear)} delta="۱۸٪" positive level={80} />
        <StatCard icon={Calendar} label="پرفروش‌ترین ماه" value={bestMonth.month} delta={num(bestMonth.sales)} positive level={95} />
        <StatCard icon={ShoppingBag} label="میانگین سفارش" value={toman(19400000)} delta="۵.۶٪" positive level={64} />
      </div>

      <div className="card chart-card">
        <h2>فروش ماهانه</h2>
        <p className="muted">بر حسب میلیون تومان</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={salesByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "Vazirmatn" }} />
            <Bar dataKey="sales" fill={CHART_INK} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card table-card">
        <div className="table-card-header"><h2>پرفروش‌ترین محصولات</h2></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>رتبه</th><th>محصول</th><th>دسته‌بندی</th><th>قیمت واحد</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.id}>
                  <td><span className="rank-badge mono">{i + 1}</span></td>
                  <td className="bold">{p.name}</td>
                  <td className="muted">{p.category}</td>
                  <td className="mono bold">{toman(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

/* ============================== MOCK CHART DATA (dashboard/reports only) ============================== */

const salesByMonth = [
  { month: "فروردین", sales: 320 }, { month: "اردیبهشت", sales: 410 }, { month: "خرداد", sales: 380 },
  { month: "تیر", sales: 460 }, { month: "مرداد", sales: 520 }, { month: "شهریور", sales: 610 },
  { month: "مهر", sales: 540 }, { month: "آبان", sales: 590 }, { month: "آذر", sales: 670 },
  { month: "دی", sales: 720 }, { month: "بهمن", sales: 640 }, { month: "اسفند", sales: 780 },
];

const categoryShare = [
  { name: "اسپیکر", value: 32 }, { name: "هدفون", value: 26 }, { name: "آمپلی‌فایر", value: 14 },
  { name: "میکروفون", value: 16 }, { name: "میکسر", value: 8 }, { name: "کابل و اتصالات", value: 4 },
];

/* ============================== MAIN APP ============================== */

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [ordersFilterSeed, setOrdersFilterSeed] = useState("همه");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [productsData, ordersData, customersData, articlesData] = await Promise.all([
        fetchProducts(), fetchOrders(), fetchCustomers(), fetchArticles(),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setCustomers(customersData);
      setArticles(articlesData);
    } catch (err) {
      setLoadError(err.message || "اتصال به سرور برقرار نشد");
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
    setOrdersFilterSeed(filterStatus);
    setActiveTab("orders");
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

  const handleUpdateOrderStatus = async (id, status) => {
    const updated = await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated?.status || status } : o)));
  };

  const handleCreateArticle = async (payload) => {
    const created = await createArticle(payload);
    setArticles((prev) => [created, ...prev]);
  };

  const handleUpdateArticle = async (id, payload) => {
    const updated = await updateArticle(id, payload);
    setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };


const handleDeleteArticle = async (id) => {
    await deleteArticle(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) {
    return (
      <div className="app" dir="rtl" lang="fa">
        <FullScreenState kind="loading" />
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
                orders={orders}
                products={products}
                onGoOrders={goToOrders}
                onGoProducts={() => selectTab("products")}
              />
            )}
            {activeTab === "products" && (
              <Products
                products={products}
                onCreate={handleCreateProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
              />
            )}
            {activeTab === "orders" && (
              <Orders
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                initialStatusFilter={ordersFilterSeed}
              />
            )}
            {activeTab === "customers" && <Customers customers={customers} />}
            {activeTab === "articles" && (
              <Articles
                articles={articles}
                onCreate={handleCreateArticle}
                onUpdate={handleUpdateArticle}
                onDelete={handleDeleteArticle}
              />
            )}
            {activeTab === "reports" && <Reports products={products} />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}