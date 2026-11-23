import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "آوای انعکاس";
const IGNORED_PARAMS = ["search"]; // نتایج جستجو یک صفحه‌ی مستقل برای گوگل نیستند

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function buildCanonical(pathname, search) {
  const params = new URLSearchParams(search);
  IGNORED_PARAMS.forEach((p) => params.delete(p));
  [...params.keys()].forEach((k) => k.startsWith("utm_") && params.delete(k));
  const qs = params.toString();
  return window.location.origin + pathname + (qs ? `?${qs}` : "");
}

/**
 * سئوی هر صفحه: عنوان، توضیحات، canonical، Open Graph و داده‌ی ساختاریافته.
 * مثال: usePageMeta({ title, description, image, type: "product", jsonLd })
 */
export function usePageMeta({
  title,
  description,
  image,
  type = "website",
  canonical,
  jsonLd,
} = {}) {
  const { pathname, search } = useLocation();
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    const url = canonical || buildCanonical(pathname, search);
    upsertLink("canonical", url);

    if (description) upsertMeta("name", "description", description);
    if (title) upsertMeta("property", "og:title", title);
    if (description) upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "fa_IR");
    upsertMeta("property", "og:url", url);

    if (image) {
      upsertMeta("property", "og:image", new URL(image, window.location.origin).href);
    }
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  }, [title, description, image, type, canonical, pathname, search]);

  useEffect(() => {
    if (!jsonLdText) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = jsonLdText;
    document.head.appendChild(script);
    return () => script.remove();
  }, [jsonLdText]);
}

/** صفحه‌های خصوصی (سبد، پروفایل، ورود، ادمین) نباید در گوگل ایندکس شوند */
export function useNoIndex(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const meta = upsertMeta("name", "robots", "noindex, nofollow");
    return () => meta.setAttribute("content", "index, follow");
  }, [enabled]);
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
