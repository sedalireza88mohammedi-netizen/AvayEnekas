import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowRight, faArrowLeft, faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, } from "react";

import ErrorEmpty from "../Components/Errores/ErrorEmpty";
import Home from "../Components/Home/Home";

library.add(faArrowRight, faArrowLeft, faCircleExclamation, faCircleCheck);

function LogIn() {
    const [number, setNumber] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [userCode, setUserCode] = useState("");
    const [step, setStep] = useState(1);

    const [isErrorOpen, setIsErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [MaineMessage, setMaineMessage] = useState("");
    const [iconMessage, setIconMessage] = useState("");
    const navigate = useNavigate();

    const handleSendNumber = () => {
        if (number.length < 11) {
            setIconMessage(<FontAwesomeIcon icon={faCircleExclamation} />)
            setMaineMessage("  !مشکلی پیش آمد")
            setErrorMessage(".لطفا شماره موبایل را به درستی وارد  کنید");
            setIsErrorOpen(true);
        } else {
            const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
            setOtpCode(randomCode);
            setStep(2);
        }
    };

    const handleVerifyOtp = () => {
        if (userCode === otpCode) {
            setIconMessage(<FontAwesomeIcon style={{ color: "green" }} icon={faCircleCheck} />)
            setMaineMessage("!خوش آمدید ")
            setErrorMessage(<h3 style={{ color: "green" }} >.ورود شما موفقیت‌آمیز بود</h3>);
            setIsErrorOpen(true);

            setTimeout(() => {
                navigate("/")
            }, 2000)

        } else {
            setIconMessage(<FontAwesomeIcon icon={faCircleExclamation} />)
            setMaineMessage("  !مشکلی پیش آمد")
            setErrorMessage(".کد وارد شده صحیح نیست");
            setIsErrorOpen(true);
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
                    <input className="numberInp" type="number" placeholder="مثلا 09027741653" value={number} onChange={(e) => setNumber(e.target.value)} />
                    <button onClick={handleSendNumber} className="btnSendNumber">ورود به آوای انعکاس</button>
                    <h6 className="Law">ورود شما به معنای پذیرش شرایط آوای انعکاس و قوانین حریم ‌خصوصی است</h6>
                </div>
            )}

            {step === 2 && (
                <div className="FirstStebContainer">
                    <div className="logoLogin">آوای <span className="logoLogin2">انعکاس</span></div>
                    <h2 className="titlecode" >کد تایید را وارد کنید</h2>


                    <div className="otpCode">
                        کد تایید شما: <strong>{otpCode}</strong>
                    </div>

                    <input className="numberInp" type="number" placeholder="کد ۵ رقمی" value={userCode} onChange={(e) => setUserCode(e.target.value)} />
                    <button onClick={handleVerifyOtp} className="btnSendNumber"> تایید و ورود</button>
                    <h4 onClick={() => setStep(1)} className="backBtn"><FontAwesomeIcon icon={faArrowLeft} /> ویرایش شماره</h4>
                </div>
            )}
        </>
    );
}

export default LogIn;