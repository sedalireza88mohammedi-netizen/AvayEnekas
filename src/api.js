/**
 * ================================================================
 *  خروجی فروشگاه (فرانت، نه پنل ادمین) — اتصال به بک‌اند Django
 * ================================================================
 *  این فایل وظیفه‌ی دریافت محصولات از بک‌اند و تبدیل (map) کردن
 *  فرمت پاسخ API به شکلی که کامپوننت‌های فروشگاه (ProductCard ها)
 *  انتظارش را دارند را بر عهده دارد:
 *
 *      بک‌اند:  id, name, title, subtitle, price, oldPrice,
 *               discount, rating, Empressive, stock, images[], video
 *
 *      فرانت:   id, title, subtitle, price, oldPrice,
 *               discount, rating, Empressive (بوولیانی), image
 *
 *  اگر بک‌اند فیلدی مثل oldPrice یا rating را نفرستد، مقدار پیش‌فرض
 *  ایمن می‌گیرد تا صفحه نشکند (سازگار با هر دو نسخه بک‌اند).
 * ================================================================
 */

// آدرس پایه‌ی API — بک‌اند باید روی همین پورت روشن باشد
export const API_BASE_URL =
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(API_BASE_URL + path, options);
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || "خطا در ارتباط با سرور (کد " + res.status + ")");
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

// تبدیل یک محصول بک‌اند به شکلی که کارت‌های فروشگاه استفاده می‌کنند
function mapProduct(p) {
  const price = Number(p.price) || 0;
  const featured =
    p.Empressive !== undefined
      ? p.Empressive === true
      : p.is_featured !== undefined
        ? p.is_featured === true
        : true; // بک‌اند قدیمی این فیلد را ندارد → همه محصولات نمایش داده شوند
  return {
    id: p.id,
    title: p.title || p.name || "",
    subtitle: p.subtitle || "",
    price,
    oldPrice: Number(p.oldPrice) || price,
    discount: Number(p.discount) || 0,
    rating: Number(p.rating) || 0,
    Empressive: featured,
    stock: p.stock,
    category: p.category,
    sku: p.sku,
    image:
      (Array.isArray(p.images) && p.images.length > 0 && p.images[0].url) || p.image || "",
    video: p.video || null,
  };
}

/**
 * دریافت لیست محصولات از بک‌اند.
 * پارامترها: category و search (اختیاری)
 */
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  const qs = query.toString();
  const data = await request("/products" + (qs ? "?" + qs : ""));
  return Array.isArray(data) ? data.map(mapProduct) : [];
}

// دریافت یک محصول با شناسه (در صورت نیاز به صفحه‌ی جزئیات محصول)
export async function fetchProduct(id) {
  const data = await request("/products/" + id);
  return data ? mapProduct(data) : null;
}

// دریافت لیست دسته‌بندی‌ها
export async function fetchCategories() {
  const data = await request("/categories");
  return Array.isArray(data) ? data : [];
}