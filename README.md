# SwollenHippo Industries

Standalone landing page: `index.html`, `styles.css`, and `app.js`. No build or package installation required.

## Preview

Run `python3 -m http.server 8080` from this directory, then open http://localhost:8080.

## Nginx on Debian

Copy the three site files into your configured Nginx document root (commonly `/var/www/html`). No application server, rewrite rules, or build step is needed. The default `index index.html;` configuration works. This project has not been deployed to a server.

Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Google Fonts, and Hope UI load over public CDNs. Hope UI uses its officially documented `main` CDN path; pin that reference to an audited commit for immutable production deployments. CDN availability and internet access are required for the external styling assets.

Hope UI source and licensing: https://github.com/iqonicdesignofficial/hope-ui-design-system

## Inquiry form

This is a client-side demo, not an email service. Valid submission generates a downloadable plain-text inquiry using a local Blob URL. Nothing is transmitted or stored persistently. Editing invalidates the previous download. To accept real inquiries, replace the documented submission block in `app.js` with a request to your backend; validate on the server and show success only after a confirmed response. Do not place email-service secrets in browser code.

## Accessibility

Includes semantic landmarks, skip link, visible keyboard focus, associated labels, inline validation and linked error summary, live success feedback, mobile menu Escape and focus handling, section navigation states, and reduced-motion support. These provisions are not a WCAG certification; test with assistive technology and your target browsers before production launch.

## Accessibility regression testing

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the audit, fixes, results, and coverage limits. With the local server running, open `/tests/accessibility.html` and click **Run audit** to repeat the automated axe and interaction/layout checks. Test-only assets are not needed for deployment.
