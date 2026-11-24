import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from "react";

import ErrorEmpty from "../Components/Errores/ErrorEmpty";
import { usePageMeta } from "../useSeo";
import { getSessionKey } from "../auth";
import { getProfile, sendOtpCode, verifyOtpCode } from "../api";
import { toEnglishDigits } from "../utils/digits";

const PHONE_PATTERN = /^09\d{9}$/;
const CODE_PATTERN = /^\d{5,6}$/;
const REDIRECT_DELAY_MS = 1500;

const errorIcon = <FontAwesomeIcon icon={faCircleExclamation} />;

// پیام مناسب برای خطای ارسال کد یا تایید کد، بر اساس وضعیت پاسخ سرور
function describeError(err, fallback) {
  if (!err || !err.status) return "امکان اتصال به سرور وجود ندارد";
  if (err.status === 429) return "تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره تلاش کنید";
  if (err.status === 403 && err.message) return err.message;
  return fallback;
}

function LogIn() {
  const [number, setNumber] = useState("");
  const [userCode, setUserCode] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [MaineMessage, setMaineMessage] = useState("");
  const [iconMessage, setIconMessage] = useState("");
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  usePageMeta({
    title: "ورود | ثبت نام در آوای انعکاس",
    description: "ورود یا ثبت‌نام با شماره موبایل در فروشگاه صوتی‌تصویری آوای انعکاس.",
  });

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const showError = (icon, title, msg) => {
    setIconMessage(icon);
    setMaineMessage(title);
    setErrorMessage(msg);
    setIsErrorOpen(true);
  };

  const handleSendNumber = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    const phone = toEnglishDigits(number).replace(/\s/g, "");
    if (!PHONE_PATTERN.test(phone)) {
      showError(errorIcon, "مشکلی پیش آمد!", "شماره موبایل را درست وارد کنید (مثلا 09123456789)");
      return;
    }
    setIsLoading(true);
    try {
      await sendOtpCode(phone);
      setNumber(phone);
      setStep(2);
    } catch (err) {
      showError(errorIcon, "مشکلی پیش آمد!", describeError(err, "امکان ارسال کد وجود ندارد؛ کمی بعد دوباره تلاش کنید."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    const code = toEnglishDigits(userCode).trim();
    if (!CODE_PATTERN.test(code)) {
      showError(errorIcon, "مشکلی پیش آمد!", "کد تایید را به درستی وارد کنید");
      return;
    }
    setIsLoading(true);
    try {
      const authRes = await verifyOtpCode(number, code, getSessionKey());
      if (authRes && authRes.success === false) {
        throw Object.assign(new Error("invalid code"), { status: 400 });
      }
      showError(
        <FontAwesomeIcon style={{ color: "green" }} icon={faCircleCheck} />,
        "خوش آمدید!",
        <h3 style={{ color: "green" }}>ورود شما موفقیت‌آمیز بود</h3>
      );
      // بکاند قدیمی پرچم ادمین را در پاسخ ورود نمیدهد؛ از پروفایل خوانده میشود
      const profile = await getProfile().catch(() => null);
      const isAdmin = Boolean(
        (authRes && (authRes.IsAdmin || authRes.is_staff || authRes.is_superuser)) ||
          (profile && (profile.IsAdmin || profile.is_staff || profile.is_superuser)),
      );
      const targetRoute = isAdmin ? "/AdminPannel" : "/";
      redirectTimer.current = setTimeout(() => navigate(targetRoute), REDIRECT_DELAY_MS);
    } catch (err) {
      showError(errorIcon, "مشکلی پیش آمد!", describeError(err, "کد وارد شده صحیح نیست یا منقضی شده است"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ErrorEmpty
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        message={errorMessage}
        MaineMessage={MaineMessage}
        iconMessage={iconMessage}
      />

      {step === 1 && (
        <form className="FirstStebContainer" onSubmit={handleSendNumber} noValidate>
          <Link to="/" className="back" aria-label="بازگشت به صفحه اصلی"><FontAwesomeIcon icon={faArrowRight} /></Link>
          <div className="logoLogin">آوای <span className="logoLogin2">انعکاس</span></div>
          <h3>ورود یا ثبت نام در آوای انعکاس</h3>
          <h4>لطفا شماره موبایل خود را وارد کنید</h4>
          <input
            className="numberInp"
            type="tel"
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={14}
            placeholder="مثلا 09123456789"
            aria-label="شماره موبایل"
            value={number}
            onChange={(e) => setNumber(toEnglishDigits(e.target.value))}
            dir="ltr"
          />
          <button type="submit" className="btnSendNumber" disabled={isLoading}>
            {isLoading ? "در حال ارسال کد..." : "ورود به آوای انعکاس"}
          </button>
          <h6 className="Law">ورود شما به معنای پذیرش شرایط آوای انعکاس و قوانین حریم خصوصی است</h6>
        </form>
      )}

      {step === 2 && (
        <form className="FirstStebContainer" onSubmit={handleVerifyOtp} noValidate>
          <div className="logoLogin">آوای <span className="logoLogin2">انعکاس</span></div>
          <h2 className="titlecode">کد تایید را وارد کنید</h2>

          <input
            className="numberInp"
            type="tel"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="کد ۵ رقمی"
            aria-label="کد تایید"
            value={userCode}
            onChange={(e) => setUserCode(toEnglishDigits(e.target.value))}
            dir="ltr"
          />
          <button type="submit" className="btnSendNumber" disabled={isLoading}>
            {isLoading ? "در حال بررسی..." : "تایید و ورود"}
          </button>
          <h4 onClick={() => setStep(1)} className="backBtn"><FontAwesomeIcon icon={faArrowLeft} /> ویرایش شماره</h4>
        </form>
      )}
    </>
  );
}

export default LogIn;
