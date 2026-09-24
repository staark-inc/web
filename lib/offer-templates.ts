export type OfferTemplatePreset = {
  id: string;
  name: string;
  title: string;
  scope: string;
  terms: string;
  oneTimePrice: string;
  monthlyPrice: string;
  includedMonths: number;
};

export const OFFER_TEMPLATES: OfferTemplatePreset[] = [
  {
    id: "standard-website",
    name: "Standard Website",
    title: "Website",
    scope:
      "Modern responsive website\nSEO-ready structure\nContact form and clear calls to action\nPerformance optimisation\nBasic analytics setup\nLaunch and handover",
    terms:
      "Final scope and timeline are confirmed before work starts. Content and feedback from the client are required according to the agreed schedule. Prices are excluding VAT.",
    oneTimePrice: "",
    monthlyPrice: "",
    includedMonths: 6,
  },
  {
    id: "website-seo",
    name: "Website + SEO",
    title: "Website + SEO",
    scope:
      "Modern responsive website\nSEO keyword and competitor review\nOn-page SEO for agreed pages\nLocal SEO foundations\nGoogle Search Console / analytics setup\nPerformance optimisation\nLaunch and handover",
    terms:
      "SEO work improves the technical and content foundation but does not guarantee a specific ranking. Final scope and timeline are confirmed before work starts. Prices are excluding VAT.",
    oneTimePrice: "",
    monthlyPrice: "",
    includedMonths: 6,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    title: "E-commerce website",
    scope:
      "Responsive online store\nProduct and category structure\nCart and checkout setup\nPayment and shipping integration\nBasic SEO setup\nAnalytics setup\nPerformance optimisation\nLaunch and handover",
    terms:
      "Payment-provider, shipping-provider and third-party fees are not included unless stated separately. Product content is supplied by the client unless otherwise agreed. Prices are excluding VAT.",
    oneTimePrice: "",
    monthlyPrice: "",
    includedMonths: 6,
  },
  {
    id: "custom",
    name: "Custom / Empty",
    title: "",
    scope: "",
    terms: "",
    oneTimePrice: "",
    monthlyPrice: "",
    includedMonths: 6,
  },
];
