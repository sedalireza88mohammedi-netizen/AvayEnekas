/**
 * ================================================================
 *  لایه اتصال فروشگاه به بک‌اند Django  (پورت 4000)
 * ================================================================
 *  همه‌ی درخواست‌های فرانت (فروشگاه + کاربر) از همین فایل می‌رود.
 *  - محصولات، دسته‌بندی‌ها و مقالات
 *  - احراز هویت با OTP (ارسال کد + تایید) و توکن JWT
 *  - پروفایل، سفارشات، علاقه‌مندی‌ها و آدرس‌ها
 *  - سبد خرید (لاگین‌شده با توکن / مهمان با X-Session-Key)
 *
 *  سازگار با نسخه‌ی قدیمی و جدید بک‌اند:
 *  اگر بک‌اند توکن یا اندپوینت نداشته باشد، به شیوه‌ی امنِ
 *  جایگزین (localStorage / پارامتر phone) پایین می‌آید.
 * ================================================================
 */
import {
  getAccessToken,
  getRefreshToken,
  setAuth,
  clearAuth,
  getPhone,
  getSessionKey,
} from "./auth";

export const API_BASE_URL =
  (typeof window !== "undefined" && window.__API_BASE_URL__) || "/api";

/**
 * تبدیل آدرس رسانه به مسیر هم‌مبدأ.
 * بک‌اند آدرس مطلق (مثلاً http://localhost:4000/media/...) برمی‌گرداند که
 * در پروداکشن یا روی دامنه دیگر تصاویر را می‌شکند؛ این تابع لوکال/بی‌هم‌مبدأ را
 * به مسیر نسبی تبدیل می‌کند تا همیشه از همان دامنه‌ای که سایت روی آن باز شده سرو شود.
 */
export function mediaUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  if (/^data:/i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.pathname) return parsed.pathname + parsed.search;
    return raw;
  } catch {
    return raw;
  }
}

/* ------------------------------ helpers ------------------------------ */

function getHeaders({ auth = true, guest = false, json = true, form = false }) {
  const headers = {};
  if (json && !form) headers["Content-Type"] = "application/json";
  if (auth && getAccessToken()) headers["Authorization"] = "Bearer " + getAccessToken();
  if (guest) headers["X-Session-Key"] = getSessionKey();
  return headers;
}

/* ------------------------------ request ------------------------------ */

/** پیام‌هایی که یعنی حساب کاربری توسط ادمین مسدود شده است. */
const BLOCKED_MARKERS = ["مسدود شده", "مسدودسازی", "user_inactive"];

function isBlockedError(status, message) {
  if (!message) return false;
  if (status !== 401 && status !== 403) return false;
  return BLOCKED_MARKERS.some((marker) => message.includes(marker));
}

async function request(path, options = {}) {
  const { method = "GET", body, auth = true, guest = false, form = false } = options;
  const controller = new AbortController();
  const retryable = typeof AbortController === "function";

  const doFetch = (signal) =>
    fetch(API_BASE_URL + path, {
      method,
      headers: getHeaders({ auth, guest, form }),
      body: form ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

  let res;
  const doFetchOnce = () => doFetch(retryable ? controller.signal : undefined);
  try {
    res = await doFetchOnce();
  } catch (networkErr) {
    if (networkErr && networkErr.name === "AbortError") throw networkErr;
    if (method === "GET" || method === "HEAD") {
      // کانکشن keep-alive کهنه ممکن است بسته شود؛ یک بار با سوکت تازه دوباره تلاش می‌کنیم
      await new Promise((r) => setTimeout(r, 400));
      try {
        res = await doFetchOnce();
      } catch {
        throw new Error("خطا در ارتباط با سرور؛ از روشن بودن بکاند مطمئن شوید");
      }
    } else {
      throw new Error("خطا در ارتباط با سرور؛ از روشن بودن بکاند مطمئن شوید");
    }
  }

  // در صورت منقضی شدن توکن، یک بار ریفرش و تلاش دوباره
  if (res.status === 401 && getRefreshToken() && !options._retried) {
    try {
      const refreshRes = await fetch(API_BASE_URL + "/auth/token/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: getRefreshToken() }),
      });
      const data = await refreshRes.json().catch(() => null);
      if (!refreshRes.ok && isBlockedError(refreshRes.status, data && (data.error || data.detail))) {
        clearAuth();
      } else if (refreshRes.ok && data && data.access) {
        setAuth({ access: data.access });
        res = await doFetch(retryable ? controller.signal : undefined);
      }
    } catch {
      /* سکوت — درخواست اولیه برگردانده می‌شود */
    }
  }

  if (!res.ok && res.status >= 400) {
    const raw = await res.text().catch(() => "");
    let detail = "";
    try {
      const parsed = JSON.parse(raw);
      detail = parsed.error || parsed.detail || "";
    } catch {
      /* صفحه‌ی خطای HTML یا متن خام — نادیده گرفته می‌شود */
    }
    const err = new Error(detail || "خطا در برقراری ارتباط با سرور (کد " + res.status + ")");
    err.status = res.status;
    // حساب مسدود: نشست کاربر بسته می‌شود تا با همان شماره دوباره وارد نشود
    if (getAccessToken() && isBlockedError(res.status, detail)) {
      clearAuth();
      err.blocked = true;
    }
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

/* ------------------------------ products ------------------------------ */

/**
 * بخش‌های ویژه‌ی که ادمین محصولات را دستی به آن‌ها اضافه می‌کند.
 * key: کلید مورد استفاده در فرانت | label: عنوان فارسی | flag: فیلد بک‌اند
 * query: نام پارامتر فیلتر در API
 */
export const PRODUCT_SECTIONS = [
  { key: "amazing", label: "شگفت‌انگیزها", flag: "Empressive", query: "featured" },
  { key: "popular", label: "محبوب‌ترین‌ها", flag: "is_popular", query: "popular" },
  { key: "trending", label: "ترند‌ترین‌ها", flag: "is_trending", query: "trending" },
  { key: "best_seller", label: "پرفروش‌ترین‌ها", flag: "is_best_seller", query: "best_seller" },
];

export const PRODUCT_SECTION_MAP = Object.fromEntries(
  PRODUCT_SECTIONS.map((s) => [s.key, s]),
);

// تبدیل محصول بک‌اند به شکل مورد انتظار کارت‌های فروشگاه
function mapProduct(p) {
  const price = Number(p.price) || 0;
  const flag = (name) => p[name] === true;
  const featured = p.Empressive !== undefined ? p.Empressive === true : flag("is_featured");
  return {
    id: p.id,
    title: p.title || p.name || "",
    subtitle: p.subtitle || p.category || "",
    description: p.description || "",
    category: p.category || "",
    sku: p.sku || "",
    price,
    oldPrice: Number(p.oldPrice) || price,
    discount: Number(p.discount) || 0,
    rating: Number(p.rating) || 0,
    Empressive: featured,
    is_popular: flag("is_popular"),
    is_trending: flag("is_trending"),
    is_best_seller: flag("is_best_seller"),
    stock: p.stock,
    image:
      mediaUrl(
        (Array.isArray(p.images) && p.images.length > 0 && p.images[0].url) || p.image || "",
      ),
    images: (Array.isArray(p.images) ? p.images : []).map((img) =>
      img && typeof img === "object" ? { ...img, url: mediaUrl(img.url) } : img,
    ),
    video: p.video && p.video.url ? { ...p.video, url: mediaUrl(p.video.url) } : p.video || null,
  };
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.featured) query.set("featured", "true");
  if (params.popular) query.set("popular", "true");
  if (params.trending) query.set("trending", "true");
  if (params.best_seller || params.bestSeller) query.set("best_seller", "true");
  // فیلتر یکپارچه‌ی بخش ویژه (مثلاً { section: "trending" })
  if (params.section && PRODUCT_SECTION_MAP[params.section]) {
    query.set(PRODUCT_SECTION_MAP[params.section].query, "true");
  }
  if (params.brand) query.set("brand", params.brand);
  if (params.minPrice != null && params.minPrice !== "") query.set("min_price", String(params.minPrice));
  if (params.maxPrice != null && params.maxPrice !== "") query.set("max_price", String(params.maxPrice));
  if (params.sort) query.set("sort", params.sort);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const data = await request("/products" + (qs ? "?" + qs : ""));
  return Array.isArray(data) ? data.map(mapProduct) : [];
}

export async function fetchProduct(id) {
  const data = await request("/products/" + id);
  return data ? mapProduct(data) : null;
}

export async function fetchCategories() {
  const data = await request("/categories");
  return Array.isArray(data) ? data : [];
}

/* ------------------------------ search suggestions ------------------------------ */

export async function fetchPopularSearches(limit = 10) {
  const data = await request("/popular-searches?limit=" + limit);
  return Array.isArray(data) ? data : [];
}

export async function recordSearch(term) {
  if (!term) return null;
  return request("/search/record", { method: "POST", body: { term } });
}

/* ------------------------------ reviews ------------------------------ */

export async function fetchProductReviews(productId) {
  const data = await request("/products/" + productId + "/reviews");
  return data || { count: 0, results: [] };
}

export async function addProductReview(productId, payload) {
  return request("/products/" + productId + "/reviews", { method: "POST", body: payload });
}

/* ------------------------------ articles ------------------------------ */

function mapArticle(a) {
  return {
    id: a.id,
    title: a.title || "",
    excerpt: a.excerpt || "",
    content: a.content || "",
    category: a.category || "",
    author: a.author || "",
    publishedAt: a.publishedAt || "",
    status: a.status || "",
    coverImage: mediaUrl(a.coverImage && a.coverImage.url ? a.coverImage.url : ""),
    videos: (Array.isArray(a.videos) ? a.videos : []).map((v) =>
      v && typeof v === "object" ? { ...v, url: mediaUrl(v.url) } : v,
    ),
  };
}

export async function fetchArticles() {
  const data = await request("/articles");
  return Array.isArray(data) ? data.map(mapArticle) : [];
}

export async function fetchArticle(id) {
  const data = await request("/articles/" + id);
  return data ? mapArticle(data) : null;
}

/* ------------------------------ auth (OTP + JWT) ------------------------------ */

export async function sendOtpCode(phone) {
  return request("/auth/send-code", { method: "POST", auth: false, body: { phone } });
}

export async function verifyOtpCode(phone, code, sessionKey) {
  const body = { phone, code };
  if (sessionKey) body.session_key = sessionKey;
  const res = await request("/auth/verify-code", { method: "POST", auth: false, body });

  // بک‌اند جدید: توکن JWT + پروفایل
  if (res && res.tokens) {
    setAuth({
      access: res.tokens.access,
      refresh: res.tokens.refresh,
      phone: res.customer && res.customer.phone ? res.customer.phone : phone,
    });
    return res;
  }
  // بک‌اند قدیمی: فقط پروفایل (بدون توکن) → حالت توسعه
  if (res && res.success) {
    setAuth({ phone: res.customer && res.customer.phone ? res.customer.phone : phone });
    return res;
  }
  return res;
}

/* ------------------------------ profile / orders / favorites / addresses ------------------------------ */

// بک‌اند قدیمی (بدون توکن) شماره موبایل هم ارسال می‌شود
export async function getProfile() {
  const qs = "?phone=" + encodeURIComponent(getPhone() || "");
  const data = await request("/me" + qs);
  return data || {};
}

export async function updateProfile(payload) {
  return request("/me", { method: "PUT", body: payload });
}

export async function getMyOrders() {
  const data = await request("/me/orders");
  return (
    data || {
      InProgress: [],
      Delivered: [],
      Returned: [],
      Canceled: [],
    }
  );
}

export async function getFavorites() {
  const qs = "?phone=" + encodeURIComponent(getPhone() || "");
  const data = await request("/favorites" + qs);
  return Array.isArray(data) ? data.map(mapProduct) : [];
}

export async function addFavorite(productId) {
  const qs = "?phone=" + encodeURIComponent(getPhone() || "");
  return request("/favorites/" + productId + qs, { method: "POST" });
}

export async function removeFavorite(productId) {
  const qs = "?phone=" + encodeURIComponent(getPhone() || "");
  return request("/favorites/" + productId + qs, { method: "DELETE" });
}

export async function fetchHomeSliders() {
  const data = await request("/home/sliders?active=1");
  return Array.isArray(data) ? data : [];
}

export async function fetchHomeCategorySlides() {
  const data = await request("/home/category-slides?active=1");
  return Array.isArray(data) ? data : [];
}

export async function fetchSectionSliders(section) {
  const query = "/section-sliders" + (section ? "?section=" + encodeURIComponent(section) : "");
  const data = await request(query);
  return Array.isArray(data) ? data : [];
}

// ریل‌های شگفت‌انگیز/محبوب از عضویت اسلایدر می‌آیند، نه از پرچم‌های محصول.
export const SLIDER_BACKED_SECTIONS = ["amazing", "popular"];

export async function fetchSectionSliderProducts(section, limit) {
  if (!SLIDER_BACKED_SECTIONS.includes(section)) {
    const data = await fetchProducts({ section, limit });
    return Array.isArray(data) ? data : [];
  }
  const rows = await fetchSectionSliders(section);
  const products = rows.map((row) => row.product).filter(Boolean).map(mapProduct);
  return limit ? products.slice(0, limit) : products;
}

export async function getAddresses() {
  const data = await request("/addresses");
  return Array.isArray(data) ? data : [];
}

export async function addAddress(payload) {
  return request("/addresses", { method: "POST", body: payload, guest: true });
}

export async function setDefaultAddress(id) {
  return request("/addresses/" + id, { method: "PATCH" });
}

export async function deleteAddress(id) {
  return request("/addresses/" + id, { method: "DELETE" });
}

/* ------------------------------ cart ------------------------------ */

export async function getCart() {
  try {
    return await request("/cart", { guest: true });
  } catch (err) {
    if (err.status === 404 || err.status === 405) return readLocalCart();
    throw err;
  }
}

export async function addCartItem(productId, quantity = 1, price, title, image) {
  try {
    return await request("/cart/items", {
      method: "POST",
      guest: true,
      body: { product_id: productId, quantity },
    });
  } catch (err) {
    if (err.status === 404 || err.status === 405) {
      return addLocalItem({ product_id: productId, quantity, price, title, image });
    }
    throw err;
  }
}

export async function updateCartItem(productId, quantity) {
  try {
    return await request("/cart/items/" + productId, {
      method: "PATCH",
      guest: true,
      body: { quantity },
    });
  } catch (err) {
    if (err.status === 404 || err.status === 405) return setLocalQuantity(productId, quantity);
    throw err;
  }
}

export async function removeCartItem(productId) {
  try {
    return await request("/cart/items/" + productId, { method: "DELETE", guest: true });
  } catch (err) {
    if (err.status === 404 || err.status === 405) return removeLocalItem(productId);
    throw err;
  }
}

export async function checkoutCart(payload) {
  return request("/cart/checkout", { method: "POST", guest: true, body: payload });
}

/* ------------------------------ messages (پیامک از ادمین) ------------------------------ */

export async function getMyMessages() {
  const phone = getPhone();
  return request("/messages" + (phone ? `?phone=${encodeURIComponent(phone)}` : ""), {
    auth: true,
    guest: true,
  });
}

export async function markMessageRead(id) {
  return request("/messages/" + id + "/read", { method: "PATCH", auth: true, guest: true, body: { read: true } });
}

/* ------------------------------ local cart fallback ------------------------------ */

const LOCAL_CART_KEY = "avay_local_cart";

function readLocalCartRaw() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

function readLocalCart() {
  const items = readLocalCartRaw();
  return {
    id: null,
    total_items: items.reduce((s, i) => s + i.quantity, 0),
    total_price: items.reduce((s, i) => s + i.quantity * (Number(i.price) || 0), 0),
    items: items.map((i) => ({
      id: i.product_id,
      product_id: i.product_id,
      name: i.title,
      price: Number(i.price) || 0,
      quantity: i.quantity,
      subtotal: i.quantity * (Number(i.price) || 0),
      image: i.image,
      stock: i.stock,
    })),
    isLocal: true,
  };
}

function addLocalItem({ product_id, quantity, price, title, image, stock }) {
  const items = readLocalCartRaw();
  const found = items.find((i) => i.product_id === product_id);
  if (found) found.quantity += quantity;
  else items.push({ product_id, quantity, price, title, image, stock });
  writeLocalCart(items);
  return readLocalCart();
}

function setLocalQuantity(productId, quantity) {
  const items = readLocalCartRaw();
  if (quantity <= 0) return removeLocalItem(productId);
  const found = items.find((i) => i.product_id === productId);
  if (found) found.quantity = quantity;
  writeLocalCart(items);
  return readLocalCart();
}

function removeLocalItem(productId) {
  writeLocalCart(readLocalCartRaw().filter((i) => i.product_id !== productId));
  return readLocalCart();
}