import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Menu from './Components/Menu/Menu';
import Footer from './Components/Footer/Footer';

const Home = lazy(() => import('./Components/Home/Home'));
const LogIn = lazy(() => import('./LoggIn/Login'));
const Catagoryes = lazy(() => import('./Components/Catagoryes/Catagortes'));
const Cart = lazy(() => import('./Components/Cart/Cart'));
const Profile = lazy(() => import('./Components/Profile/Profile'));
const AdminPanel = lazy(() => import('./Components/AdminPannel/AdminPannel'));
const ProductDeatelse = lazy(() => import('./Components/ProductDeatelse/ProductDeatelse'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // صفحاتی که نه منو و نه فوتر می‌خواهند
  const barePaths = ['/login/sinup', '/adminpannel'];
  const hideChrome = barePaths.some((p) => path.startsWith(p));

  const isCart = path === '/cart';

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Menu isCart={isCart} />}

      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="/LogIn/SinUp"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <LogIn />
            </Suspense>
          }
        />
        <Route
          path="/Catagoryes"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <Catagoryes />
            </Suspense>
          }
        />
        <Route
          path="/Cart"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <Cart />
            </Suspense>
          }
        />
        <Route
          path="/Profile"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/AdminPannel"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <AdminPanel />
            </Suspense>
          }
        />
        <Route
          path="/Product/:id"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <ProductDeatelse />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideChrome && <Footer isCart={isCart} />}
    </>
  );
}

export default App;