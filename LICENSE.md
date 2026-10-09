# Licence â€” dashboard-hotel-premium

> This file records the licensing *position* of this product and the attributions you are
> obliged to keep. The commercial terms granted to the buyer are in Section 1. Upstream
> licence obligations â€” which survive any commercial grant â€” are in Section 2 and are not
> ours to waive.

---

## 1. This product

dashboard-hotel-premium â€” a Noctis Digital Forge product.

**Copyright (c) 2026 Noctis Digital Forge. All rights reserved.**

These files are **not open source** and are not covered by an OSI or FSF licence. The source
is provided under the commercial licence granted to you as the buyer. Absent that grant:

- you may not copy, modify, sublicense, resell, or redistribute the source or any substantial
  part of it, in original or modified form;
- you may not publish it, in whole or in part, as a template, starter, tutorial or open-source
  project;
- you may not use it to build a competing product that is distributed to third parties.

### Commercial grant

On payment, Noctis Digital Forge grants the purchasing **organisation** â€” not an individual â€”
a non-exclusive, perpetual, worldwide licence to use, copy and modify this product's source in
order to build and run applications for that organisation and for its own clients.

**What is granted**

- **Seats: unlimited.** Everyone employed or contracted by the purchasing organisation may
  access and modify the source. No per-seat counting, no per-developer fee.
- **Projects: unlimited.** The organisation may build, deploy and operate any number of
  applications from this product, including applications it is paid to build for its clients.
- **Modification: permitted.** The organisation may change any part of the source, add to it
  and drop what it does not need. Modified source remains under this licence.

**What is not granted**

- The organisation may not resell, sublicense, share or otherwise distribute this product's
  source, or any recognisable part of it, to a third party â€” except as compiled, running
  applications delivered to its own clients.
- The organisation may not publish this product or a recognisable derivative of it, publicly or
  in confidence, as a template, starter, boilerplate, tutorial or open-source project.
- The organisation may not use this product as the basis of a competing product distributed to
  third parties.
- This licence is not transferable to another legal entity without written consent.

**Service terms.** Updates released within **12 months** of purchase are included; after that
period no further updates are promised. Installation and set-up questions are answered by
email for **90 days** from purchase. Custom development, feature work and hosting are not
included. Refund terms are those stated at the point of sale.

Nothing above limits Section 4 (no warranty) or the obligations in Section 2, which come from
the upstream authors and survive this grant.

---

## 2. What you must keep

Even under a commercial licence, these obligations survive, because they belong to the
upstream authors:

| Source | Licence | Obligation |
| ------ | ------- | ---------- |
| | React, Vite, Next.js and the packages declared in `package.json` | MIT / ISC / Apache-2.0 (see `package.json`) | Retain copyright and permission notices in any copy or substantial portion |
| Google Fonts and Font Awesome Free, where loaded from a CDN | SIL OFL / CC BY 4.0 / MIT | Retain the font and icon licence notices | |

Third-party components fall into two groups:

- **npm dependencies** â€” declared in `package.json`. Their licence metadata is authoritative
  there; the tree is dominated by MIT/ISC/Apache-2.0/BSD packages. Regenerate the list before
  each release with `npx license-checker --summary` and review anything that is not
  MIT, ISC, Apache-2.0 or BSD.
- **CDN-loaded assets** (fonts, icon sets) â€” credited in `index.html` or the HTML head. The
  font and icon licences (typically Google Fonts under the SIL Open Font License, Font Awesome
  Free under CC BY 4.0 / MIT) apply to those files directly and are not ours to relicense.

Original code, markup, styles and design decisions in this product are Noctis originals and
fall under Section 1.

---

## 3. Data and credentials

This product ships **no** API keys, tokens or service credentials. If the folder contains an
`.env`, `.env.local` or similar file on your working copy, that file is local configuration,
is excluded from any archive you publish, and must be rotated before the product is
transferred or deployed. Never commit it.

Any company name, telephone number, e-mail address or logo that appears in demo content is
sample data for layout purposes. Replace it before publication.

---

## 4. No warranty

The product is provided "as is", without warranty of any kind, express or implied, including
the implied warranties of merchantability, fitness for a particular purpose and
non-infringement. The buyer is responsible for testing, hardening and operating the deployed
application.

---

## 5. Trademarks

"Noctis", "Noctis Digital Forge" and related marks are the property of Noctis Digital Forge.
This licence grants no trademark rights. Do not use the names in your product's name, domain
or marketing in a way that suggests endorsement.

---

(c) 2026 Noctis Digital Forge. All rights reserved.

