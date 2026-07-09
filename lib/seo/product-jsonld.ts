// lib/seo/product-jsonld.ts — Product/Offer structured data for the MIA FOUR
// product pages. Grounded and launch-cautious: single Offer, no aggregateRating,
// no reviews, no absolute availability promises. Consumers pass real, importer-
// backed values only (see lib/seo-pages.ts / lib/content.ts).

export type ProductAvailability =
  | "https://schema.org/InStock"
  | "https://schema.org/PreOrder"
  | "https://schema.org/LimitedAvailability";

export interface ProductJsonLdInput {
  id: string;
  name: string;
  description: string;
  image: string[];
  price: number;
  currency: "ILS";
  availability: ProductAvailability;
  url: string;
  model?: string;
  brand?: string;
}

// Shared, grounded product properties — reused across product pages and the
// homepage Product node so the claims can never drift. Deliberately conservative:
// no standard is asserted as fact, only conformance to applicable Israeli law.
export const PRODUCT_PROPERTIES = [
  { "@type": "PropertyValue", name: "מנוע", value: "עד 1,800W לפי דגם" },
  {
    "@type": "PropertyValue",
    name: "מסלול תשלומים",
    value: "עד 18 תשלומים ללא ריבית והצמדה, בכפוף לאישור עסקה",
  },
  { "@type": "PropertyValue", name: "תקינה ובטיחות", value: "כפוף לדין ולתקנות החלות בישראל" },
] as const;

export function buildProductJsonLd(input: ProductJsonLdInput) {
  return {
    "@type": "Product",
    "@id": `${input.url}#product`,
    name: input.name,
    brand: { "@type": "Brand", name: input.brand ?? "MiaMe" },
    ...(input.model ? { model: input.model } : {}),
    description: input.description,
    image: input.image,
    url: input.url,
    offers: {
      "@type": "Offer",
      priceCurrency: input.currency,
      price: input.price,
      availability: input.availability,
      url: input.url,
    },
    additionalProperty: PRODUCT_PROPERTIES,
  };
}
