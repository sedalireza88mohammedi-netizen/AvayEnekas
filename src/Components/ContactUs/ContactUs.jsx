import "./ContactUs.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faLocationDot, faLocationPin, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
export default function ContactUs() {
   const neshanUrl = "https://neshan.org/maps/search/آوای انعکاس، قم";
  return (
    <>
      <div className="TopPartContact">
        <h1 className="HedContact">ارتباط با ما</h1>
        <div className="ContactContainer">
          <div className="ChildConatct">
            <h1 className="IconContact"> <FontAwesomeIcon icon={faPhone} /></h1>
            <h2>09027741653 / 09910756366</h2>
          </div>
          <div className="ChildConatct">
            <h1 className="IconContact"> <FontAwesomeIcon icon={faInstagram} /></h1>
            <h2><a href="https://www.instagram.com/enekas_ava?igsh=MWVob2ppamdlcWtqMg==">enekas-ava</a></h2>
          </div>
          <div className="ChildConatct">
            <h1 className="IconContact"> <FontAwesomeIcon icon={faClock} /></h1>
            <h2 className="Time">تمام روز های هفته به جز جمعه از ساعت 10 صیح تا 12 شب</h2>
          </div>
          <div className="ChildConatct">
            <h1 className="IconContactItta"><img src="Images/Itta-Icon.jpg" alt="ایتای ما" /></h1>
            <h2><a title='نشانی ایتا ما' href="https://eitaa.com/enekas_ava" target='_blank'>enekas-ava</a></h2>
          </div>
          <div className="AddressContact">
                   <h1 className="IconContactAddress"> <FontAwesomeIcon icon={faLocationDot} /></h1>
              <h2>قم خیابان جهوری بلوار سعادتی نرسیده به پمپ بنزین کوچه محممد نزاد پلاک 100 فروشگاه آوای انعکاس</h2>
          </div>
        </div>
           <div className="footer-mapContact" onClick={() => window.open(neshanUrl, "_blank")}>
                        <img title="موقعیت مکانی فروشگاه آوای" src="Images/Map-Image.jpg" alt="لوکیشن فروشگاه آوای انعکاس" className="map-image" />
                    </div>
      </div>
    </>
  )
}