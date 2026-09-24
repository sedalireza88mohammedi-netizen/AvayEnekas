import { useEffect, useState } from 'react';

export default function SafeImg({ src, fallback = '/Images/placeholder.svg', ...rest }) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <img
      src={current}
      onError={() => current !== fallback && setCurrent(fallback)}
      {...rest}
    />
  );
}