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

export const API_BASE_URL =
  (typeof window !== "undefined" && window.__ADMIN_API_BASE_URL__) ||
  "http://localhost:4000/api";

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function request(path, options = {}) {
  const res = await fetch(API_BASE_URL + path, options);
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || ("خطا در ارتباط با سرور (کد " + res.status + ")"));
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

export const CATEGORY_LIST = ["اسپیکر", "هدفون", "آمپلی‌فایر", "میکروفون", "میکسر", "کابل و اتصالات"];

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