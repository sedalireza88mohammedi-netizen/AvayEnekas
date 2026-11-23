/** داده‌ی ساختاریافته (JSON-LD) برای نمایش بهتر در نتایج گوگل */

const SITE_NAME = "آوای انعکاس";

const absolute = (url) => (url ? new URL(url, window.location.origin).href : undefined);

export function buildOrganizationJsonLd() {
  const origin = window.location.origin;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name: SITE_NAME,
      url: origin,
      telephone: "+989027741653",
      sameAs: ["https://www.instagram.com/enekas_ava", "https://eitaa.com/enekas_ava"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: origin,
      inLanguage: "fa-IR",
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/AllProductList?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/** قیمت‌ها در سایت به تومان است؛ schema.org فقط ریال (IRR) را می‌شناسد */
export function buildProductJsonLd(product, { reviewsCount = 0 } = {}) {
  if (!product) return null;
  const origin = window.location.origin;
  const images = (
    Array.isArray(product.images) && product.images.length
      ? product.images.map((img) => img && img.url)
      : [product.image]
  )
    .filter(Boolean)
    .map(absolute);

  const inStock =
    product.stock === undefined || product.stock === null || Number(product.stock) > 0;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    sku: product.sku || String(product.id),
    image: images.length ? images : undefined,
  };

  if (product.price > 0) {
    data.offers = {
      "@type": "Offer",
      url: `${origin}/Product/${product.id}`,
      priceCurrency: "IRR",
      price: String(Math.round(product.price * 10)),
      availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
    };
  }

  if (reviewsCount > 0 && product.rating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: reviewsCount,
    };
  }
  return data;
}
