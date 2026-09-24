import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ShoppingBag, Loader2, X } from 'lucide-react';
import "./Cart.css";
import { getCart, updateCartItem, removeCartItem, checkoutCart } from '../../api';
import { useCartStore } from '../../cartStore';
import { usePageMeta } from '../../useSeo';
import SafeImg from '../../SafeImg';

const toPersianDigits = (num) =>
  (num || 0).toString().replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

const formatPrice = (price) =>
  (price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', phone: '', address: '', email: '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const { refreshCart } = useCartStore();

  usePageMeta({ title: 'سبد خرید | آوای انعکاس' });

  useEffect(() => {
    let active = true;
    getCart()
      .then((data) => active && setCart(data))
      .catch(() => active && setCart({ total_items: 0, total_price: 0, items: [] }))
      .finally(() => active && setLoading(false));
    refreshCart();
    return () => { active = false; };
  }, [refreshCart]);

  const refresh = async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch {
      setCart({ total_items: 0, total_price: 0, items: [] });
    }
    refreshCart();
  };

  const changeQty = async (item, quantity) => {
    if (quantity <= 0) return removeItem(item);
    if (quantity > (item.stock || 0)) quantity = item.stock || 1;
    setBusy(true);
    try {
      const data = await updateCartItem(item.product_id, quantity);
      if (data) setCart(data);
      else await refresh();
    } catch {
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item) => {
    setBusy(true);
    try {
      const data = await removeCartItem(item.product_id);
      if (data) setCart(data);
      else await refresh();
    } catch {
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const submitCheckout = async (e) => {
    e.preventDefault();
    if (!form.customer.trim() || !form.phone.trim()) {
      setError('نام و شماره تماس الزامی است.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await checkoutCart({
        customer: form.customer.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
      });
      setOrder(result);
      setCheckoutOpen(false);
      setForm({ customer: '', phone: '', address: '', email: '' });
      await refresh();
    } catch (err) {
      setError('ثبت سفارش ناموفق بود؛ دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loader-back"><span className="cart-loader" />در حال بارگذاری سبد...</div>
      </div>
    );
  }

  const items = (cart && cart.items) || [];
  const totalPrice = cart && cart.total_price ? cart.total_price : 0;
  const totalItems = cart && cart.total_items ? cart.total_items : 0;
  const totalDiscount = cart && cart.total_discount ? cart.total_discount : 0;

  return (
    <div className="cart-page">
      <div className="cart-head">
        <h1>سبد خرید</h1>
        {totalItems > 0 && <span className="cart-head-count">{toPersianDigits(totalItems)} کالا</span>}
      </div>

      {order && (
        <div className="cart-order-success">
          <ShoppingBag size={40} />
          <h2>سفارش شما ثبت شد</h2>
          <p>
            کد پیگیری: <strong>{order.id}</strong>
          </p>
          <p className="cart-order-status">وضعیت: {order.status}</p>
          <div className="cart-order-actions">
            <Link to="/" className="cart-btn-primary">بازگشت به فروشگاه</Link>
            <button className="cart-btn-ghost" onClick={() => setOrder(null)}>بستن</button>
          </div>
        </div>
      )}

      {!order && items.length === 0 && (
        <div className="cart-empty">
          <ShoppingCart size={56} />
          <h2>سبد خرید شما خالی است</h2>
          <p>محصولی در سبد خرید شما نیست؛ از فروشگاه خرید کنید.</p>
          <Link to="/" className="cart-btn-primary">مشاهده محصولات</Link>
        </div>
      )}

      {!order && items.length > 0 && (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product_id} className="cart-item">
                <Link to={`/Product/${item.product_id}`} className="cart-item-img">
                  <SafeImg src={item.image} alt={item.name} width="90" height="90" />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/Product/${item.product_id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <span className="cart-item-unit">
                    {toPersianDigits(formatPrice(item.price))} تومان
                    {item.oldPrice > item.price && item.discount > 0 && (
                      <s className="cart-item-old">{toPersianDigits(formatPrice(item.oldPrice))} تومان</s>
                    )}
                  </span>
                  {item.stock <= 0 && <span className="cart-item-nostock">ناموجود</span>}
                </div>
                <div className="cart-item-qty">
                  <button
                    onClick={() => changeQty(item, item.quantity - 1)}
                    disabled={busy}
                    aria-label="کاهش تعداد"
                  >
                    <Minus size={15} />
                  </button>
                  <span>{toPersianDigits(item.quantity)}</span>
                  <button
                    onClick={() => changeQty(item, item.quantity + 1)}
                    disabled={busy || item.quantity >= item.stock}
                    aria-label="افزایش تعداد"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <span className="cart-item-subtotal">
                  {toPersianDigits(formatPrice(item.subtotal))} تومان
                </span>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item)}
                  disabled={busy}
                  aria-label="حذف از سبد"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>خلاصه سفارش</h3>
            <div className="cart-summary-row">
              <span>تعداد کالا</span>
              <span>{toPersianDigits(totalItems)}</span>
            </div>
            <div className="cart-summary-row">
              <span>جمع قیمت</span>
              <span>{toPersianDigits(formatPrice(totalPrice))} تومان</span>
            </div>
            {totalDiscount > 0 && (
              <div className="cart-summary-row cart-summary-discount">
                <span>مجموع تخفیف‌ها</span>
                <span>{toPersianDigits(formatPrice(totalDiscount))} تومان</span>
              </div>
            )}
            <button
              className="cart-checkout-btn"
              onClick={() => setCheckoutOpen(true)}
              disabled={busy}
            >
              ثبت سفارش
            </button>
            <Link to="/" className="cart-continue">ادامه خرید</Link>
          </div>
        </div>
      )}

      {checkoutOpen && !order && (
        <div className="cart-modal-back">
          <div className="cart-modal">
            <button className="cart-modal-close" onClick={() => setCheckoutOpen(false)} aria-label="بستن">
              <X size={18} />
            </button>
            <h3>اطلاعات سفارش</h3>
            <form onSubmit={submitCheckout} className="cart-modal-form">
              <input
                placeholder="نام و نام خانوادگی *"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              />
              <input
                placeholder="شماره تماس *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                placeholder="آدرس"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                placeholder="ایمیل (اختیاری)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {error && <p className="cart-modal-error">{error}</p>}
              <button className="cart-checkout-btn" type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="cart-spin" /> : 'نهایی کردن سفارش'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}