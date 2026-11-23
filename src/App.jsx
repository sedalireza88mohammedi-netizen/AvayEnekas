import { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Menu from './Components/Menu/Menu';
import Footer from './Components/Footer/Footer';
import ContactUs from './Components/ContactUs/ContactUs';
import ErrorBoundary from './ErrorBoundary';
import { useNoIndex } from './useSeo';
import { lazyWithRetry } from './lazyWithRetry';

const Home = lazyWithRetry(() => import('./Components/Home/Home'));
const LogIn = lazyWithRetry(() => import('./LoggIn/Login'));
const AllProductList = lazyWithRetry(() => import('./Components/AllProductList/AllProductList'));
const Cart = lazyWithRetry(() => import('./Components/Cart/Cart'));
const Profile = lazyWithRetry(() => import('./Components/Profile/Profile'));
const AdminPanel = lazyWithRetry(() => import('./Components/AdminPannel/AdminPannel'));
const ProductDeatelse = lazyWithRetry(() => import('./Components/ProductDeatelse/ProductDeatelse'));
const ArticleDeatelse = lazyWithRetry(() => import('./Components/Articles/ArticleDeatelse'));
const CategoriesPage = lazyWithRetry(() => import('./Components/Categories/Categories'));
const SectionAmazing = lazyWithRetry(() => import('./Components/Events/SectionAmazing/SectionAmazing'));
const SectionPopular = lazyWithRetry(() => import('./Components/Events/SectionPopular/SectionPopular'));
const SectionTrending = lazyWithRetry(() => import('./Components/Events/SectionTrending/SectionTrending'));
const SectionBestSeller = lazyWithRetry(() => import('./Components/Events/SectionBestSeller/SectionBestSeller'));


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
  const barePaths = ['/login', '/admin'];
  const hideChrome = barePaths.some((p) => path.startsWith(p));

  const isCart = path === '/cart';

  // سبد، پروفایل، ورود و پنل مدیریت نباید در گوگل ایندکس شوند
  const isPrivate = ['/cart', '/profile', '/login', '/adminpannel'].some((p) => path.startsWith(p));
  useNoIndex(isPrivate);

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Menu isCart={isCart} />}

      <ErrorBoundary resetKey={location.pathname}>
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
          path="/login"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <LogIn />
            </Suspense>
          }
        />
        <Route
          path="/LogIn"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <LogIn />
            </Suspense>
          }
        />
        <Route
          path="/AllProductList"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <AllProductList />
            </Suspense>
          }
        />
        <Route
          path="/products"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <AllProductList />
            </Suspense>
          }
        />
        <Route
          path="/Products"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <AllProductList />
            </Suspense>
          }
        />
        <Route
          path="/Sections/Amazing"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <SectionAmazing />
            </Suspense>
          }
        />
        <Route
          path="/Sections/Popular"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <SectionPopular />
            </Suspense>
          }
        />
        <Route
          path="/Sections/Trending"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <SectionTrending />
            </Suspense>
          }
        />
        <Route
          path="/Sections/BestSeller"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <SectionBestSeller />
            </Suspense>
          }
        />
        <Route
          path="/Categories"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <CategoriesPage />
            </Suspense>
          }
        />
        <Route
          path="/Catagoryes"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <CategoriesPage />
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
          path="/admin"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <AdminPanel />
            </Suspense>
          }
        />
        <Route
          path="/Admin"
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
        <Route
          path="/Article/:id"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <ArticleDeatelse />
            </Suspense>
          }
        />
        <Route
          path="/ContactUs"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <ContactUs />
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <ContactUs />
            </Suspense>
          }
        />
        <Route
          path="/Contact"
          element={
            <Suspense fallback={<div className="page-loader" />}>
              <ContactUs />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>

      {!hideChrome && <Footer isCart={isCart} />}
    </>
  );
}

export default App;