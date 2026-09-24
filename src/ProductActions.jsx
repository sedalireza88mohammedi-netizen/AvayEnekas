import { useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from './cartStore';

export function FavButton({ id, size = 22 }) {
  const { isFavorite, toggleFavorite } = useCartStore();
  const fav = isFavorite(id);
  return (
    <button
      type="button"
      className={`fav-btn${fav ? ' active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
      }}
      aria-label={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
      title={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
    >
      <Heart size={size} fill={fav ? '#b72f2f' : 'none'} color={fav ? '#b72f2f' : '#9ca3af'} strokeWidth={2} />
    </button>
  );
}

export function AddToCartBtn({ product, size = 18 }) {
  const { addToCart, inCart } = useCartStore();
  const [pending, setPending] = useState(false);
  const inCartFlag = inCart(product && product.id);
  const stock = product ? Number(product.stock) : 0;

  const handle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product || inCartFlag || pending || stock <= 0) return;
    setPending(true);
    addToCart(product, 1).then(
      () => setPending(false),
      () => setPending(false)
    );
  };

  if (!product) return null;

  if (inCartFlag) {
    return (
      <button
        type="button"
        className="add-cart-btn done"
        disabled
        aria-label="در سبد خرید"
        title="در سبد خرید"
      >
        <Check size={size} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="add-cart-btn"
      onClick={handle}
      disabled={pending || stock <= 0}
      aria-label="افزودن به سبد خرید"
      title={stock <= 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
    >
      <ShoppingCart size={size} />
    </button>
  );
}