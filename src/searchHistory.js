/**
 * تاریخچه جستجوی کاربر — ذخیره‌سازی محلی (localStorage) روی همان دستگاه.
 * هر جمله با اولین بار ورود، به اول لیست می‌رود و تکراری‌ها حذف می‌شوند.
 */
import { recordSearch } from "./api";

const HISTORY_KEY = "avay_search_history";
const MAX_HISTORY = 8;

export function getSearchHistory() {
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(arr)
      ? arr.filter((t) => typeof t === "string" && t.trim())
      : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(term) {
  const value = (term || "").trim();
  if (!value) return getSearchHistory();
  const next = [
    value,
    ...getSearchHistory().filter((t) => t !== value),
  ].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* سکوت */
  }
  return next;
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* سکوت */
  }
  return [];
}

/** یک جستجوی واقعی را در تاریخچه و در لیست پرطرفدارهای سرور ثبت می‌کند */
export function saveSearch(term) {
  const history = addSearchHistory(term);
  recordSearch(term).catch(() => {});
  return history;
}