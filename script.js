// TEMP TEST: replace whole script.js with this to verify JS runs
console.log("TEST: script.js loaded");

(function(){
  // show visible banner at top so we know JS executed
  const b = document.createElement('div');
  b.id = 'js-test-banner';
  b.textContent = '✅ JS is running — test banner';
  b.style.position = 'fixed';
  b.style.left = '12px';
  b.style.top = '72px';
  b.style.zIndex = 99999;
  b.style.padding = '6px 10px';
  b.style.background = '#0b74ff';
  b.style.color = '#fff';
  b.style.borderRadius = '8px';
  b.style.boxShadow = '0 6px 18px rgba(2,6,23,0.25)';
  document.body.appendChild(b);

  // test Chart.js presence
  const hasChart = typeof Chart !== 'undefined';
  console.log('Chart.js present?', hasChart);
  if (!hasChart) {
    const c = document.createElement('div');
    c.textContent = '⚠️ Chart.js NOT loaded (chart features will not work)';
    c.style.color = '#b91c1c';
    c.style.marginTop = '8px';
    b.appendChild(c);
  }
})();
