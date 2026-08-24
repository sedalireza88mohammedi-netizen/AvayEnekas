
/**
 * ================================================================
 *  API SERVICE LAYER — تنها فایلی که باید برای وصل شدن به بک‌اند
 *  واقعی تغییرش بدی. کامپوننت‌های پنل ادمین هیچ‌جا مستقیم fetch
 *  نمی‌زنن؛ همه از توابع همین فایل استفاده می‌کنن.
 * ================================================================
 *
 * راه‌اندازی سریع:
 *   1) API_BASE_URL رو به آدرس سرور خودت تنظیم کن (پایین همین فایل)
 *   2) USE_MOCK_DATA رو false کن
 *   3) اگه اسم/ساختار مسیرهای بک‌اندت فرق داره، فقط همین جا اصلاحش کن
 *
 * قرارداد Endpoint های مورد انتظار از بک‌اند:
 * ------------------------------------------------------------
 *   GET    /products                → Product[]
 *   POST   /products                → Product        (multipart/form-data)
 *   PUT    /products/:id            → Product        (multipart/form-data)
 *   DELETE /products/:id            → { success: true }
 *
 *   GET    /orders                  → Order[]
 *   PATCH  /orders/:id/status       → Order           body: { status }
 *
 *   GET    /customers               → Customer[]
 *
 *   GET    /articles                → Article[]
 *   POST   /articles                → Article        (multipart/form-data)
 *   PUT    /articles/:id            → Article        (multipart/form-data)
 *   DELETE /articles/:id            → { success: true }
 * ------------------------------------------------------------
 *
 * فرم‌دیتای ارسالی هنگام ساخت/ویرایش محصول شامل این فیلدهاست:
 *   name, category, sku, price, stock, threshold,
 *   images        → یک یا چند فایل عکس (کلید تکراری "images")
 *   video         → حداکثر یک فایل ویدیو (کلید "video")
 *   existingImageUrls → JSON آرایه‌ی آدرس عکس‌هایی که هنگام ویرایش
 *                        باید نگه داشته بشن (عکس‌های حذف‌نشده‌ی قبلی)
 *   existingVideoUrl  → آدرس ویدیوی قبلی، اگه عوض نشده باشه
 *
 * بک‌اند باید فایل‌های آپلودی رو ذخیره کنه و در پاسخ، آبجکت محصول
 * را با آرایه‌ی images (هرکدام { id, url }) و video ({ url }) برگردونه.
 *
 * فرم‌دیتای ارسالی هنگام ساخت/ویرایش مقاله شامل این فیلدهاست:
 *   title, excerpt, content, category, author, publishedAt, status,
 *   coverImage         → حداکثر یک فایل عکس شاخص (کلید "coverImage")
 *   videos             → یک یا چند فایل ویدیوی داخل مقاله (کلید تکراری "videos")
 *   existingCoverImageUrl → آدرس عکس شاخص قبلی، اگه عوض نشده باشه
 *   existingVideoUrls  → JSON آرایه‌ی آدرس ویدیوهایی که هنگام ویرایش
 *                         باید نگه داشته بشن
 *
 * بک‌اند باید در پاسخ، آبجکت مقاله را با coverImage ({ url }) و
 * videos (هرکدام { id, url }) برگردونه — این‌ها همون فیلم‌هایی هستن
 * که در کامپوننت Home / بخش مقالات سایت نمایش داده می‌شن.
 * ================================================================
 */

// آدرس پایه‌ی API — این رو به سرور خودت تغییر بده
// (اگه با Vite کار می‌کنی می‌تونی این خط رو با
//  import.meta.env.VITE_API_BASE_URL جایگزین کنی)
export const API_BASE_URL =
  (typeof window !== "undefined" && window.__ADMIN_API_BASE_URL__) ||
  "http://localhost:4000/api";

// وقتی بک‌اند واقعی آماده شد این رو false کن تا همه‌ی توابع
// پایین به‌جای دیتای آزمایشی، واقعاً به API_BASE_URL درخواست بزنن
export const USE_MOCK_DATA = true;

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const res = await fetch(API_BASE_URL + path, options);
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || ("خطا در ارتباط با سرور (کد " + res.status + ")"));
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

function buildProductFormData(payload) {
  const formData = new FormData();


formData.append("name", payload.name);
  formData.append("category", payload.category);
  formData.append("sku", payload.sku);
  formData.append("price", payload.price);
  formData.append("stock", payload.stock);
  formData.append("threshold", payload.threshold);
  formData.append("existingImageUrls", JSON.stringify(payload.keepImageUrls || []));
  (payload.imageFiles || []).forEach((file) => formData.append("images", file));
  if (payload.videoFile) formData.append("video", payload.videoFile);
  if (payload.keepVideoUrl) formData.append("existingVideoUrl", payload.keepVideoUrl);
  return formData;
}

function buildArticleFormData(payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("excerpt", payload.excerpt || "");
  formData.append("content", payload.content || "");
  formData.append("category", payload.category || "");
  formData.append("author", payload.author || "");
  formData.append("publishedAt", payload.publishedAt || "");
  formData.append("status", payload.status);
  if (payload.coverImageFile) formData.append("coverImage", payload.coverImageFile);
  if (payload.keepCoverImageUrl) formData.append("existingCoverImageUrl", payload.keepCoverImageUrl);
  formData.append("existingVideoUrls", JSON.stringify(payload.keepVideoUrls || []));
  (payload.videoFiles || []).forEach((file) => formData.append("videos", file));
  return formData;
}

/* ============================== MOCK DATA ============================== */

const CATEGORIES = ["اسپیکر", "هدفون", "آمپلی‌فایر", "میکروفون", "میکسر", "کابل و اتصالات"];

let mockProducts = [
  { id: 1, name: "اسپیکر مانیتورینگ استودیویی JBL 305P", category: "اسپیکر", sku: "SPK-1001", price: 12500000, stock: 14, status: "فعال", threshold: 5, images: [], video: null },
  { id: 2, name: "هدفون استودیویی Audio-Technica ATH-M50x", category: "هدفون", sku: "HDP-2044", price: 8900000, stock: 27, status: "فعال", threshold: 8, images: [], video: null },
  { id: 3, name: "آمپلی‌فایر لوله‌ای Marshall DSL40CR", category: "آمپلی‌فایر", sku: "AMP-3312", price: 34200000, stock: 3, status: "فعال", threshold: 4, images: [], video: null },
  { id: 4, name: "میکروفون کاندنسر Shure SM7B", category: "میکروفون", sku: "MIC-4090", price: 21800000, stock: 9, status: "فعال", threshold: 5, images: [], video: null },
  { id: 5, name: "میکسر دیجیتال Behringer X32", category: "میکسر", sku: "MIX-5501", price: 58900000, stock: 2, status: "فعال", threshold: 3, images: [], video: null },
  { id: 6, name: "کابل بالانس XLR سه‌متری", category: "کابل و اتصالات", sku: "CBL-6002", price: 450000, stock: 120, status: "فعال", threshold: 20, images: [], video: null },
  { id: 7, name: "اسپیکر پرتابل JBL Charge 5", category: "اسپیکر", sku: "SPK-1002", price: 9800000, stock: 0, status: "ناموجود", threshold: 6, images: [], video: null },
  { id: 8, name: "هدفون بی‌سیم Sony WH-1000XM5", category: "هدفون", sku: "HDP-2045", price: 15600000, stock: 18, status: "فعال", threshold: 8, images: [], video: null },
  { id: 9, name: "میکروفون یقه‌ای بی‌سیم Rode Wireless GO II", category: "میکروفون", sku: "MIC-4091", price: 13400000, stock: 6, status: "فعال", threshold: 5, images: [], video: null },
  { id: 10, name: "آمپلی‌فایر هدفون FiiO K7", category: "آمپلی‌فایر", sku: "AMP-3313", price: 6700000, stock: 11, status: "فعال", threshold: 5, images: [], video: null },
  { id: 11, name: "میکسر رومیزی Yamaha MG10XU", category: "میکسر", sku: "MIX-5502", price: 17300000, stock: 5, status: "فعال", threshold: 3, images: [], video: null },
  { id: 12, name: "کابل TRS به TRS استریو", category: "کابل و اتصالات", sku: "CBL-6003", price: 320000, stock: 85, status: "فعال", threshold: 20, images: [], video: null },
  { id: 13, name: "اسپیکر بلوتوثی Marshall Emberton II", category: "اسپیکر", sku: "SPK-1003", price: 7200000, stock: 22, status: "فعال", threshold: 8, images: [], video: null },


{ id: 14, name: "هدفون گیمینگ HyperX Cloud III", category: "هدفون", sku: "HDP-2046", price: 5400000, stock: 4, status: "فعال", threshold: 6, images: [], video: null },
  { id: 15, name: "میکروفون USB Blue Yeti", category: "میکروفون", sku: "MIC-4092", price: 8100000, stock: 16, status: "فعال", threshold: 6, images: [], video: null },
];

let mockOrders = [
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

const mockCustomers = [
  { id: 1, name: "علی محمدی", phone: "0912XXXXXXX", email: "ali.m@example.com", orders: 6, spent: 89400000, joined: "1402/11/02" },
  { id: 2, name: "سارا احمدی", phone: "0935XXXXXXX", email: "sara.a@example.com", orders: 3, spent: 31200000, joined: "1403/02/14" },
  { id: 3, name: "رضا کریمی", phone: "0919XXXXXXX", email: "reza.k@example.com", orders: 9, spent: 142300000, joined: "1401/07/09" },
  { id: 4, name: "مریم حسینی", phone: "0921XXXXXXX", email: "maryam.h@example.com", orders: 2, spent: 42100000, joined: "1403/09/30" },
  { id: 5, name: "امیر رضایی", phone: "0938XXXXXXX", email: "amir.r@example.com", orders: 4, spent: 27800000, joined: "1402/04/18" },
  { id: 6, name: "نگار صادقی", phone: "0901XXXXXXX", email: "negar.s@example.com", orders: 5, spent: 63500000, joined: "1402/12/25" },
  { id: 7, name: "حسین یزدانی", phone: "0933XXXXXXX", email: "hossein.y@example.com", orders: 1, spent: 58900000, joined: "1404/03/11" },
  { id: 8, name: "زهرا نوری", phone: "0912XXXXXXX", email: "zahra.n@example.com", orders: 7, spent: 71200000, joined: "1401/10/05" },
];

let mockArticles = [
  {
    id: 1,
    title: "چطور اسپیکر مانیتورینگ مناسب استودیوی خانگی انتخاب کنیم؟",
    excerpt: "راهنمای انتخاب اسپیکر مانیتورینگ برای فضاهای کوچک و استودیوی خانگی.",
    content: "",
    category: "راهنمای خرید",
    author: "تیم آوای انعکاس",
    publishedAt: "1404/04/12",
    status: "منتشر شده",
    coverImage: null,
    videos: [],
  },
  {
    id: 2,
    title: "مقایسه میکروفون‌های کاندنسر و دینامیک",
    excerpt: "تفاوت‌های کاربردی این دو نوع میکروفون در ضبط صدا و پادکست.",
    content: "",
    category: "آموزشی",
    author: "تیم آوای انعکاس",
    publishedAt: "1404/05/02",
    status: "پیش‌نویس",
    coverImage: null,
    videos: [],
  },
];

export const CATEGORY_LIST = CATEGORIES;

/* ============================== PRODUCTS ============================== */

export async function fetchProducts() {
  if (USE_MOCK_DATA) {
    await delay(400);
    return mockProducts.map((p) => ({ ...p }));
  }
  return request("/products");
}


export async function createProduct(payload) {
  if (USE_MOCK_DATA) {
    await delay(400);
    const newProduct = {
      id: Date.now(),
      name: payload.name,
      category: payload.category,
      sku: payload.sku,
      price: Number(payload.price),
      stock: Number(payload.stock) || 0,
      threshold: Number(payload.threshold) || 5,
      status: Number(payload.stock) > 0 ? "فعال" : "ناموجود",
      images: (payload.imageFiles || []).map((file) => ({ id: uid(), url: URL.createObjectURL(file), name: file.name })),
      video: payload.videoFile ? { url: URL.createObjectURL(payload.videoFile), name: payload.videoFile.name } : null,
    };
    mockProducts = [newProduct, ...mockProducts];
    return newProduct;
  }
  return request("/products", { method: "POST", body: buildProductFormData(payload) });
}

export async function updateProduct(id, payload) {
  if (USE_MOCK_DATA) {
    await delay(400);
    const updated = {
      id,
      name: payload.name,
      category: payload.category,
      sku: payload.sku,
      price: Number(payload.price),
      stock: Number(payload.stock),
      threshold: Number(payload.threshold),
      status: Number(payload.stock) > 0 ? "فعال" : "ناموجود",
      images: [
        ...(payload.keepImageUrls || []).map((url) => ({ id: uid(), url })),
        ...(payload.imageFiles || []).map((file) => ({ id: uid(), url: URL.createObjectURL(file), name: file.name })),
      ],
      video: payload.videoFile
        ? { url: URL.createObjectURL(payload.videoFile), name: payload.videoFile.name }
        : payload.keepVideoUrl
        ? { url: payload.keepVideoUrl }
        : null,
    };
    mockProducts = mockProducts.map((p) => (p.id === id ? updated : p));
    return updated;
  }
  return request("/products/" + id, { method: "PUT", body: buildProductFormData(payload) });
}

export async function deleteProduct(id) {
  if (USE_MOCK_DATA) {
    await delay(300);
    mockProducts = mockProducts.filter((p) => p.id !== id);
    return { success: true };
  }
  return request("/products/" + id, { method: "DELETE" });
}

/* ============================== ORDERS ============================== */

export async function fetchOrders() {
  if (USE_MOCK_DATA) {
    await delay(400);
    return mockOrders.map((o) => ({ ...o }));
  }
  return request("/orders");
}

export async function updateOrderStatus(id, status) {
  if (USE_MOCK_DATA) {
    await delay(300);
    mockOrders = mockOrders.map((o) => (o.id === id ? { ...o, status } : o));
    return mockOrders.find((o) => o.id === id);
  }
  return request("/orders/" + id + "/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/* ============================== CUSTOMERS ============================== */

export async function fetchCustomers() {
  if (USE_MOCK_DATA) {
    await delay(400);
    return mockCustomers.map((c) => ({ ...c }));
  }
  return request("/customers");
}

/* ============================== ARTICLES ============================== */
/* این‌ها مقالات و ویدیوهای همون بخش مقالاتی هستن که در کامپوننت      */
/* Home سایت نمایش داده می‌شن — از پنل ادمین مدیریت می‌شن.            */

export async function fetchArticles() {
  if (USE_MOCK_DATA) {
    await delay(400);
    return mockArticles.map((a) => ({ ...a }));
  }
  return request("/articles");
}

export async function createArticle(payload) {
  if (USE_MOCK_DATA) {
    await delay(400);
    const newArticle = {
      id: Date.now(),
      title: payload.title,
      excerpt: payload.excerpt || "",
      content: payload.content || "",
      category: payload.category || "",
      author: payload.author || "",
      publishedAt: payload.publishedAt || "",
      status: payload.status,
      coverImage: payload.coverImageFile


? { url: URL.createObjectURL(payload.coverImageFile), name: payload.coverImageFile.name }
        : null,
      videos: (payload.videoFiles || []).map((file) => ({ id: uid(), url: URL.createObjectURL(file), name: file.name })),
    };
    mockArticles = [newArticle, ...mockArticles];
    return newArticle;
  }
  return request("/articles", { method: "POST", body: buildArticleFormData(payload) });
}

export async function updateArticle(id, payload) {
  if (USE_MOCK_DATA) {
    await delay(400);
    const updated = {
      id,
      title: payload.title,
      excerpt: payload.excerpt || "",
      content: payload.content || "",
      category: payload.category || "",
      author: payload.author || "",
      publishedAt: payload.publishedAt || "",
      status: payload.status,
      coverImage: payload.coverImageFile
        ? { url: URL.createObjectURL(payload.coverImageFile), name: payload.coverImageFile.name }
        : payload.keepCoverImageUrl
        ? { url: payload.keepCoverImageUrl }
        : null,
      videos: [
        ...(payload.keepVideoUrls || []).map((url) => ({ id: uid(), url })),
        ...(payload.videoFiles || []).map((file) => ({ id: uid(), url: URL.createObjectURL(file), name: file.name })),
      ],
    };
    mockArticles = mockArticles.map((a) => (a.id === id ? updated : a));
    return updated;
  }
  return request("/articles/" + id, { method: "PUT", body: buildArticleFormData(payload) });
}

export async function deleteArticle(id) {
  if (USE_MOCK_DATA) {
    await delay(300);
    mockArticles = mockArticles.filter((a) => a.id !== id);
    return { success: true };
  }
  return request("/articles/" + id, { method: "DELETE" });
}