'use strict';
const elFrame = document.getElementById('page');
const elResults = document.getElementById('results');
const elRun = document.getElementById('run');
const arrResults = [];
const waitForLayout = () => new Promise(fnResolve => setTimeout(fnResolve, 450));
function record(strTest, blnPass, objDetails = '') {
  arrResults.push({ test: strTest, pass: blnPass, details: objDetails });
  elResults.textContent = JSON.stringify(arrResults, null, 2);
}
function contrast(strForeground, strBackground) {
  function luminance(strColor) {
    const arrChannels = strColor.match(/[\d.]+/g).slice(0, 3).map(strChannel => {
      const numChannel = Number(strChannel) / 255;
      return numChannel <= .04045 ? numChannel / 12.92 : ((numChannel + .055) / 1.055) ** 2.4;
    });
    return arrChannels[0] * .2126 + arrChannels[1] * .7152 + arrChannels[2] * .0722;
  }
  const arrLuminance = [luminance(strForeground), luminance(strBackground)].sort((numA, numB) => numA - numB);
  return (arrLuminance[1] + .05) / (arrLuminance[0] + .05);
}
async function scan(strState) {
  const objAudit = await elFrame.contentWindow.axe.run(elFrame.contentDocument, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
  });
  record(strState + ': axe WCAG A/AA', objAudit.violations.length === 0, {
    violations: objAudit.violations.map(objRule => ({ id: objRule.id, nodes: objRule.nodes.map(objNode => ({ target: objNode.target, summary: objNode.failureSummary })) })),
    manualReview: objAudit.incomplete.map(objRule => ({ id: objRule.id, targets: objRule.nodes.map(objNode => objNode.target) }))
  });
}
function checkReflow(strState) {
  const docPage = elFrame.contentDocument;
  const arrOverflow = [];
  const objWalker = docPage.createTreeWalker(docPage.body, 4);
  while (objWalker.nextNode()) {
    const objRange = docPage.createRange(); objRange.selectNodeContents(objWalker.currentNode);
    if ([...objRange.getClientRects()].some(objRect => objRect.right > elFrame.clientWidth + 1)) arrOverflow.push(objWalker.currentNode.textContent);
  }
  record(strState + ': no horizontal overflow', docPage.documentElement.scrollWidth <= elFrame.clientWidth,
    { content: docPage.documentElement.scrollWidth, viewport: elFrame.clientWidth, textOverflow: arrOverflow, overflow: [...docPage.querySelectorAll('body *')].filter(elNode => elNode.getBoundingClientRect().right > elFrame.clientWidth + 1).slice(0, 12).map(elNode => ({tag: elNode.tagName, class: elNode.className, text: elNode.textContent.slice(0, 65)})) });
}
elRun.addEventListener('click', async () => {
  elRun.disabled = true;
  arrResults.length = 0;
  try {
    // Reload for a clean form, then wait for its CDN styles and fonts before auditing.
    await new Promise(fnResolve => { elFrame.onload = fnResolve; elFrame.src = '../index.html?audit=' + Date.now(); });
    const docPage = elFrame.contentDocument;
    const winPage = elFrame.contentWindow;
    await docPage.fonts.ready;
    await new Promise((fnResolve, fnReject) => {
      const elScript = docPage.createElement('script');
      elScript.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.3/axe.min.js';
      elScript.onload = fnResolve;
      elScript.onerror = () => fnReject(new Error('axe-core CDN failed to load'));
      docPage.head.append(elScript);
    });
    record('Pristine fields do not announce error messages', !docPage.querySelector('[aria-describedby*="-error"]'));
    elFrame.width = '1280'; await waitForLayout(); await scan('Desktop initial'); checkReflow('Desktop');
    for (const strSelector of ['.panel-meta > span', '.node-top', '.node-bottom', '.panel-footer > span', '.diagram-core small', '.brand-name small']) {
      const strColor = winPage.getComputedStyle(docPage.querySelector(strSelector)).color;
      // Two translucent grid lines composite over navy to at most rgb(33,48,67).
      const strBackground = strSelector === '.brand-name small' ? 'rgb(255,255,255)' : 'rgb(33,48,67)';
      const numRatio = contrast(strColor, strBackground);
      record('Reviewed contrast: ' + strSelector, numRatio >= 4.5, Number(numRatio.toFixed(2)));
    }
    const numPlaceholderRatio = contrast(winPage.getComputedStyle(docPage.getElementById('details'), '::placeholder').color, 'rgb(255,255,255)');
    record('Placeholder contrast', numPlaceholderRatio >= 4.5, numPlaceholderRatio);
    const numButtonBorderRatio = contrast(winPage.getComputedStyle(docPage.querySelector('.btn-outline-dark')).borderTopColor, 'rgb(247,249,252)');
    record('Secondary button boundary contrast', numButtonBorderRatio >= 3, numButtonBorderRatio);
    const arrObscured = [];
    for (const elControl of docPage.querySelectorAll('a[href],button,input,textarea')) {
      if (!elControl.getClientRects().length || elControl.classList.contains('skip-link')) continue;
      elControl.focus();
      const objRect = elControl.getBoundingClientRect();
      const objHeader = docPage.querySelector('header').getBoundingClientRect();
      if (!elControl.closest('header') && objRect.bottom <= objHeader.bottom && objHeader.top === 0) arrObscured.push(elControl.id || elControl.textContent);
    }
    record('Focused controls are not hidden by header', arrObscured.length === 0, arrObscured);
    const elForm = docPage.getElementById('inquiry-form');
    elForm.requestSubmit(); await waitForLayout();
    record('Invalid submission focuses error summary', docPage.activeElement.id === 'form-errors');
    record('Invalid submission identifies all four required entries', docPage.querySelectorAll('#form-errors a').length === 4);
    await scan('Form errors');
    docPage.querySelector('#form-errors a').click();
    record('Error link focuses its input', docPage.activeElement.id === 'full-name');
    for (const [strId, strValue] of [['full-name','Test Engineer'],['email','invalid'],['details','Test enclosure prototype']]) {
      const elInput = docPage.getElementById(strId); elInput.value = strValue; elInput.dispatchEvent(new winPage.Event('input', { bubbles: true }));
    }
    docPage.getElementById('interest-manufacturing').click();
    elForm.requestSubmit();
    record('Malformed email remains invalid', docPage.getElementById('email').getAttribute('aria-invalid') === 'true');
    docPage.getElementById('email').value = 'test@example.com';
    elForm.requestSubmit(); await waitForLayout();
    record('Success exposes download and moves focus', docPage.activeElement.id === 'download-inquiry' && docPage.getElementById('download-inquiry').href.startsWith('blob:'));
    record('Valid fields no longer reference error descriptions', !docPage.querySelector('[aria-describedby*="-error"]'));
    await scan('Form success');
    docPage.getElementById('details').dispatchEvent(new winPage.Event('input', { bubbles: true }));
    record('Editing invalidates stale download', !docPage.getElementById('download-inquiry').hasAttribute('href'));
    for (const intWidth of [375, 320]) {
      elFrame.width = String(intWidth); await waitForLayout(); checkReflow(intWidth + 'px'); await scan(intWidth + 'px');
    }
    const elToggle = docPage.querySelector('.navbar-toggler');
    elToggle.click();
    // Exercise the race between opening the Bootstrap collapse and immediately selecting a link.
    docPage.querySelector('#navigation a').click(); await waitForLayout(); await waitForLayout();
    record('Rapid mobile selection closes menu and focuses destination', elToggle.getAttribute('aria-expanded') === 'false' && docPage.activeElement.id === 'services');
    elToggle.click(); await waitForLayout();
    docPage.querySelector('#navigation a').dispatchEvent(new winPage.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitForLayout();
    record('Escape closes menu and returns toggle focus', elToggle.getAttribute('aria-expanded') === 'false' && docPage.activeElement === elToggle);
    elFrame.width = '1280';
    docPage.documentElement.style.fontSize = '200%'; await waitForLayout(); checkReflow('200% text'); await scan('200% text');
    const objBrand = docPage.querySelector('.navbar-brand').getBoundingClientRect();
    const objNavigation = docPage.getElementById('navigation').getBoundingClientRect();
    record('200% text: brand and navigation do not overlap', objBrand.right <= objNavigation.left || objBrand.bottom <= objNavigation.top, { brandRight: objBrand.right, navLeft: objNavigation.left });
    docPage.documentElement.style.fontSize = '';
    const elSpacing = docPage.createElement('style');
    elSpacing.textContent = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
    docPage.head.append(elSpacing); elFrame.width = '320'; await waitForLayout(); checkReflow('320px text spacing');
    // Leave the text-spacing state visible for inspection.
    // The next run reloads a clean document.
    record('All tests complete', arrResults.every(objResult => objResult.pass));
  } catch (objError) { record('Audit execution', false, objError.message); }
  finally { elRun.disabled = false; }
});
