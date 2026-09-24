import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getCart, addCartItem, getFavorites, addFavorite, removeFavorite, getMyMessages, markMessageRead } from './api';

const StoreContext = createContext(null);

export function useCartStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useCartStore باید داخل StoreProvider استفاده شود');
  return ctx;
}

function toItemsMap(data) {
  const map = {};
  (data && Array.isArray(data.items) ? data.items : []).forEach((i) => {
    map[Number(i.product_id)] = Number(i.quantity) || 0;
  });
  return map;
}

export function StoreProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState({});
  const [favorites, setFavorites] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const favRef = useRef(favorites);
  const booted = useRef(false);

  useEffect(() => {
    favRef.current = favorites;
  }, [favorites]);

  const refreshCart = useCallback(async () => {
    try {
      const data = await getCart();
      const map = toItemsMap(data);
      setCartItems(map);
      setCartCount(Object.keys(map).length);
    } catch {
      /* آفلاین/خطای سرور — عدد قبلی می‌ماند */
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    try {
      const favs = await getFavorites();
      setFavorites(new Set((favs || []).map((f) => Number(f.id))));
    } catch {
      /* نادیده گرفته می‌شود */
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      const msgs = await getMyMessages();
      setUnreadCount((msgs || []).filter((m) => !m.is_read).length);
    } catch {
      /* نادیده گرفته می‌شود */
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    refreshCart();
    refreshFavorites();
    refreshMessages();
  }, [refreshCart, refreshFavorites, refreshMessages]);

  const addToCart = useCallback(async (product, qty = 1) => {
    const applyMap = (map) => {
      setCartItems(map);
      setCartCount(Object.keys(map).length);
    };
    const bumpLocal = (prev) => {
      const next = { ...prev, [Number(product.id)]: (prev[Number(product.id)] || 0) + qty };
      setCartCount(Object.keys(next).length);
      return next;
    };
    try {
      const data = await addCartItem(product.id, qty, product.price, product.title, product.image);
      if (data && data.items) applyMap(toItemsMap(data));
      else setCartItems(bumpLocal);
    } catch {
      setCartItems(bumpLocal);
    }
  }, []);

  const inCart = useCallback((id) => (cartItems[Number(id)] || 0) > 0, [cartItems]);

  const markOneMessageRead = useCallback(
    async (id) => {
      try {
        await markMessageRead(id);
      } catch {
        /* بی توجه */
      }
      refreshMessages();
    },
    [refreshMessages]
  );

  const toggleFavorite = useCallback(
    async (id) => {
      const num = Number(id);
      const wasFav = favRef.current.has(num);
      if (wasFav) {
        setFavorites((prev) => {
          const s = new Set(prev);
          s.delete(num);
          return s;
        });
        removeFavorite(num).catch(() => refreshFavorites());
      } else {
        setFavorites((prev) => {
          const s = new Set(prev);
          s.add(num);
          return s;
        });
        addFavorite(num).catch(() => refreshFavorites());
      }
    },
    [refreshFavorites]
  );

  const isFavorite = useCallback((id) => favRef.current.has(Number(id)), []);

  return (
    <StoreContext.Provider
      value={{
        cartCount,
        cartItems,
        addToCart,
        refreshCart,
        inCart,
        favorites,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
        unreadCount,
        refreshMessages,
        markOneMessageRead,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}