import { useEffect } from "react";

/**
 * تنظیم تایتل و توضیحات هر صفحه (SEO ساده و سبک).
 * در هر صفحه کافیست: usePageMeta({ title: "...", description: "..." })
 */
export function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (!description) return;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [description]);
}

/**
 * شنیدن تغییرات وضعیت لاگین (رویداد avay:auth) — برای هوک‌های UI
 */
export function useAuthSync(onChange) {
  useEffect(() => {
    window.addEventListener("avay:auth", onChange);
    return () => window.removeEventListener("avay:auth", onChange);
  }, [onChange]);
}