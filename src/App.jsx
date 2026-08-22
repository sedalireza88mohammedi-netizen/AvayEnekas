import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from "./Components/Home/Home";
import Menu from "./Components/Menu/Menu";
import LogIn from './LoggIn/Login';
import Catagoryes from './Components/Catagoryes/Catagortes';
import Cart from './Components/Cart/Cart';
import Footer from './Components/Footer/Footer';
import Profile from './Components/Profile/Profile';
import AdminPanel from './Components/AdminPannel/AdminPannel';


function App() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // لیست صفحاتی که نمی‌خواهیم فوتر در آن‌ها باشد
  const hideFooterPaths = ["/login/sinup", "/catagoryes","/AdminPannel"];

  // چک کردن اینکه آیا مسیر فعلی در لیست ممنوعه هست یا خیر
  // .some() بررسی می‌کند که آیا مسیر فعلی با یکی از موارد لیست شروع می‌شود یا خیر
  const shouldHideFooter = hideFooterPaths.some(p => path.startsWith(p));
  const shouldHideMenu = hideFooterPaths.some(p => path.startsWith(p));

  return (
    <>
     {!shouldHideFooter && (
        <Menu isCart={path === "/cart"||"/AdminPannel" }  />
      )}
      
      
      <nav className={`navbar ${path === '/cart' ? 'navbar-cart-page' : ''}` }></nav>

      <Routes>
        <Route path='/AdminPannel' element={<AdminPanel />}/>
        <Route path='/Profile' element={<Profile />}/>
        <Route path="/" element={<Home />} />
        <Route path="/LogIn/SinUp" element={<LogIn />} />
        <Route path='/Catagoryes' element={<Catagoryes />} />
        <Route path='/Cart' element={<Cart />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* نمایش فوتر فقط در صورتی که نباید مخفی شود */}
      {!shouldHideFooter && (
        <Footer isCart={path === "/cart"} />
      )}
    </>
  );
}

export default App;