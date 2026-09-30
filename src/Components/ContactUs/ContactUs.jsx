import "./ContactUs.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
export default function ContactUs() {
  return (
    <>
      <div className="TopPartContact">
        
        <div className="ChildConatct">
          <h1 className="IconContact"> <FontAwesomeIcon  icon={faLocationDot} /></h1>
        
        </div>
        
      </div>
    </>
  )
}