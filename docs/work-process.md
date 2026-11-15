# Work process section

WorkProcess is directly after ServicesCatalog on /services. It replaces the old three-step Process occurrence, avoiding duplicate process summaries; the legacy shared component is retained. Other page content stays in place.

Five ordered steps are server-rendered from src/lib/work-process.ts. Decorative numbers supplement the ordered list; H2 and H3 hierarchy is retained. Desktop above 1449px shows five cards and decorative horizontal connectors. Intermediate layouts use three or two columns; mobile uses one column without connectors. Both themes use the same semantic tokens as the services catalogue. No motion or new dependencies are required.

CTA destinations: /contact and /contact#contact-form.

## Illustrations

Four transparent 320 × 320 WebPs are at public/images/process-{planning,offer,development,launch}-v1.webp (58,784 bytes combined). The fifth illustration reuses public/images/services-support-v1.webp. Next.js images are lazy-loaded and reserve square space.

Built-in image generation used Етапи на работа_ Пътят към успешен сайт.png as reference.

## Final prompts

### planning

Use case: stylized-concept. One standalone transparent 3D illustration for a Saitena process-step card. Closely match the attached reference's polished soft clay illustrations. Subject: Two overlapping rounded speech bubbles, one white and one cobalt blue, each with small blue dots, representing discovery and planning. Centered compact square framing, whole object contained with minimal margin. Cobalt blue, pale periwinkle and white, gentle three-quarter perspective, soft studio lighting, subtle contact shadow. Genuine alpha transparency, no rectangular background. Legible on both white and deep navy. No readable text, no number, no label, no surrounding card or banner, no watermark. Only this individual illustration.

### offer

Use case: stylized-concept. One standalone transparent 3D illustration for a Saitena process-step card. Closely match the attached reference's polished soft clay illustrations. Subject: A softly beveled white checklist sheet with blue checkmarks and short abstract blue lines, and a violet pen diagonally alongside. No text. Centered compact square framing, whole object contained with minimal margin. Cobalt blue, pale periwinkle and white, gentle three-quarter perspective, soft studio lighting, subtle contact shadow. Genuine alpha transparency, no rectangular background. Legible on both white and deep navy. No readable text, no number, no label, no surrounding card or banner, no watermark. Only this individual illustration.

### development

Use case: stylized-concept. One standalone transparent 3D illustration for a Saitena process-step card. Closely match the attached reference's polished soft clay illustrations. Subject: A modern small desktop monitor with silver stand and bright cobalt screen displaying large white code brackets, representing website development. Centered compact square framing, whole object contained with minimal margin. Cobalt blue, pale periwinkle and white, gentle three-quarter perspective, soft studio lighting, subtle contact shadow. Genuine alpha transparency, no rectangular background. Legible on both white and deep navy. No readable text, no number, no label, no surrounding card or banner, no watermark. Only this individual illustration.

### launch

Use case: stylized-concept. One standalone transparent 3D illustration for a Saitena process-step card. Closely match the attached reference's polished soft clay illustrations. Subject: A rounded white-and-blue browser window with small circular controls and a prominent blue circular checkmark badge in its center, representing approval and launch. Centered compact square framing, whole object contained with minimal margin. Cobalt blue, pale periwinkle and white, gentle three-quarter perspective, soft studio lighting, subtle contact shadow. Genuine alpha transparency, no rectangular background. Legible on both white and deep navy. No readable text, no number, no label, no surrounding card or banner, no watermark. Only this individual illustration.

