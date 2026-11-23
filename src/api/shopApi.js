/**
 * ============================================================================
 *  SHOP API CLIENT LAYER — لایه یکپارچه ارتباط فرانت‌اند به بک‌اند فروشگاه
 * ============================================================================
 * تمام درخواست‌های فرانت به بک‌اند از طریق توابع این فایل مدیریت می‌شوند.
 * قابلیت‌ها:
 *  - اتصال خودکار توکن احراز هویت JWT (Access Token)
 *  - ساخت و مدیریت شناسه سبد خرید مهمان (Guest Session Key)
 *  - رفرش خودکار توکن منقضی‌شده با Refresh Token
 *  - مدیریت خطاهای شبکه و پیام‌های فارسی سرور
 */

export const API_BASE_URL =
  (typeof window !== "undefined" && window.__API_BASE_URL__) ||
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:4000/api";

export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// کلیدهای ذخیره‌سازی محلی
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const GUEST_SESSION_KEY = "guest_session_key";
const USER_KEY = "user_info";

/**
 * دریافت یا تولید شناسه مهمان یکتا برای سبد خرید
 */
export function getSessionKey() {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(GUEST_SESSION_KEY);
  if (!key) {
    key = "guest-" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(GUEST_SESSION_KEY, key);
  }
  return key;
}

export function getAccessToken() {
  return typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
}

export function getRefreshToken() {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

export function saveAuthTokens({ access, refresh }, user = null) {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("isLoggedin", "true");
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("isLoggedin");
}

export function getSavedUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * ارسال درخواست HTTP هوشمند با مدیریت احراز هویت و رفرش خودکار
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // اضافه کردن هدر Session-Key برای کاربران مهمان
  const sessionKey = getSessionKey();
  if (sessionKey) {
    headers.set("X-Session-Key", sessionKey);
  }

  // اضافه کردن Bearer Token در صورت وجود
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // تنظیم Content-Type روی application/json مگر اینکه داده از نوع FormData باشد
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(url, { ...options, headers });

  // در صورت انقضای توکن (۴۰۱)، تلاش برای رفرش خودکار توکن
  if (response.status === 401 && getRefreshToken() && !options._retry) {
    options._retry = true;
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`);
      response = await fetch(url, { ...options, headers });
    } else {
      clearAuth();
    }
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      const text = await response.text().catch(() => "");
      throw new Error(text || `خطای سرور با کد ${response.status}`);
    }
    const message =
      (errorData && (errorData.error || errorData.detail || errorData.message)) ||
      JSON.stringify(errorData);
    const err = new Error(message || `خطا در ارتباط با سرور (${response.status})`);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function tryRefreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        return true;
      }
    } else {
      clearAuth();
    }
  } catch {
    clearAuth();
  }
  return false;
}

// ============================================================================
// ۱. احراز هویت (AUTH)
// ============================================================================

export const AuthApi = {
  /**
   * درخواست ارسال کد تأیید OTP
   * @param {string} phone
   */
  sendCode: (phone) =>
    request("/auth/send-code/", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  /**
   * بررسی کد OTP و ورود کاربر + انتقال خودکار سبد مهمان
   * @param {string} phone
   * @param {string} code
   */
  verifyCode: async (phone, code) => {
    const session_key = getSessionKey();
    const data = await request("/auth/verify-code/", {
      method: "POST",
      body: JSON.stringify({ phone, code, session_key }),
    });
    if (data.success && data.tokens) {
      saveAuthTokens(data.tokens, data.customer);
    }
    return data;
  },

  /**
   * خروج از حساب کاربری و باطل کردن توکن
   */
  logout: async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await request("/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
      }
    } finally {
      clearAuth();
    }
    return { success: true };
  },
};

// ============================================================================
// ۲. محصولات و کاتالوگ (PRODUCTS & CATALOG)
// ============================================================================

export const ProductApi = {
  /**
   * لیست و جستجوی محصولات همراه با فیلتر و صفحه‌بندی
   * @param {Object} params - { category, search, brand, min_price, max_price, in_stock, is_featured, ordering, page, page_size }
   */
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return request(`/products/${qs ? `?${qs}` : ""}`);
  },

  /**
   * جزئیات یک محصول با مشخصات فنی، گالری و تنوع‌ها
   * @param {number|string} id
   */
  getProductDetail: (id) => request(`/products/${id}/`),

  /**
   * کالاهای مرتبط و پیشنهادی
   * @param {number|string} id
   */
  getRelatedProducts: (id) => request(`/products/${id}/related/`),

  /**
   * مقایسه تخصصی مشخصات چند کالا
   * @param {Array<number>} ids
   */
  compareProducts: (ids) => request(`/products/compare/?ids=${ids.join(",")}`),

  /**
   * دریافت نظرات و آمار امتیازدهی محصول
   * @param {number|string} id
   */
  getReviews: (id) => request(`/products/${id}/reviews/`),

  /**
   * ثبت نظر و امتیاز برای کالا
   * @param {number|string} id
   * @param {Object} reviewData - { rating, comment, user_name, pros, cons }
   */
  addReview: (id, reviewData) =>
    request(`/products/${id}/reviews/`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    }),

  /**
   * دریافت پرسش‌ها و پاسخ‌های کاربران
   * @param {number|string} id
   */
  getQuestions: (id) => request(`/products/${id}/questions/`),

  /**
   * ثبت پرسش جدید برای محصول
   * @param {number|string} id
   * @param {string} question_text
   */
  addQuestion: (id, question_text) =>
    request(`/products/${id}/questions/`, {
      method: "POST",
      body: JSON.stringify({ question_text }),
    }),

  /**
   * ثبت پاسخ برای یک پرسش
   * @param {number|string} questionId
   * @param {string} answer_text
   */
  addAnswer: (questionId, answer_text) =>
    request(`/questions/${questionId}/answers/`, {
      method: "POST",
      body: JSON.stringify({ answer_text }),
    }),

  /**
   * لیست دسته‌بندی‌ها
   */
  getCategories: () => request("/categories/"),

  /**
   * لیست برندها با تعداد محصولات
   */
  getBrands: () => request("/brands/"),

  /**
   * دریافت تنوع‌های یک محصول
   * @param {number|string} id
   */
  getVariants: (id) => request(`/products/${id}/variants/`),

  /**
   * محصولات منتخب و ویژه (اسلایدر صفحه اول)
   * @param {Object} params - { limit, category }
   */
  getFeatured: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products/featured/${qs ? `?${qs}` : ""}`);
  },

  /**
   * پیشنهادات شگفت‌انگیز و تخفیف‌دار
   * @param {Object} params - { limit, category }
   */
  getSpecialOffers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products/special-offers/${qs ? `?${qs}` : ""}`);
  },

  /**
   * پرفروش‌ترین محصولات
   * @param {Object} params - { limit, category }
   */
  getBestSellers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products/best-sellers/${qs ? `?${qs}` : ""}`);
  },

  /**
   * جدیدترین محصولات
   * @param {Object} params - { limit, category }
   */
  getNewArrivals: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products/new-arrivals/${qs ? `?${qs}` : ""}`);
  },

  /**
   * تغییر وضعیت منتخب / ویژه بودن محصول
   * @param {number|string} id
   * @param {boolean|null} is_featured
   */
  toggleFeatured: (id, is_featured = null) =>
    request(`/products/${id}/toggle-featured/`, {
      method: "PATCH",
      body: JSON.stringify(is_featured !== null ? { is_featured } : {}),
    }),

  /**
   * عملیات گروهی روی محصولات
   * @param {Array<number>} ids
   * @param {string} action - 'set_featured' | 'unset_featured' | 'set_active' | 'set_inactive' | 'delete' | 'change_category'
   * @param {Object} extra
   */
  batchAction: (ids, action, extra = {}) =>
    request("/products/batch-action/", {
      method: "POST",
      body: JSON.stringify({ ids, action, ...extra }),
    }),
};

// ============================================================================
// ۳. سبد خرید (SHOPPING CART)
// ============================================================================

export const CartApi = {
  /**
   * مشاهده محتویات سبد خرید و خلاصه مالی (محاسبه هزینه ارسال و تخفیف)
   */
  getCart: () => request("/cart/"),

  /**
   * افزودن کالا یا تنوع خاص به سبد خرید
   * @param {number} productId
   * @param {number} quantity
   * @param {number|null} variantId
   */
  addItem: (productId, quantity = 1, variantId = null) =>
    request("/cart/items/", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        quantity,
        variant_id: variantId,
      }),
    }),

  /**
   * تغییر تعداد یک کالا در سبد
   * @param {number} productId
   * @param {number} quantity
   * @param {number|null} variantId
   */
  updateItem: (productId, quantity, variantId = null) =>
    request(`/cart/items/${productId}/`, {
      method: "PATCH",
      body: JSON.stringify({ quantity, variant_id: variantId }),
    }),

  /**
   * حذف یک کالا از سبد
   * @param {number} productId
   * @param {number|null} variantId
   */
  removeItem: (productId, variantId = null) => {
    const qs = variantId ? `?variant_id=${variantId}` : "";
    return request(`/cart/items/${productId}/${qs}`, {
      method: "DELETE",
    });
  },

  /**
   * خالی کردن کامل سبد خرید
   */
  clearCart: () => request("/cart/", { method: "DELETE" }),

  /**
   * اعمال کد تخفیف در سبد خرید
   * @param {string} code
   */
  applyCoupon: (code) =>
    request("/cart/coupon/", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  /**
   * حذف کد تخفیف از سبد خرید
   */
  removeCoupon: () => request("/cart/coupon/", { method: "DELETE" }),

  /**
   * تسویه حساب و ثبت سفارش نهایی
   * @param {Object} checkoutData - { customer, phone, address, email, shipping_method, customer_notes, auto_pay, gateway }
   */
  checkout: (checkoutData) =>
    request("/cart/checkout/", {
      method: "POST",
      body: JSON.stringify(checkoutData),
    }),
};

// ============================================================================
// ۴. سفارش‌ها و پرداخت (ORDERS & PAYMENT)
// ============================================================================

export const OrderApi = {
  /**
   * مشاهده وضعیت سفارش با کد (ORD-XXXX)
   * @param {string} code
   */
  getOrder: (code) => request(`/orders/${code}/`),

  /**
   * تایم‌لاین و تاریخچه تغییرات سفارش
   * @param {string} code
   */
  getOrderHistory: (code) => request(`/orders/${code}/history/`),

  /**
   * لغو سفارش توسط مشتری
   * @param {string} code
   * @param {string} reason
   */
  cancelOrder: (code, reason = "لغو توسط مشتری") =>
    request(`/orders/${code}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  /**
   * آدرس مستقیم صفحه فاکتور قابل چاپ
   * @param {string} code
   */
  getInvoiceUrl: (code) => `${API_BASE_URL}/orders/${code}/invoice/`,

  /**
   * درخواست پرداخت اینترنتی سفارش
   * @param {string} orderCode
   * @param {string} gateway - 'mock' | 'zarinpal' | 'idpay'
   */
  requestPayment: (orderCode, gateway = "mock") =>
    request("/payment/request/", {
      method: "POST",
      body: JSON.stringify({ order_code: orderCode, gateway }),
    }),

  /**
   * تأیید پرداخت هنگام بازگشت از درگاه
   * @param {string} authority
   * @param {string} status - 'OK' | 'NOK'
   */
  verifyPayment: (authority, status = "OK") =>
    request("/payment/verify/", {
      method: "POST",
      body: JSON.stringify({ authority, status }),
    }),
};

// ============================================================================
// ۵. پروفایل، آدرس‌ها، پیام‌ها و علاقه‌مندی‌ها (USER PROFILE)
// ============================================================================

export const ProfileApi = {
  /**
   * دریافت مشخصات پروفایل کاربر
   */
  getProfile: () => request("/me/"),

  /**
   * به‌روزرسانی مشخصات پروفایل
   * @param {Object} profileData - { NameAndFamily, BirthDate, IdCard, Email, Number, gender }
   */
  updateProfile: (profileData) =>
    request("/me/", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  /**
   * آپلود تصویر آواتار
   * @param {File} file
   */
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return request("/me/avatar/", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * لیست سفارش‌های کاربر به تفکیک تب‌ها (InProgress, Delivered, Returned, Canceled)
   */
  getUserOrders: () => request("/me/orders/"),

  /**
   * لیست آدرس‌های کاربر
   */
  getAddresses: () => request("/addresses/"),

  /**
   * افزودن آدرس جدید
   * @param {Object} addressData - { title, recipient_name, recipient_phone, province, city, address, postal_code, unit, is_default }
   */
  addAddress: (addressData) =>
    request("/addresses/", {
      method: "POST",
      body: JSON.stringify(addressData),
    }),

  /**
   * حذف آدرس
   * @param {number} addressId
   */
  deleteAddress: (addressId) =>
    request(`/addresses/${addressId}/`, {
      method: "DELETE",
    }),

  /**
   * تعیین یک آدرس به عنوان پیش‌فرض
   * @param {number} addressId
   */
  setDefaultAddress: (addressId) =>
    request(`/addresses/${addressId}/`, {
      method: "PATCH",
    }),

  /**
   * لیست کالاهای مورد علاقه (Wishlist)
   */
  getFavorites: () => request("/favorites/"),

  /**
   * افزودن به یا حذف از علاقه‌مندی‌ها (Toggle)
   * @param {number} productId
   * @param {boolean} shouldRemove
   */
  toggleFavorite: (productId, shouldRemove = false) =>
    request(`/favorites/${productId}/`, {
      method: shouldRemove ? "DELETE" : "POST",
    }),

  /**
   * دریافت پیام‌ها و اعلان‌های سیستم
   */
  getNotifications: () => request("/me/messages/"),

  /**
   * علامت‌گذاری پیام به عنوان خوانده‌شده
   * @param {number} id
   */
  markNotificationRead: (id) =>
    request(`/me/messages/${id}/read/`, {
      method: "PATCH",
    }),

  /**
   * علامت‌گذاری تمام پیام‌ها به عنوان خوانده‌شده
   */
  markAllNotificationsRead: () =>
    request("/me/messages/read-all/", {
      method: "POST",
    }),
};

// ============================================================================
// ۶. صفحه اصلی، بازاریابی و محتوا (MARKETING & CONTENT)
// ============================================================================

export const HomeApi = {
  /**
   * بنرها و اسلایدرها
   * @param {string|null} type - 'hero' | 'promo' | 'sidebar'
   * @param {boolean} all - دریافت همه بنرها شامل غیرفعال‌ها برای ادمین
   */
  getBanners: (type = null, all = false) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (all) params.append("all", "true");
    const qs = params.toString();
    return request(`/banners/${qs ? `?${qs}` : ""}`);
  },

  /**
   * ایجاد بنر / اسلاید جدید (پشتیبانی از آپلود فایل عکس)
   * @param {FormData} formData
   */
  createBanner: (formData) =>
    request("/banners/", {
      method: "POST",
      body: formData,
    }),

  /**
   * ویرایش بنر / اسلاید
   * @param {number|string} id
   * @param {FormData|Object} data
   */
  updateBanner: (id, data) =>
    request(`/banners/${id}/`, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  /**
   * حذف بنر / اسلاید
   * @param {number|string} id
   */
  deleteBanner: (id) =>
    request(`/banners/${id}/`, {
      method: "DELETE",
    }),

  /**
   * تغییر ترتیب نمایش اسلایدها
   * @param {Array<number|Object>} order
   */
  reorderBanners: (order) =>
    request("/banners/reorder/", {
      method: "POST",
      body: JSON.stringify({ order }),
    }),

  /**
   * لیست مقالات و وبلاگ
   */
  getArticles: () => request("/articles/"),

  /**
   * جزئیات مقاله به همراه ویدیوها
   * @param {number|string} id
   */
  getArticleDetail: (id) => request(`/articles/${id}/`),

  /**
   * ارسال فرم تماس با ما
   * @param {Object} data - { name, phone, email, subject, message }
   */
  submitContact: (data) =>
    request("/contact/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * عضویت در خبرنامه
   * @param {string} email_or_phone
   */
  subscribeNewsletter: (email_or_phone) =>
    request("/newsletter/subscribe/", {
      method: "POST",
      body: JSON.stringify({ email_or_phone }),
    }),

  /**
   * دریافت تنظیمات و اطلاعات تماس فروشگاه
   */
  getSiteSettings: () => request("/site-settings/"),

  /**
   * ویرایش تنظیمات فروشگاه (پنل ادمین)
   * @param {Object} data
   */
  updateSiteSettings: (data) =>
    request("/site-settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// ۷. پنل ادمین (ADMIN PANEL)
// ============================================================================

export const AdminApi = {
  /**
   * شاخص‌ها، نمودارهای ماهانه و سهم دسته‌بندی‌ها در داشبورد ادمین
   */
  getDashboardMetrics: () => request("/admin/dashboard/metrics/"),

  /**
   * لیست مشتریان با جستجو
   * @param {Object} params - { search, page, page_size }
   */
  getCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/customers/${qs ? `?${qs}` : ""}`);
  },

  /**
   * مشاهده پرونده کامل مشتری، آدرس‌ها و تاریخچه سفارش‌ها
   * @param {number|string} id
   */
  getCustomerDetail: (id) => request(`/customers/${id}/`),

  /**
   * ویرایش مشخصات یا وضعیت فعال بودن مشتری
   * @param {number|string} id
   * @param {Object} data
   */
  updateCustomer: (id, data) =>
    request(`/customers/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * تغییر وضعیت سفارش توسط ادمین
   * @param {string} code
   * @param {string} status - 'در انتظار پردازش' | 'در حال ارسال' | 'تحویل شده' | 'مرجوع شده' | 'لغو شده'
   * @param {string} comment
   */
  updateOrderStatus: (code, status, comment = "") =>
    request(`/orders/${code}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status, comment }),
    }),

  /**
   * ویرایش مشخصات سفارش (کد رهگیری پستی، آدرس، یادداشت)
   * @param {string} code
   * @param {Object} data
   */
  updateOrderDetails: (code, data) =>
    request(`/orders/${code}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * لیست کوپن‌های تخفیف
   */
  getCoupons: () => request("/admin/coupons/"),

  /**
   * ایجاد کوپن تخفیف جدید
   * @param {Object} data - { code, discount_type, discount_value, max_discount_amount, min_purchase_amount, valid_from, valid_until, usage_limit, is_active }
   */
  createCoupon: (data) =>
    request("/admin/coupons/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * ویرایش کوپن تخفیف
   * @param {number|string} id
   * @param {Object} data
   */
  updateCoupon: (id, data) =>
    request(`/admin/coupons/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * حذف کوپن تخفیف
   * @param {number|string} id
   */
  deleteCoupon: (id) =>
    request(`/admin/coupons/${id}/`, {
      method: "DELETE",
    }),

  /**
   * لیست نظرات کاربران جهت تأیید یا مدیریت
   * @param {Object} params - { approved: boolean }
   */
  getReviews: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/reviews/${qs ? `?${qs}` : ""}`);
  },

  /**
   * تأیید یا رد نظر
   * @param {number|string} id
   * @param {boolean} is_approved
   */
  setReviewApproval: (id, is_approved) =>
    request(`/admin/reviews/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_approved }),
    }),

  /**
   * حذف نظر نامناسب
   * @param {number|string} id
   */
  deleteReview: (id) =>
    request(`/admin/reviews/${id}/`, {
      method: "DELETE",
    }),

  /**
   * لیست پیام‌های تماس با ما
   * @param {Object} params - { responded: boolean }
   */
  getContactMessages: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/contact-messages/${qs ? `?${qs}` : ""}`);
  },

  /**
   * تغییر وضعیت پاسخگویی به پیام تماس
   * @param {number|string} id
   * @param {boolean} is_responded
   */
  setContactResponded: (id, is_responded = true) =>
    request(`/admin/contact-messages/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_responded }),
    }),
};

export default {
  Auth: AuthApi,
  Product: ProductApi,
  Cart: CartApi,
  Order: OrderApi,
  Profile: ProfileApi,
  Home: HomeApi,
  Admin: AdminApi,
};
