import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useState } from "react";

import ErrorEmpty from "../Components/Errores/ErrorEmpty";
import { usePageMeta } from "../useSeo";
import { getSessionKey } from "../auth";
import { sendOtpCode, verifyOtpCode } from "../api";

function LogIn() {
  const [number, setNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [userCode, setUserCode] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [MaineMessage, setMaineMessage] = useState("");
  const [iconMessage, setIconMessage] = useState("");
  const navigate = useNavigate();

  usePageMeta({
    title: "ورود | ثبت نام در آوای انعکاس",
    description: "ورود یا ثبت‌نام با شماره موبایل در فروشگاه صوتی‌تصویری آوای انعکاس.",
  });

  const showError = (icon, title, msg) => {
    setIconMessage(icon);
    setMaineMessage(title);
    setErrorMessage(msg);
    setIsErrorOpen(true);
  };

  const handleSendNumber = async () => {
    const phone = number.trim();
    if (phone.length < 11) {
      showError(
        <FontAwesomeIcon icon={faCircleExclamation} />,
        "مشکلی پیش آمد!",
        "لطفا شماره موبایل را به درستی وارد کنید"
      );
      return;
    }
    setIsLoading(true);
    try {
      const res = await sendOtpCode(phone);
      // در محیط توسعه بک‌اند کد را برمی‌گرداند (devCode)
      setOtpCode((res && res.devCode) || "");
      setStep(2);
    } catch (err) {
      showError(
        <FontAwesomeIcon icon={faCircleExclamation} />,
        "مشکلی پیش آمد!",
        "امکان ارسال کد وجود ندارد. از روشن بودن سرور مطمئن شوید."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phone = number.trim();
    if (userCode.trim().length < 5) {
      showError(
        <FontAwesomeIcon icon={faCircleExclamation} />,
        "مشکلی پیش آمد!",
        "کد تایید ۵ رقمی را به درستی وارد کنید"
      );
      return;
    }
    setIsLoading(true);
    try {
      await verifyOtpCode(phone, userCode.trim(), getSessionKey());
      showError(
        <FontAwesomeIcon style={{ color: "green" }} icon={faCircleCheck} />,
        "خوش آمدید!",
        <h3 style={{ color: "green" }}>ورود شما موفقیت‌آمیز بود</h3>
      );
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      const message =
        err && err.message && !String(err.message).includes("خطا در ارتباط")
          ? "کد وارد شده صحیح نیست"
          : "امکان اتصال به سرور وجود ندارد";
      showError(
        <FontAwesomeIcon icon={faCircleExclamation} />,
        "مشکلی پیش آمد!",
        message
      );
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
        <div className="FirstStebContainer">
          <Link to="/" className="back"><FontAwesomeIcon icon={faArrowRight} /></Link>
          <div className="logoLogin">آوای <span className="logoLogin2">انعکاس</span></div>
          <h3>ورود یا ثبت نام در آوای انعکاس</h3>
          <h4>لطفا شماره موبایل خود را وارد کنید</h4>
          <input className="numberInp" type="tel" placeholder="مثلا 09027741653" value={number} onChange={(e) => setNumber(e.target.value)} dir="ltr" />
          <button onClick={handleSendNumber} className="btnSendNumber" disabled={isLoading}>
            {isLoading ? "در حال ارسال کد..." : "ورود به آوای انعکاس"}
          </button>
          <h6 className="Law">ورود شما به معنای پذیرش شرایط آوای انعکاس و قوانین حریم خصوصی است</h6>
        </div>
      )}

      {step === 2 && (
        <div className="FirstStebContainer">
          <div className="logoLogin">آوای <span className="logoLogin2">انعکاس</span></div>
          <h2 className="titlecode">کد تایید را وارد کنید</h2>

          {otpCode && (
            <div className="otpCode">
              کد تایید شما (محیط تست): <strong>{otpCode}</strong>
            </div>
          )}

          <input className="numberInp" type="tel" placeholder="کد ۵ رقمی" value={userCode} onChange={(e) => setUserCode(e.target.value)} dir="ltr" />
          <button onClick={handleVerifyOtp} className="btnSendNumber" disabled={isLoading}>
            {isLoading ? "در حال بررسی..." : "تایید و ورود"}
          </button>
          <h4 onClick={() => setStep(1)} className="backBtn"><FontAwesomeIcon icon={faArrowLeft} /> ویرایش شماره</h4>
        </div>
      )}
    </>
  );
}

export default LogIn;