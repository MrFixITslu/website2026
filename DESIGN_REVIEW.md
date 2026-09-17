# V79 Digital: design, positioning and conversion review

Reviewed 17 September 2026 against main commit `77ee06510676b7964df45fb9651f394ff551799c` and the supplied original logo. Target: small and medium businesses in Saint Lucia seeking ICT support, SaaS and cloud services. This is a source-code and local-render review; the live website could not be retrieved in this session. It is not a new security certification or live Lighthouse measurement.

## Implemented in this change

- Original 1254 × 1254 PNG copied byte-for-byte into `public/v79-digital-original.png`. SHA-256: `6592779e44897938afce87dafc48cccc549745f79d27f7dd8646793350582c0c`.
- `src/components/V79OfficialLogo.tsx`: replace recreated wordmarks, SVG substitutions and theme-specific fallbacks with that exact image. No crop, recolouring, filters, background removal or generated replacement.
- `src/App.tsx`: display the full logo in the header and footer; increase header space and update navigation offsets together so headings and the mobile menu remain below it.
- `index.html`: original image used for icons, social previews and organization/service image metadata; image dimensions match the actual asset.

The original has substantial white margins and small tagline lettering. Its full square shape is retained. At favicon size the tagline will not be readable. A separately approved compact mark would improve this, but is outside the instruction to preserve the supplied artwork. The 2 MB original also adds image-transfer cost; no lossy optimisation has been applied.

## Recommended positioning

Headline: **Practical IT support for your growing business.**

Supporting text: **ICT support, cloud services and business software for small and medium businesses in Saint Lucia. Get help with your computers, networks, email, backups and everyday workflows.**

Primary action: **Discuss your IT needs**. Secondary action: **Explore our services**. Keep WhatsApp available without competing with three other equally prominent buttons.

Founder introduction: **V79 Digital is a new business founded by Neil Verdant. It brings together the experience he gained working with AT&T, Cingular and Digicel, including Digicel Dominica, to support small and medium businesses with practical technology solutions.**

These are the founder's previous employers, not V79 Digital clients, partners or endorsers. Present their names in a career-experience paragraph, not a customer-logo strip. Add specific career achievements only with accurate scope and permission where needed.

## Priority 1: accuracy and lead capture

| Finding | Recommendation | Files |
|---|---|---|
| Home claims “Since 2018”, financially backed 99.9% uptime and a guaranteed 4-hour response. | Replace company-age and performance counters with the founder introduction, service area and a clear explanation of how an engagement works. Publish response commitments only once staffing, service hours, exclusions and written terms support them. | `src/components/HomePage.tsx`, `src/App.tsx` |
| About blends personal experience with company history; team includes unconfirmed vacancies and a generic LinkedIn URL. | Use the founder paragraph above, verified career milestones and the actual founder profile. Remove recruitment cards unless the roles are genuinely open. | `src/components/AboutPage.tsx` |
| Service cards promise fixed response/recovery/audit deadlines; assessment pricing and scope require confirmation. | Describe practical outcomes and deliverables. Replace blanket SLA labels with “Scope and response arrangements agreed in your proposal”. Confirm the EC$1,500 assessment price before promoting it. | `src/components/ServicesPage.tsx`, `src/components/IndustriesPage.tsx` |
| Contact claims “never shared” despite configurable external delivery and CAPTCHA; immediate-response language may create false expectations. | Explain the actual enquiry-processing purpose and relevant service providers in an accessible privacy notice. Publish a response window the business can meet. Keep marketing opt-in separate and optional if added. | `src/components/ContactPage.tsx`, `server.ts` |
| The page asks for several business details before first contact. | First step: name, preferred contact method, contact details and short description. Make team size, budget and detailed technical questions optional. Keep field errors, submission state, duplicate protection and a persistent confirmation. | `src/components/ContactPage.tsx` |

Before calling the form production-ready, send a consented test enquiry on the actual HTTPS site; verify one CRM record, the true delivery status and operator notification. Test missing/invalid CAPTCHA, retry behaviour and a mobile submission. Do not weaken the existing server validation, rate limits, origin checks or administrator authentication for conversion convenience.

## Priority 2: modern design and useful interaction

Use the logo's navy, blue and teal with a predominantly white background and generous spacing. Reserve one accessible blue for primary actions. Coral, purple, neon glows and multiple competing gradients currently make the brand less coherent. Keep dark mode only if both themes receive contrast and visual checks.

Recommended order: hero → three customer needs → services → founder experience → SaaS demonstrations → how we work → FAQs → enquiry. Move long technical assessments and simulators below the essential business message. Navigation: Services, Business software, About, Resources, Contact.

| Improvement | Behaviour | Files |
|---|---|---|
| “What do you need help with?” selector | Three keyboard-accessible options: IT support; cloud/email/backups; business software. Show relevant services and carry the selection into the enquiry form without submitting automatically. | `HomePage.tsx`, `ContactPage.tsx` |
| Service cards | State the problem, outcome, typical deliverables and next step. Use plain language before acronyms. | `ServicesPage.tsx` |
| SaaS cards | Real screenshots, who each product helps, honest availability, and separate “View demo” / “Ask about this product” actions. Remove unverified ratings and student/customer counters. | `src/App.tsx`, `src/components/AppLogo.tsx` |
| Business examples | Show clearly labelled illustrative workflows for a shop, professional office and hospitality business. Do not present these as completed customer projects. | `IndustriesPage.tsx` |
| Accessibility | Aim for WCAG 2.2 AA: readable body text, verified contrast, visible focus, labelled controls, keyboard menus, reduced motion, touch-friendly targets, and focus management after navigation. | `src/index.css`, `src/App.tsx`, `src/components/ui/Button.tsx` |
| Simplify animation | Remove whole-page navigation fades and decorative counters; retain subtle feedback and useful accordions. Do not animate essential content from invisible states without a no-JavaScript strategy. | `src/App.tsx`, `HomePage.tsx` |

## Priority 2: search engines and AI discovery

1. Keep the same factual positioning in visible copy, page metadata, structured data and `public/llms.txt`. Those sources currently repeat unconfirmed guarantees and enterprise positioning. Do not publish an unverified legal suffix, address, opening hours, certifications or affiliations.
2. Create genuinely distinct, indexable service pages with useful text, normal `<a href>` links, unique titles/descriptions, matching canonical URLs and descriptive headings. The app currently relies heavily on client-rendered sections. Review `server.ts` dynamic metadata and route handling together with `src/App.tsx`, `index.html` and the runtime sitemap before adding URLs. A link in a sitemap is not proof that a page is useful or indexed.
3. Prefer prerendered or server-rendered public marketing content for reliable reading by crawlers that do not run JavaScript. Keep authenticated CRM and learner data outside that output.
4. Add visible, factual FAQs: what support includes; cloud migration process; software demonstration availability; how quotations work; service area. Structured data must match the visible content. Remove the current overstated FAQ answers from `index.html` when updating the page.
5. Check the actual `/robots.txt` and `/sitemap.xml` responses: `server.ts` generates them, so editing only files in `public` may not change production behaviour. Exclude private pages from indexing using appropriate response/meta directives; robots.txt is not access control.
6. Verify the domain in Google Search Console and Bing Webmaster Tools, submit the sitemap, and inspect the rendered homepage and service pages. Establish a truthful Google Business Profile appropriate to the business's location/service-area model.
7. Publish helpful Saint Lucia business guides with author, update date and real examples: choosing Microsoft 365, testing backups, office Wi-Fi, phishing prevention, and choosing business software. Avoid mass-generated location pages and fabricated case studies.

Google states that ordinary SEO fundamentals also apply to AI Overviews/AI Mode: crawlable pages, helpful text, internal links and accurate structured data. No special AI text file or schema guarantees inclusion. `llms.txt` may provide a concise optional summary; it is not a substitute for accessible pages or proof of AI discoverability.

Source: https://developers.google.com/search/docs/appearance/ai-features

## Priority 3: release and measurement

- Measure mobile and desktop performance after deployment, with special attention to the original PNG size, large JavaScript chunks, offscreen sections and third-party fonts. Do not claim improved scores without measurements.
- Track enquiry completion, WhatsApp/call clicks and product-demo enquiries with a documented privacy approach; do not include enquiry text or email addresses in analytics events.
- Verify HTTPS, actual trusted-proxy IP, secure cookies, CAPTCHA, CRM access isolation, backups and restore, logging and error handling on the deployed host. The earlier code audit and CI do not prove the present host configuration is secure.
- Retain the documented single-instance storage constraints and dependency update checks in `PRODUCTION.md`. Retest contact and admin workflows after UI changes.
- Release in order: original logo (this change); accurate positioning; simpler service/enquiry journeys; discoverable service pages; measured performance and conversion improvements.

This report proposes the broader redesign. Apart from the logo integration and its layout/metadata changes, these recommendations are not yet implemented.
