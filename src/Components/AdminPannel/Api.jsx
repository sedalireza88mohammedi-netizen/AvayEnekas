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
  return request("/products");
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
  return request("/orders");
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
  return request("/customers");
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
  return request("/admin/popular-searches");
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
  return request("/articles");
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
  return request("/home/sliders");
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
  return request("/admin/category-slides");
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
  return request("/admin/section-sliders" + query);
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
  return request("/admin/messages/list");
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
  return request("/admin/categories");
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
  return request("/admin/reviews");
}

export async function deleteReview(id) {
  return request("/admin/reviews/" + id, { method: "DELETE" });
}