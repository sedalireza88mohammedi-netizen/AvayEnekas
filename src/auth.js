/**
 * مدیریت نشست کاربر (توکن JWT) و کلید مهمان برای سبد خرید.
 * توکن‌ها در localStorage ذخیره می‌شوند و با یک رویداد سفارشی
 * (avay:auth) کامپوننت‌ها از تغییر وضعیت لاگین با‌خبر می‌شوند.
 */

export const TOKEN_KEY = "avay_access_token";
export const REFRESH_KEY = "avay_refresh_token";
export const PHONE_KEY = "avay_phone";
export const SESSION_KEY = "avay_session_key";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getPhone() {
  return localStorage.getItem(PHONE_KEY);
}

export function setAuth({ access, refresh, phone }) {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  if (phone) localStorage.setItem(PHONE_KEY, phone);
  window.dispatchEvent(new Event("avay:auth"));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PHONE_KEY);
  window.dispatchEvent(new Event("avay:auth"));
}

export function isLoggedIn() {
  // بک‌اند قدیمی توکن نمی‌دهد → شماره موبایل هم نشانه‌ی ورود است
  return !!(getAccessToken() || getPhone());
}

/** کلید مهمان سبد خرید — ساخت و ماندگاری آن */
export function getSessionKey() {
  let key = localStorage.getItem(SESSION_KEY);
  if (!key) {
    key =
      "guest-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, key);
  }
  return key;
}