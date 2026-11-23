const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/** تبدیل ارقام فارسی/عربی به انگلیسی (کاربران ایرانی با کیبورد فارسی تایپ می‌کنند) */
export function toEnglishDigits(value) {
  return String(value ?? "").replace(/[۰-۹٠-٩]/g, (d) => {
    const i = PERSIAN.indexOf(d);
    return String(i !== -1 ? i : ARABIC.indexOf(d));
  });
}

export function toPersianDigits(value) {
  return String(value ?? "").replace(/\d/g, (d) => PERSIAN[d]);
}
