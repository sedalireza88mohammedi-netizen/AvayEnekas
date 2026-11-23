/**
 * رفرش توکن دسترسی (Access Token) — ماژول مستقل.
 *
 * - همزمان فقط یک درخواست رفرش ارسال می‌شود (single-flight)
 * - اگر سرور ۴۰۱/۴۰۳ بدهد، رفرش‌توکن باطل است → نشست پاک می‌شود
 *   تا درخواست‌های بعدی دیگر رفرش نزنند (پایان حلقه‌ی خطا)
 * - اگر خطای شبکه/سرور بود، برای مدتی کوتاه دوباره تلاش نمی‌کند
 */
import { getRefreshToken, updateTokens, clearAuth } from "./auth";

const RETRY_COOLDOWN_MS = 30_000;

let inflight = null;
let blockedUntil = 0;

async function doRefresh(baseUrl) {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const res = await fetch(`${baseUrl}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.access) {
        // اگر بک‌اند رفرش‌توکن جدید داد (rotation) آن را هم ذخیره کن
        updateTokens({ access: data.access, refresh: data.refresh });
        return true;
      }
    }

    if (res.status === 401 || res.status === 403) {
      clearAuth(); // رفرش‌توکن نامعتبر/منقضی/مسدود
      return false;
    }
  } catch {
    /* خطای شبکه */
  }

  blockedUntil = Date.now() + RETRY_COOLDOWN_MS;
  return false;
}

/** @returns {Promise<boolean>} true اگر توکن جدید گرفته شد */
export function refreshAccessToken(baseUrl) {
  if (!getRefreshToken() || Date.now() < blockedUntil) {
    return Promise.resolve(false);
  }
  inflight ??= doRefresh(baseUrl).finally(() => {
    inflight = null;
  });
  return inflight;
}
