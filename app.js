'use strict';

// Native anchors retain deep-linking and keyboard behavior; CSS handles reduced-motion scrolling.
const menu = document.getElementById('navigation');
const toggle = document.querySelector('.navbar-toggler');
const navigationLinks = [...document.querySelectorAll('#navigation a[href^="#"]')];
const collapseMenu = () => {
  if (window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
  else { menu.classList.remove('show'); toggle.setAttribute('aria-expanded', 'false'); }
};
// Keep the menu operable even when a CDN script cannot load.
toggle.addEventListener('click', () => {
  if (!window.bootstrap) {
    const open = menu.classList.toggle('show');
    toggle.setAttribute('aria-expanded', String(open));
  }
});
navigationLinks.forEach(link => link.addEventListener('click', () => {
  if (!menu.classList.contains('show') && !menu.classList.contains('collapsing')) return;
  const target = document.querySelector(link.hash);
  const focusTarget = () => { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); };
  if (window.bootstrap) menu.addEventListener('hidden.bs.collapse', focusTarget, { once: true });
  if (window.bootstrap && menu.classList.contains('collapsing')) {
    menu.addEventListener('shown.bs.collapse', collapseMenu, { once: true });
  } else collapseMenu();
  if (!window.bootstrap) focusTarget();
}));
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('show')) { collapseMenu(); toggle.focus(); }
});
const sections = [...document.querySelectorAll('main section[id]')];
let scheduled = false;
function updateActiveSection() {
  const current = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 160);
  navigationLinks.forEach(link => {
    const active = link.hash === `#${current?.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scheduled = false;
}
window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateActiveSection); } }, { passive: true });
updateActiveSection();
document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('inquiry-form');
const fields = [document.getElementById('full-name'), document.getElementById('email'), document.getElementById('details')];
const services = [...form.querySelectorAll('[name="services"]')];
const summary = document.getElementById('form-errors');
const success = document.getElementById('form-success');
let attempted = false;
let downloadUrl;
function validate() {
  const errors = [];
  fields.forEach(field => {
    const valid = field.value.trim().length > 0 && field.validity.valid;
    field.classList.toggle('is-invalid', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    // Hidden referenced text still contributes to screen-reader descriptions.
    // Attach error descriptions only while this field is actually invalid.
    const strHelpId = field.id === 'details' ? 'details-help' : '';
    const strErrorId = field.dataset.errorId;
    const strDescription = [strHelpId, valid ? '' : strErrorId].filter(Boolean).join(' ');
    if (strDescription) field.setAttribute('aria-describedby', strDescription);
    else field.removeAttribute('aria-describedby');
    if (!valid) errors.push({ id: field.id, message: document.getElementById(strErrorId).textContent });
  });
  const serviceValid = services.some(input => input.checked);
  document.getElementById('service-error').classList.toggle('d-block', !serviceValid);
  services.forEach(input => { input.setAttribute('aria-invalid', String(!serviceValid)); if (serviceValid) input.removeAttribute('aria-describedby'); else input.setAttribute('aria-describedby', 'service-error'); });
  if (!serviceValid) errors.push({ id: services[0].id, message: 'Select at least one service.' });
  return errors;
}
function clearDownload() {
  success.classList.add('d-none');
  if (downloadUrl) { URL.revokeObjectURL(downloadUrl); downloadUrl = undefined; }
  document.getElementById('download-inquiry').removeAttribute('href');
}
form.addEventListener('input', () => {
  clearDownload();
  if (attempted) { validate(); summary.classList.add('d-none'); }
});
form.addEventListener('submit', event => {
  event.preventDefault();
  attempted = true;
  clearDownload();
  const errors = validate();
  summary.replaceChildren();
  summary.classList.toggle('d-none', errors.length === 0);
  if (errors.length) {
    const heading = document.createElement('p');
    heading.textContent = 'Please check the following fields:';
    const list = document.createElement('ul');
    list.className = 'mb-0';
    errors.forEach(error => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${error.id}`;
      link.textContent = error.message;
      link.className = 'alert-link';
      link.addEventListener('click', event => { event.preventDefault(); document.getElementById(error.id).focus(); });
      item.append(link); list.append(item);
    });
    summary.append(heading, list); summary.focus(); return;
  }
  // Static demo: prepare a local file. Replace this with a real API request when a backend is available.
  const data = new FormData(form);
  const text = `SwollenHippo Industries — Project Inquiry\n\nName: ${data.get('name').trim()}\nEmail: ${data.get('email').trim()}\nOrganization: ${data.get('organization').trim() || '(not provided)'}\nServices: ${data.getAll('services').join(', ')}\n\nProject details:\n${data.get('details').trim()}\n\nPrepared locally. This inquiry has not been sent.\n`;
  downloadUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const download = document.getElementById('download-inquiry');
  download.href = downloadUrl;
  success.classList.remove('d-none');
  download.focus();
});
window.addEventListener('pagehide', () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); });
