import { useEffect, useState } from 'react';

const DEFAULT_FALLBACK = '/Images/placeholder.svg';

/** تصویر با جایگزین خودکار هنگام خطا، lazy-load پیش‌فرض و alt همیشه موجود */
export default function SafeImg({
  src,
  fallback = DEFAULT_FALLBACK,
  alt = '',
  loading = 'lazy',
  ...rest
}) {
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    <img
      src={current}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => current !== fallback && setCurrent(fallback)}
      {...rest}
    />
  );
}
