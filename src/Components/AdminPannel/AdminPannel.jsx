
import React, { useState, useMemo } from "react";
import {
    LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings,
    Search, Plus, Pencil, Trash2, X, ChevronDown, TrendingUp,
    DollarSign, ShoppingBag, AlertTriangle, Radio, Volume2,
    ArrowUpRight, ArrowDownRight, Phone, Mail, Calendar, Package2,
    CheckCircle2, Clock, XCircle, Truck, Menu, Bell
} from "lucide-react";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import "./AdminPannel.css";

/**

  @param {...(string|false|null|undefined)} classes
  @returns {string}
 */
function cx() {
    var classes = [];
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i]) classes.push(arguments[i]);
    }
    return classes.join(" ");
}

/* ============================== MOCK DATA ============================== */

const CATEGORIES = ["اسپیکر", "هدفون", "آمپلی‌فایر", "میکروفون", "میکسر", "کابل و اتصالات"];

const initialProducts = [
    { id: 1, name: "اسپیکر مانیتورینگ استودیویی JBL 305P", category: "اسپیکر", sku: "SPK-1001", price: 12500000, stock: 14, status: "فعال", threshold: 5 },
    { id: 2, name: "هدفون استودیویی Audio-Technica ATH-M50x", category: "هدفون", sku: "HDP-2044", price: 8900000, stock: 27, status: "فعال", threshold: 8 },
    { id: 3, name: "آمپلی‌فایر لوله‌ای Marshall DSL40CR", category: "آمپلی‌فایر", sku: "AMP-3312", price: 34200000, stock: 3, status: "فعال", threshold: 4 },
    { id: 4, name: "میکروفون کاندنسر Shure SM7B", category: "میکروفون", sku: "MIC-4090", price: 21800000, stock: 9, status: "فعال", threshold: 5 },
    { id: 5, name: "میکسر دیجیتال Behringer X32", category: "میکسر", sku: "MIX-5501", price: 58900000, stock: 2, status: "فعال", threshold: 3 },
    { id: 6, name: "کابل بالانس XLR سه‌متری", category: "کابل و اتصالات", sku: "CBL-6002", price: 450000, stock: 120, status: "فعال", threshold: 20 },
    { id: 7, name: "اسپیکر پرتابل JBL Charge 5", category: "اسپیکر", sku: "SPK-1002", price: 9800000, stock: 0, status: "ناموجود", threshold: 6 },
    { id: 8, name: "هدفون بی‌سیم Sony WH-1000XM5", category: "هدفون", sku: "HDP-2045", price: 15600000, stock: 18, status: "فعال", threshold: 8 },
    { id: 9, name: "میکروفون یقه‌ای بی‌سیم Rode Wireless GO II", category: "میکروفون", sku: "MIC-4091", price: 13400000, stock: 6, status: "فعال", threshold: 5 },
    { id: 10, name: "آمپلی‌فایر هدفون FiiO K7", category: "آمپلی‌فایر", sku: "AMP-3313", price: 6700000, stock: 11, status: "فعال", threshold: 5 },
    { id: 11, name: "میکسر رومیزی Yamaha MG10XU", category: "میکسر", sku: "MIX-5502", price: 17300000, stock: 5, status: "فعال", threshold: 3 },
    { id: 12, name: "کابل TRS به TRS استریو", category: "کابل و اتصالات", sku: "CBL-6003", price: 320000, stock: 85, status: "فعال", threshold: 20 },
    { id: 13, name: "اسپیکر بلوتوثی Marshall Emberton II", category: "اسپیکر", sku: "SPK-1003", price: 7200000, stock: 22, status: "فعال", threshold: 8 },
    { id: 14, name: "هدفون گیمینگ HyperX Cloud III", category: "هدفون", sku: "HDP-2046", price: 5400000, stock: 4, status: "فعال", threshold: 6 },
    { id: 15, name: "میکروفون USB Blue Yeti", category: "میکروفون", sku: "MIC-4092", price: 8100000, stock: 16, status: "فعال", threshold: 6 },
];

const initialOrders = [
    { id: "ORD-9001", customer: "علی محمدی", date: "1404/05/20", items: 2, total: 21400000, status: "تحویل شده", payment: "پرداخت شده" },
    { id: "ORD-9002", customer: "سارا احمدی", date: "1404/05/21", items: 1, total: 8900000, status: "در حال ارسال", payment: "پرداخت شده" },
    { id: "ORD-9003", customer: "رضا کریمی", date: "1404/05/21", items: 3, total: 47300000, status: "در انتظار پردازش", payment: "در انتظار" },


    { id: "ORD-9004", customer: "مریم حسینی", date: "1404/05/22", items: 1, total: 34200000, status: "تحویل شده", payment: "پرداخت شده" },
    { id: "ORD-9005", customer: "امیر رضایی", date: "1404/05/22", items: 4, total: 15650000, status: "لغو شده", payment: "بازگشت وجه" },
    { id: "ORD-9006", customer: "نگار صادقی", date: "1404/05/23", items: 2, total: 13300000, status: "در حال ارسال", payment: "پرداخت شده" },
    { id: "ORD-9007", customer: "حسین یزدانی", date: "1404/05/23", items: 1, total: 58900000, status: "در انتظار پردازش", payment: "در انتظار" },
    { id: "ORD-9008", customer: "زهرا نوری", date: "1404/05/24", items: 2, total: 9700000, status: "تحویل شده", payment: "پرداخت شده" },
    { id: "ORD-9009", customer: "کیان مرادی", date: "1404/05/24", items: 1, total: 6700000, status: "در حال ارسال", payment: "پرداخت شده" },
    { id: "ORD-9010", customer: "الناز جعفری", date: "1404/05/25", items: 3, total: 22300000, status: "در انتظار پردازش", payment: "در انتظار" },
];

const initialCustomers = [
    { id: 1, name: "علی محمدی", phone: "0912XXXXXXX", email: "ali.m@example.com", orders: 6, spent: 89400000, joined: "1402/11/02" },
    { id: 2, name: "سارا احمدی", phone: "0935XXXXXXX", email: "sara.a@example.com", orders: 3, spent: 31200000, joined: "1403/02/14" },
    { id: 3, name: "رضا کریمی", phone: "0919XXXXXXX", email: "reza.k@example.com", orders: 9, spent: 142300000, joined: "1401/07/09" },
    { id: 4, name: "مریم حسینی", phone: "0921XXXXXXX", email: "maryam.h@example.com", orders: 2, spent: 42100000, joined: "1403/09/30" },
    { id: 5, name: "امیر رضایی", phone: "0938XXXXXXX", email: "amir.r@example.com", orders: 4, spent: 27800000, joined: "1402/04/18" },
    { id: 6, name: "نگار صادقی", phone: "0901XXXXXXX", email: "negar.s@example.com", orders: 5, spent: 63500000, joined: "1402/12/25" },
    { id: 7, name: "حسین یزدانی", phone: "0933XXXXXXX", email: "hossein.y@example.com", orders: 1, spent: 58900000, joined: "1404/03/11" },
    { id: 8, name: "زهرا نوری", phone: "0912XXXXXXX", email: "zahra.n@example.com", orders: 7, spent: 71200000, joined: "1401/10/05" },
];

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

const PIE_COLORS = ["#F59E0B", "#1F2937", "#9CA3AF", "#D97706", "#6B7280", "#E5E7EB"];

/* ============================== HELPERS ============================== */

const toman = (n) => n.toLocaleString("fa-IR") + " تومان";
const num = (n) => n.toLocaleString("fa-IR");

const statusClass = (status) => {
    switch (status) {
        case "فعال": case "تحویل شده": case "پرداخت شده": return "badge badge--success";
        case "در حال ارسال": return "badge badge--warning";
        case "در انتظار پردازش": case "در انتظار": return "badge badge--neutral";
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

/* ============================== SHARED UI ============================== */

function MeterBar({ level = 60 }) {
    var safeLevel = Math.max(0, Math.min(100, level));
    return (
        <div className="meter" role="presentation">
            <div className="meter-bar" style={{ width: safeLevel + "%" }} />
        </div>
    );
}


function StatCard({ icon: Icon, label, value, delta, positive, level }) {
    return (
        <div className="stat-card">
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
        </div>
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

/* ============================== NAV CONFIG ============================== */

const NAV = [
    { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
    { key: "products", label: "محصولات", icon: Package },
    { key: "orders", label: "سفارش‌ها", icon: ShoppingCart },
    { key: "customers", label: "مشتریان", icon: Users },
    { key: "reports", label: "گزارش فروش", icon: BarChart3 },
    { key: "settings", label: "تنظیمات", icon: Settings },
];

/* ============================== MAIN APP ============================== */

export default function () {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const [products, setProducts] = useState(initialProducts);
    const [orders, setOrders] = useState(initialOrders);
    const [customers] = useState(initialCustomers);

    const selectTab = (key) => {
        setActiveTab(key);
        setMobileNavOpen(false);
    };

    return (
        <div className="app" dir="rtl" lang="fa">
            <div className="layout">
                {mobileNavOpen && (
                    <div
                        className="sidebar-backdrop"
                        onClick={() => setMobileNavOpen(false)}
                        role="presentation"
                    />
                )}

                <aside
                    className={cx("sidebar", !sidebarOpen && "is-collapsed", mobileNavOpen && "is-mobile-open")}
                    aria-label="منوی اصلی"
                >
                    <div className="sidebar-header">
                        {sidebarOpen && (
                            <div className="sidebar-brand">
                                <div className="sidebar-logo">
                                    <Volume2 size={17} />
                                    <span className="pulse-dot" />
                                </div>
                                <div className="sidebar-titles">
                                    <p className="sidebar-title"> آوای انعکاس</p>
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
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(false)}
                            className="icon-btn sidebar-close-btn"
                            aria-label="بستن منو"
                        >
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
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(true)}
                                className="icon-btn mobile-menu-btn"
                                aria-label="باز کردن منو"
                            >
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
                        {activeTab === "dashboard" && <Dashboard orders={orders} products={products} />}
                        {activeTab === "products" && <Products products={products} setProducts={setProducts} />}
                        {activeTab === "orders" && <Orders orders={orders} setOrders={setOrders} />}
                        {activeTab === "customers" && <Customers customers={customers} />}
                        {activeTab === "reports" && <Reports />}
                        {activeTab === "settings" && <SettingsView />}
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ orders, products }) {
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === "در انتظار پردازش").length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.threshold).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;

    return (
        <div className="stack">
            <div className="stats-grid">
                <StatCard icon={DollarSign} label="درآمد کل (این ماه)" value={toman(totalRevenue)} delta="۱۲.۴٪" positive level={72} />
                <StatCard icon={ShoppingBag} label="سفارش‌های ثبت‌شده" value={num(orders.length)} delta="۸.۱٪" positive level={58} />
                <StatCard icon={Clock} label="در انتظار پردازش" value={num(pendingOrders)} delta="۳.۲٪" positive={false} level={34} />
                <StatCard icon={AlertTriangle} label="موجودی رو به اتمام" value={num(lowStock + outOfStock)} delta="۲ آیتم" positive={false} level={22} />
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
                            <Line type="monotone" dataKey="sales" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: "#F59E0B" }} />
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

function Products({ products, setProducts }) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("همه");
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ name: "", category: CATEGORIES[0], sku: "", price: "", stock: "", threshold: "5" });

    const filtered = useMemo(() => products.filter((p) => {
        const matchSearch = p.name.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === "همه" || p.category === category;
        return matchSearch && matchCat;
    }), [products, search, category]);

    const openAdd = () => { setForm({ name: "", category: CATEGORIES[0], sku: "", price: "", stock: "", threshold: "5" }); setModal({ mode: "add" }); };
    const openEdit = (p) => { setForm({ name: p.name, category: p.category, sku: p.sku, price: p.price, stock: p.stock, threshold: p.threshold }); setModal({ mode: "edit", product: p }); };


    const submit = () => {
        if (!form.name || !form.sku || !form.price) return;
        if (modal.mode === "add") {
            const newProduct = {
                id: Math.max(0, ...products.map((p) => p.id)) + 1,
                name: form.name, category: form.category, sku: form.sku,
                price: Number(form.price), stock: Number(form.stock) || 0,
                threshold: Number(form.threshold) || 5,
                status: Number(form.stock) > 0 ? "فعال" : "ناموجود",
            };
            setProducts([newProduct, ...products]);
        } else {
            setProducts(products.map((p) => (p.id === modal.product.id ? {
                ...p, name: form.name, category: form.category, sku: form.sku,
                price: Number(form.price), stock: Number(form.stock),
                threshold: Number(form.threshold), status: Number(form.stock) > 0 ? "فعال" : "ناموجود",
            } : p)));
        }
        setModal(null);
    };

    const confirmDelete = () => { setProducts(products.filter((p) => p.id !== deleteId)); setDeleteId(null); };

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
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
                                <th>محصول</th><th>دسته‌بندی</th><th>کد کالا</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
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
                                            <button
                                                type="button"
                                                onClick={() => openEdit(p)}
                                                className="icon-btn"
                                                aria-label={"ویرایش " + p.name}
                                            >
                                                <Pencil size={14} aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteId(p.id)}
                                                className="icon-btn icon-btn--danger"
                                                aria-label={"حذف " + p.name}
                                            >
                                                <Trash2 size={14} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={7} className="empty-row">محصولی با این مشخصات پیدا نشد</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal title={modal.mode === "add" ? "افزودن محصول جدید" : "ویرایش محصول"} onClose={() => setModal(null)}>
                    <Field label="نام محصول">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً اسپیکر مانیتورینگ استودیویی" />
                    </Field>
                    <div className="field-grid">
                        <Field label="دسته‌بندی">
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </Field>
                        <Field label="کد کالا (SKU)">
                            <input className="mono" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SPK-1010" />
                        </Field>
                    </div>
                    <div className="field-grid">
                        <Field label="قیمت (تومان)">
                            <input type="number" className="mono" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                        </Field>
                        <Field label="موجودی">
                            <input type="number" className="mono" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="حد هشدار موجودی کم">
                        <input type="number" className="mono" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
                    </Field>
                    <div className="modal-actions">
                        <button type="button" onClick={submit} className="btn btn-primary btn-block">
                            {modal.mode === "add" ? "افزودن محصول" : "ذخیره تغییرات"}
                        </button>
                        <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">انصراف</button>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <Modal title="حذف محصول" onClose={() => setDeleteId(null)}>
                    <p className="muted" style={{ marginBottom: 24 }}>آیا از حذف این محصول مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p>
                    <div className="modal-actions">
                        <button type="button" onClick={confirmDelete} className="btn btn-danger btn-block">حذف محصول</button>
                        <button type="button" onClick={() => setDeleteId(null)} className="btn btn-secondary">انصراف</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

/* ============================== ORDERS ============================== */

const ORDER_STATUSES = ["در انتظار پردازش", "در حال ارسال", "تحویل شده", "لغو شده"];

function Orders({ orders, setOrders }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("همه");
    const [detail, setDetail] = useState(null);

    const filtered = useMemo(() => orders.filter((o) => {
        const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.includes(search);
        const matchStatus = statusFilter === "همه" || o.status === statusFilter;
        return matchSearch && matchStatus;
    }), [orders, search, statusFilter]);

    const updateStatus = (id, status) => {
        setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
        setDetail((d) => (d && d.id === id ? { ...d, status } : d));
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
                                        <button
                                            type="button"
                                            onClick={() => setDetail(o)}
                                            className="link-btn"
                                            aria-label={"مشاهده جزئیات سفارش " + o.id}
                                        >
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
                                    onClick={() => updateStatus(detail.id, s)}
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
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => setDetail(c)}
                        className="card customer-card"
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

/* ============================== REPORTS ============================== */

function Reports() {
    const totalYear = salesByMonth.reduce((s, m) => s + m.sales, 0);
    const bestMonth = salesByMonth.reduce((a, b) => (b.sales > a.sales ? b : a));
    const topProducts = [...initialProducts].sort((a, b) => b.price * (30 - b.stock) - a.price * (30 - a.stock)).slice(0, 5);

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
                        <Bar dataKey="sales" fill="#F59E0B" radius={[6, 6, 0, 0]} />
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
    const [storeName, setStoreName] = useState(" آوای انعکاس");
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