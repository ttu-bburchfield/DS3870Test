# Accessibility audit — September 30, 2026

Scope: this single-page site, evaluated against applicable WCAG 2.2 Level A and AA criteria. Reference: https://www.w3.org/TR/WCAG22/

## Findings and corrections

| Finding | Relevant criteria | Correction and retest |
| --- | --- | --- |
| At 320 CSS pixels with WCAG text-spacing overrides, the document expanded to 333px. Hiding the hero line break joined “next” and “thing” without a space. | 1.4.12 Text Spacing; related 1.4.10 Reflow | Added the missing space. Retest: 320px document at 320px viewport, including text-range checks. |
| Pristine and corrected fields referenced hidden error messages through `aria-describedby`. Hidden referenced text still forms an accessible description, so users could encounter premature or stale error instructions. | 3.3.1 Error Identification; 3.3.2 Labels or Instructions | Error descriptions are attached only to invalid fields and removed when valid. Persistent project guidance stays associated. Initial and valid-state assertions pass. The service instruction now explicitly requires at least one selection. |
| The secondary button's identifying border had 2.13:1 contrast against its background. | 1.4.11 Non-text Contrast | Darkened the boundary from `#a4aeb9` to `#788699`. Measured retest: 3.51:1. |

Additional defensive improvements: strengthened the focus-rule selector against theme overrides; added scroll clearance for focused controls; made the header non-sticky at narrow widths and short heights. These are robustness improvements, not additional confirmed baseline failures. Asset version strings ensure browsers load the matching HTML, CSS, and validation changes together.

## Verification

The reusable browser suite is `tests/accessibility.html`, with implementation in `tests/accessibility.js`. Serve the project over HTTP and open `/tests/accessibility.html`, then activate **Run audit**. It uses axe-core 4.10.3 from jsDelivr only in the test frame; the production page has no audit dependency. Do not copy the tests directory into the production document root.

Final recorded result: **31 individual checks passed, zero failed**; an additional aggregate completion assertion passed. Raw output is in `tests/accessibility-results.json`.

- Six axe scans with WCAG 2.0 A/AA, 2.1 AA, and 2.2 AA tags: desktop initial, form errors, form success, 375px, 320px, and 200% root text size. All returned zero violations.
- Layout: 1280px, 375px, and 320px widths; 200% text at 1280px; WCAG text spacing at 320px (1.5 line height, 2em paragraph spacing, .12em letter spacing, .16em word spacing). No document or text-range overflow remained. Enlarged navigation did not overlap the brand.
- Form: initial descriptions, four required-entry errors, error-summary focus, error-link focus, malformed email rejection, successful download preparation, removal of stale errors, and download invalidation after editing.
- Navigation: rapid selection during Bootstrap menu opening; Escape dismissal and focus return; focused controls not completely hidden by the header.
- Contrast review: axe flags some gradient-backed diagram labels and inputs with background icons for manual review. Supplemental computed-color calculations found diagram text at least 7.96:1 using the lightest grid intersection, brand text 15.32:1, and placeholder text 5.03:1. Normal field text uses the same dark ink on white; validation icons do not sit behind entered text. Visual inspection confirmed a visible gold focus outline. The raw axe “incomplete” entries are retained rather than suppressed.
- Browser-driven keyboard checks: skip link → main → first CTA; Enter submission → error summary; Tab/Enter error link → field; Tab between inputs; Space toggles service checkbox; successful submission focuses the download; mobile menu Enter opens and Escape closes. No trap was observed.
- JavaScript syntax checks passed for `app.js` and `tests/accessibility.js`.

## Limits

No additional issues were identified in this tested scope. This is not a claim of complete WCAG certification. Automated rules do not cover every success criterion. No full VoiceOver/NVDA announcement session, alternate-browser/device matrix, OS high-contrast session, or native 400% browser zoom session was performed. The 320px viewport checks cover the reflow width equivalent of a 1280px viewport at 400% zoom; the text enlargement test changes root font size, not browser zoom. Existing reduced-motion CSS was inspected but an OS preference toggle was not exercised.

The form remains a local inquiry-preparation demo; no information was sent during testing.
