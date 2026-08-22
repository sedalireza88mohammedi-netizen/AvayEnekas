import "./ErrorEmpty.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHouse, faArrowRight, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from "react";

library.add(faCircleExclamation);

function ErrorEmpty({ isOpen, onClose, message, MaineMessage, iconMessage, }) {

    useEffect(() => {
        if (isOpen) {

            const timer = setTimeout(() => {
                onClose();
            }, 5000);


            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="ErrorContainer">
                <h1 className="errorIcon">
                    {iconMessage}
                </h1>
                <h1 className="titleErr">{MaineMessage}</h1>
                <h3 className="problem">{message}</h3>

                <button className="GotIt" onClick={onClose}>فهمیدم</button>
            </div>
        </div>
    );
}

export default ErrorEmpty;