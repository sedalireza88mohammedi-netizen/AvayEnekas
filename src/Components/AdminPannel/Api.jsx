/**
 * ================================================================
 *  API SERVICE LAYER — اتصال مستقیم پنل ادمین به بک‌اند واقعی
 *  (هیچ دیتای فیک / mock در اینجا وجود ندارد)
 * ================================================================
 *
 * Endpoint های مورد استفاده:
 *   GET    /products                → Product[]
 *   POST   /products                → Product        (multipart/form-data)
 *   PUT    /products/:id            → Product        (multipart/form-data)
 *   DELETE /products/:id            → { success: true }
 *
 *   GET    /orders                  → Order[]
 *   PATCH  /orders/:id/status       → Order           body: { status }
 *
 *   GET    /customers               → Customer[]
 *   PATCH  /customers/:id/block     → Customer        body: { is_blocked }
 *   DELETE /customers/:id           → { success, kept_orders }
 *
 *   GET    /admin/popular-searches       → PopularSearch[]
 *   POST   /admin/popular-searches       → PopularSearch  body: { term, order, active }
 *   PUT    /admin/popular-searches/:id   → PopularSearch
 *   DELETE /admin/popular-searches/:id   → { success }
 *
 *   GET    /articles                → Article[]
 *   POST   /articles                → Article        (multipart/form-data)
 *   PUT    /articles/:id            → Article        (multipart/form-data)
 *   DELETE /articles/:id            → { success: true }
 *
 *   GET    /admin/messages/list     → Message[]
 *   POST   /admin/messages/send     → { success, created, phones }
 * ================================================================
 */

import { API_BASE_URL, mediaUrl } from "../../api";
import { getAccessToken } from "../../auth";

export { API_BASE_URL, mediaUrl };

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** تبدیل خطا به متن کاربرپسند فارسی؛ خطاهای خام انگلیسی هرگز به UI نمی‌رسند */
export function faError(err, fallback = "خطا در برقراری ارتباط با سرور") {
  const msg = err && err.message ? String(err.message) : "";
  if (!msg) return fallback;
  if (/[آ-ی]/.test(msg)) return msg;
  return fallback;
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  let res;

  // پنل ادمین با حساب مدیر (JWT) احراز هویت می‌شود؛ بک‌اند برای
  // عملیات مدیریتی توکن معتبر می‌خواهد.
  const token = getAccessToken();
  if (token) {
    options.headers = { ...(options.headers || {}), Authorization: "Bearer " + token };
  }

  const doFetchOnce = () => fetch(API_BASE_URL + path, options);
  try {
    res = await doFetchOnce();
  } catch {
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
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let detail = "";
    try {
      const parsed = JSON.parse(raw);
      detail = parsed.error || parsed.detail || "";
    } catch {
      /* صفحه‌ی خطای HTML یا متن خام — نادیده گرفته می‌شود */
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "برای ورود به پنل مدیریت ابتدا با حساب مدیر وارد شوید (صفحه ورود سایت)",
      );
    }
    throw new Error(detail || "خطا در برقراری ارتباط با سرور (کد " + res.status + ")");
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

export const CATEGORY_LIST = ["اسپیکر", "هدفون", "آمپلی فایر", "میکروفون", "میکسر", "کابل و اتصالات"];

function buildProductFormData(payload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("category", payload.category);
  formData.append("sku", payload.sku);
  formData.append("price", payload.price);
  formData.append("discountPercent", payload.discountPercent != null ? payload.discountPercent : "");
  formData.append("stock", payload.stock);
  formData.append("threshold", payload.threshold);
  formData.append("rating", payload.rating != null ? payload.rating : "");
  formData.append("description", payload.description || "");
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

/* ============================== PRODUCTS ============================== */

export async function fetchProducts() {
  const res = await request("/products?all=true");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createProduct(payload) {
  return request("/products", { method: "POST", body: buildProductFormData(payload) });
}

export async function updateProduct(id, payload) {
  return request("/products/" + id, { method: "PUT", body: buildProductFormData(payload) });
}

export async function deleteProduct(id) {
  return request("/products/" + id, { method: "DELETE" });
}

/** به‌روزرسانی سریع پرچم‌های نمایشی محصول بدون دست زدن به تصاویر/ویدئو */
export async function updateProductSelection(id, patch) {
  return request("/products/" + id + "/select", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/* ============================== ORDERS ============================== */

export async function fetchOrders() {
  const res = await request("/orders");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function updateOrderStatus(id, status) {
  return request("/orders/" + id + "/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/* ============================== CUSTOMERS ============================== */

export async function fetchCustomers() {
  const res = await request("/customers");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

/** مسدود/رفع مسدود کردن مشتری (ورود او با OTP هم مسدود می‌شود) */
export async function setCustomerBlocked(id, isBlocked) {
  return request("/customers/" + id + "/block", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_blocked: Boolean(isBlocked) }),
  });
}

/** حذف مشتری؛ سوابق سفارش او حذف نمی‌شود و فقط از حساب جدا می‌ماند */
export async function deleteCustomer(id) {
  return request("/customers/" + id, { method: "DELETE" });
}

/* ================== POPULAR SEARCHES (جستجوهای پرطرفدار) ================== */

export async function fetchPopularSearchesAdmin() {
  const res = await request("/admin/popular-searches");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createPopularSearch(payload) {
  return request("/admin/popular-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updatePopularSearch(id, payload) {
  return request("/admin/popular-searches/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deletePopularSearch(id) {
  return request("/admin/popular-searches/" + id, { method: "DELETE" });
}

/* ============================== ARTICLES ============================== */

export async function fetchArticles() {
  const res = await request("/articles");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createArticle(payload) {
  return request("/articles", { method: "POST", body: buildArticleFormData(payload) });
}

export async function updateArticle(id, payload) {
  return request("/articles/" + id, { method: "PUT", body: buildArticleFormData(payload) });
}

export async function deleteArticle(id) {
  return request("/articles/" + id, { method: "DELETE" });
}

/* ============================== HOME SLIDERS ============================== */

function buildHomeSliderFormData(payload) {
  const formData = new FormData();
  formData.append("title", payload.title || "");
  formData.append("link", payload.link || "");
  formData.append("active", payload.active ? "true" : "false");
  if (payload.imageFile) formData.append("image", payload.imageFile);
  return formData;
}

export async function fetchHomeSliders() {
  const res = await request("/home/sliders");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createHomeSlider(payload) {
  return request("/home/sliders", { method: "POST", body: buildHomeSliderFormData(payload) });
}

export async function updateHomeSlider(id, payload) {
  return request("/home/sliders/" + id, { method: "PUT", body: buildHomeSliderFormData(payload) });
}

export async function deleteHomeSlider(id) {
  return request("/home/sliders/" + id, { method: "DELETE" });
}

/* ============================== CATEGORY SLIDES ============================== */

function buildCategorySlideFormData(payload) {
  const formData = new FormData();
  formData.append("title", payload.title || "");
  formData.append("category", payload.category || "");
  formData.append("link", payload.link || "");
  formData.append("order", payload.order != null ? payload.order : 0);
  formData.append("active", payload.active ? "true" : "false");
  if (payload.imageFile) formData.append("image", payload.imageFile);
  return formData;
}

export async function fetchCategorySlides() {
  const res = await request("/admin/category-slides");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createCategorySlide(payload) {
  return request("/admin/category-slides", { method: "POST", body: buildCategorySlideFormData(payload) });
}

export async function updateCategorySlide(id, payload) {
  return request("/admin/category-slides/" + id, { method: "PUT", body: buildCategorySlideFormData(payload) });
}

export async function deleteCategorySlide(id) {
  return request("/admin/category-slides/" + id, { method: "DELETE" });
}

/* ============================== SECTION SLIDERS (عضویت محصول در اسلایدر بخش‌های منو) ============================== */

export const SLIDER_SECTIONS = [
  { key: "amazing", label: "شگفت‌انگیزها" },
  { key: "popular", label: "محبوب‌ها" },
];

export async function fetchSectionSliders(section) {
  const query = section ? "?section=" + encodeURIComponent(section) : "";
  const res = await request("/admin/section-sliders" + query);
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createSectionSliderItem(section, productId) {
  return request("/admin/section-sliders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, product_id: productId }),
  });
}

export async function updateSectionSliderItem(id, payload) {
  return request("/admin/section-sliders/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteSectionSlider(id) {
  return request("/admin/section-sliders/" + id, { method: "DELETE" });
}

/* ============================== MESSAGES (پیامک) ============================== */

export async function fetchAdminMessages() {
  const res = await request("/admin/messages/list");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function sendAdminMessage(payload) {
  return request("/admin/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminMessage(id) {
  return request("/admin/messages/" + id, { method: "DELETE" });
}

/* ============================== CATEGORIES (دسته‌بندی) ============================== */

export async function fetchAdminCategories() {
  const res = await request("/admin/categories");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function createAdminCategory(payload) {
  return request("/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCategory(id, payload) {
  return request("/admin/categories/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCategory(id) {
  return request("/admin/categories/" + id, { method: "DELETE" });
}

/* ============================== REVIEWS (دیدگاه‌ها) ============================== */

export async function fetchAllReviews() {
  const res = await request("/admin/reviews");
  return Array.isArray(res) ? res : (res && res.results ? res.results : []);
}

export async function deleteReview(id) {
  return request("/admin/reviews/" + id, { method: "DELETE" });
}

/* ============================== BANNERS & SLIDESHOW ============================== */

export async function fetchBanners(type = null, all = true) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (all) params.append("all", "true");
  const qs = params.toString();
  return request("/banners" + (qs ? "?" + qs : ""));
}

export async function createBanner(payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("subtitle", payload.subtitle || "");
  formData.append("link_url", payload.link_url || "");
  formData.append("banner_type", payload.banner_type || "hero");
  formData.append("display_order", payload.display_order || 0);
  formData.append("is_active", payload.is_active !== undefined ? payload.is_active : true);
  if (payload.imageFile) formData.append("image", payload.imageFile);
  return request("/banners", { method: "POST", body: formData });
}

export async function updateBanner(id, payload) {
  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    const formData = new FormData();
    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.subtitle !== undefined) formData.append("subtitle", payload.subtitle);
    if (payload.link_url !== undefined) formData.append("link_url", payload.link_url);
    if (payload.banner_type !== undefined) formData.append("banner_type", payload.banner_type);
    if (payload.display_order !== undefined) formData.append("display_order", payload.display_order);
    if (payload.is_active !== undefined) formData.append("is_active", payload.is_active);
    if (payload.imageFile) formData.append("image", payload.imageFile);
    body = formData;
  }
  return request("/banners/" + id, { method: "PATCH", body });
}

export async function deleteBanner(id) {
  return request("/banners/" + id, { method: "DELETE" });
}

export async function reorderBanners(order) {
  return request("/banners/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });
}

/* ============================== SITE SETTINGS ============================== */

export async function fetchSiteSettings() {
  return request("/site-settings");
}

export async function updateSiteSettings(payload) {
  return request("/site-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ============================== FEATURED & SPECIAL PRODUCTS ============================== */

export async function fetchFeaturedProducts(limit = 12) {
  return request("/products/featured?limit=" + limit);
}

export async function fetchSpecialOffers(limit = 12) {
  return request("/products/special-offers?limit=" + limit);
}

export async function toggleProductFeatured(id, is_featured = null) {
  return request("/products/" + id + "/toggle-featured", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(is_featured !== null ? { is_featured } : {}),
  });
}

export async function batchActionProducts(ids, action, extra = {}) {
  return request("/products/batch-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, action, ...extra }),
  });
}

/* ============================== DASHBOARD METRICS ============================== */

export async function fetchDashboardMetrics() {
  return request("/admin/dashboard/metrics");
}

/* ============================== COUPONS ============================== */

export async function fetchCoupons() {
  return request("/admin/coupons");
}

export async function createCoupon(payload) {
  return request("/admin/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteCoupon(id) {
  return request("/admin/coupons/" + id, { method: "DELETE" });
}