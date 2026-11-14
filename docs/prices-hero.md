# Prices hero

`PricesHero` replaces only the former hero on `/prices`. The plans, comparison, custom offer, security section, FAQ, metadata and canonical configuration remain unchanged. Its anchor targets `subscription-plans-title`; the secondary CTA goes to `/contact`.

The generated decorative illustration is stored at `public/images/prices-hero-v1.webp` (1100 × 1100, transparent WebP) and uses Next.js responsive image loading with reserved aspect ratio. Plan names START, BUSINESS and PREMIUM match the existing data; BUSINESS is emphasized consistently with `featured: true`. No generated prices or numerical feature values appear in the artwork.

## Privacy wording review

The current contact endpoint validates input, restricts origins, limits requests/body size, and runs only locally. However, `pages.tsx` still contains placeholder privacy information for controller identity, purposes, retention periods and providers. This code review does not establish full GDPR compliance. The hero therefore uses “Защита на личните данни” instead of “GDPR съвместимост”, as permitted by the task's instruction not to make an unverified compliance guarantee. No legal content or data-processing configuration was changed.

## Illustration generation

Built-in image generation was used with the user's `Цени за сайтове с ясни планове.png` as visual reference. Final prompt:

Use case: stylized-concept. Generate only a standalone transparent 3D illustration for the RIGHT half of a Saitena prices hero. Match the attached reference's right-side composition and polished soft 3D style: modern silver laptop viewed nearly front-on with slight perspective, its screen showing a clean blue/white subscription page with three cards labeled exactly START, BUSINESS, PREMIUM. BUSINESS middle card is cobalt blue and visually emphasized; others white, tiny abstract checklist rows, no prices, no numerical values, no Popular/Recommended labels. Small Saitena wordmark in screen header only. Large blue shield check standing at bottom right, small white plant pot with green plant behind, plain white mug, floating small UI browser tile and rising blue bar-chart tile. Soft pale blue/periwinkle accents, refined soft contact shadows. Compact square composition all objects fully contained with little margin, genuine transparent background. No headline, no CTA buttons outside the laptop, no banner, no surrounding website text, no watermark. Actual plan names as above, do not invent features or amounts.
