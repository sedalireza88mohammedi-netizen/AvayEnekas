/**
 * مدیریت نشست کاربر (توکن JWT) و کلید مهمان برای سبد خرید.
 * توکن‌ها در localStorage ذخیره می‌شوند و با یک رویداد سفارشی
 * (avay:auth) کامپوننت‌ها از تغییر وضعیت لاگین با‌خبر می‌شوند.
 */

export const TOKEN_KEY = "avay_access_token";
export const REFRESH_KEY = "avay_refresh_token";
export const PHONE_KEY = "avay_phone";
export const SESSION_KEY = "avay_session_key";

/**
 * localStorage در بعضی محیط‌ها (مرورگر داخلی اینستاگرام/تلگرام، حالت خصوصی
 * سافاری، کوکی‌های مسدود) خطا می‌دهد و کل سایت را سفید می‌کند.
 * این لایه خطا را می‌گیرد و در همان نشست از حافظه‌ی موقت استفاده می‌کند.
 */
const memory = new Map();

export const safeStorage = {
  get(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch {
      /* ذخیره‌سازی در دسترس نیست */
    }
    return memory.has(key) ? memory.get(key) : null;
  },
  set(key, value) {
    memory.set(key, String(value));
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      /* فقط حافظه‌ی موقت */
    }
  },
  remove(key) {
    memory.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* سکوت */
    }
  },
};

const notifyAuthChange = () => window.dispatchEvent(new Event("avay:auth"));

export function getAccessToken() {
  return safeStorage.get(TOKEN_KEY);
}

export function getRefreshToken() {
  return safeStorage.get(REFRESH_KEY);
}

export function getPhone() {
  return safeStorage.get(PHONE_KEY);
}

/** ذخیره‌ی نشست بعد از ورود (رویداد avay:auth ارسال می‌شود) */
export function setAuth({ access, refresh, phone }) {
  if (access) safeStorage.set(TOKEN_KEY, access);
  if (refresh) safeStorage.set(REFRESH_KEY, refresh);
  if (phone) safeStorage.set(PHONE_KEY, phone);
  notifyAuthChange();
}

/** جایگزینی بی‌صدای توکن‌ها هنگام رفرش (بدون رویداد؛ برای جلوگیری از حلقه) */
export function updateTokens({ access, refresh }) {
  if (access) safeStorage.set(TOKEN_KEY, access);
  if (refresh) safeStorage.set(REFRESH_KEY, refresh);
}

export function clearAuth() {
  safeStorage.remove(TOKEN_KEY);
  safeStorage.remove(REFRESH_KEY);
  safeStorage.remove(PHONE_KEY);
  notifyAuthChange();
}

export function isLoggedIn() {
  // بک‌اند قدیمی توکن نمی‌دهد → شماره موبایل هم نشانه‌ی ورود است
  return !!(getAccessToken() || getPhone());
}

/** کلید مهمان سبد خرید — ساخت و ماندگاری آن */
export function getSessionKey() {
  let key = safeStorage.get(SESSION_KEY);
  if (!key) {
    key =
      "guest-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10);
    safeStorage.set(SESSION_KEY, key);
  }
  return key;
}
