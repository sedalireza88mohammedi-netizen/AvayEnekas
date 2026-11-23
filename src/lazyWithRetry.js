import { lazy } from "react";

const RELOAD_FLAG = "avay:chunk-reloaded";

/**
 * مثل React.lazy؛ ولی اگر فایل صفحه بعد از یک دیپلوی جدید پیدا نشد
 * (مشکل رایج صفحه‌ی سفید در موبایل با کش قدیمی)، یک‌بار صفحه را رفرش می‌کند.
 */
export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const mod = await importer();
      sessionStorage.removeItem(RELOAD_FLAG);
      return mod;
    } catch (error) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return new Promise(() => {}); // تا رفرش شدن منتظر بماند
      }
      throw error;
    }
  });
}
