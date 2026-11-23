/**
 * بک‌اند ممکن است زیرمجموعه‌ها را به‌صورت رشته یا آبجکت (name/title) بدهد.
 * این تابع همیشه آرایه‌ای از رشته‌های یکتا برمی‌گرداند تا رندر React نشکند.
 */
export function normalizeSubgroups(subgroups) {
  if (!Array.isArray(subgroups)) return [];
  const names = subgroups
    .map((s) => (typeof s === "string" ? s : s && (s.name || s.title)))
    .filter((s) => typeof s === "string" && s.trim() !== "");
  return [...new Set(names)];
}
