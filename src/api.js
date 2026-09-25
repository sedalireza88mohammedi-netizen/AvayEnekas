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
  getPhone,
  getSessionKey,
} from "./auth";

export const API_BASE_URL =
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  "http://localhost:4000/api";

/* ------------------------------ helpers ------------------------------ */

function getHeaders({ auth = true, guest = false, json = true, form = false }) {
  const headers = {};
  if (json && !form) headers["Content-Type"] = "application/json";
  if (auth && getAccessToken()) headers["Authorization"] = "Bearer " + getAccessToken();
  if (guest) headers["X-Session-Key"] = getSessionKey();
  return headers;
}

/* ------------------------------ request ------------------------------ */

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
      const data = await refreshRes.json();
      if (refreshRes.ok && data.access) {
        setAuth({ access: data.access });
        res = await doFetch(retryable ? controller.signal : undefined);
      }
    } catch {
      /* سکوت — درخواست اولیه برگردانده می‌شود */
    }
  }

  if (!res.ok && res.status >= 400) {
    const detail = await res.text().catch(() => "");
    const err = new Error(detail || "خطا در ارتباط با سرور (کد " + res.status + ")");
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

/* ------------------------------ products ------------------------------ */

// تبدیل محصول بک‌اند به شکل مورد انتظار کارت‌های فروشگاه
function mapProduct(p) {
  const price = Number(p.price) || 0;
  const featured =
    p.Empressive !== undefined
      ? p.Empressive === true
      : p.is_featured !== undefined
        ? p.is_featured === true
        : true;
  return {
    id: p.id,
    title: p.title || p.name || "",
    subtitle: p.subtitle || p.category || "",
    category: p.category || "",
    sku: p.sku || "",
    price,
    oldPrice: Number(p.oldPrice) || price,
    discount: Number(p.discount) || 0,
    rating: Number(p.rating) || 0,
    Empressive: featured,
    stock: p.stock,
    image:
      (Array.isArray(p.images) && p.images.length > 0 && p.images[0].url) || p.image || "",
    images: Array.isArray(p.images) ? p.images : [],
    video: p.video || null,
  };
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.featured) query.set("featured", "true");
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
    coverImage: a.coverImage && a.coverImage.url ? a.coverImage.url : "",
    videos: Array.isArray(a.videos) ? a.videos : [],
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

// برای بک‌اند قدیمی (بدون توکن) شماره موبایل هم ارسال می‌شود
export async function getProfile() {
  const token = getAccessToken();
  const qs = token ? "" : "?phone=" + encodeURIComponent(getPhone() || "");
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
  const data = await request("/favorites");
  return Array.isArray(data) ? data.map(mapProduct) : [];
}

export async function addFavorite(productId) {
  return request("/favorites/" + productId, { method: "POST" });
}

export async function removeFavorite(productId) {
  return request("/favorites/" + productId, { method: "DELETE" });
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