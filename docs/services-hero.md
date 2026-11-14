# Services hero

The `/services` page starts with `components/services/services-hero.tsx`. It replaces the previous PageIntro; the remaining page content is unchanged except for `id="services-overview"`, the primary CTA's smooth-scroll target. The secondary CTA goes to `/contact`.

All text, links and four informational cards are server-rendered HTML. Card content is stored in `src/lib/services-hero.ts`. Shared icons and typography are reused. Dedicated semantic color tokens in `globals.css` keep this atmospheric hero dark in both themes, following the reference. Mobile shows copy, workstation scene, then cards. The illustration has reserved space and responsive Next.js Image sizes; no animation library or new dependency was added.

The heading “Сигурност и GDPR” is a topic label, accompanied by the supplied description about data protection and security practices; it does not assert complete legal compliance.

## Asset

`public/images/services-studio-v1.webp`: 1440 × 1080, optimized WebP. It is decorative (`alt=""`), separate from all functional UI. Built-in image generation used the supplied `Комплексни решения за онлайн присъствие.png` as visual reference.

Final prompt:

Use case: photorealistic-natural. Create a cinematic premium web developer workspace photograph to use as a separate right-side hero image on Saitena services page, closely matching the RIGHT half of reference image. Large modern desktop monitor on walnut desk, screen displays a beautiful blue business website preview with mountain image on left and a realistic code editor on right, small subtle Saitena mark in website header. Desk lamp above monitor with warm amber light, blue evening window ambience, keyboard and mouse on desk, dark blue mug with small simple blue S, plants on either side, shelves softly blurred. Deep navy and cobalt blue, tasteful warm highlights, photoreal polished editorial lighting, no people. Monitor and desk fully readable within composition. Landscape 4:3 framing, main monitor toward center-right, left edge fades into very dark navy shadow so HTML text can be placed to left of asset. No headline, no CTA buttons, no feature cards, no website page banner, no watermark, no readable marketing copy over the photograph. Only the workstation scene.
