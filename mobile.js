// Phone layout for the BIO 40B study site.
//
// The desktop layout puts nine tabs in a scrolling row at the top and the
// reader's table of contents above the article — both awkward on a phone. This
// file swaps in a phone shell: a bottom tab bar, the TOC as a slide-up sheet, a
// tap-to-zoom lightbox for figures, and thumb-sized controls (see style.css,
// "Phone layout"). It is layered on top of app.js rather than woven into it —
// it watches #app for renders instead of hooking the router, so app.js stays
// unaware of it.
(function () {
  const KEY = 'bio40b.layout';                       // 'auto' | 'phone' | 'desktop'
  const MQ = window.matchMedia('(max-width: 780px)');

  const PRIMARY = [
    { view: 'home',  href: '#/home',  icon: '🏠', label: 'Home' },
    { view: 'read',  href: '#/read',  icon: '📖', label: 'Read' },
    { view: 'quiz',  href: '#/quiz',  icon: '📝', label: 'Quizzes' },
    { view: 'cards', href: '#/cards', icon: '🎯', label: 'Cards' },
  ];
  const MORE = [
    { view: 'objectives', href: '#/objectives', icon: '📋', label: 'Objectives from teacher', sub: 'The lab objective sets' },
    { view: 'exam1',      href: '#/exam1',      icon: '⏳', label: 'Before Exam 1',           sub: 'Cumulative review deck' },
    { view: 'practical',  href: '#/practical',  icon: '🔬', label: 'Lab practical',           sub: 'Point-and-name drills' },
    { view: 'systems',    href: '#/systems',    icon: '🫀', label: 'Body Systems',            sub: 'Work in progress' },
    { view: 'lab',        href: '#/lab',        icon: '📕', label: 'Lab Manual',              sub: 'Work in progress' },
  ];
  const MORE_VIEWS = MORE.map(m => m.view);

  const pref = () => localStorage.getItem(KEY) || 'auto';
  // Choosing the layout this screen would have picked anyway goes back to 'auto',
  // so a tap on a phone doesn't pin the phone layout onto a later desktop visit.
  const setPref = v => {
    localStorage.setItem(KEY, v === (MQ.matches ? 'phone' : 'desktop') ? 'auto' : v);
    apply();
  };
  const isPhone = () => pref() === 'phone' || (pref() === 'auto' && MQ.matches);
  const currentView = () => (location.hash.slice(1) || '/home').split('/')[1] || 'home';
  const body = document.body;

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // ---- shell (built once, shown/hidden by the body.phone class) ----
  const scrim = el('div', 'ph-scrim');
  scrim.onclick = closeSheets;

  const tabbar = el('nav', 'ph-tabbar');
  PRIMARY.forEach(t => {
    const a = el('a', 'ph-tab', `<span class="ic">${t.icon}</span><span class="lb">${t.label}</span>`);
    a.href = t.href;
    a.dataset.view = t.view;
    a.onclick = closeSheets;
    tabbar.appendChild(a);
  });
  const moreTab = el('button', 'ph-tab', `<span class="ic">☰</span><span class="lb">More</span>`);
  moreTab.dataset.view = '__more';
  moreTab.onclick = e => { e.stopPropagation(); toggle('ph-sheet-open'); };
  tabbar.appendChild(moreTab);

  const sheet = el('div', 'ph-sheet');
  sheet.appendChild(el('div', 'ph-grabber'));
  const sheetList = el('div', 'ph-sheet-list');
  MORE.forEach(m => {
    const a = el('a', 'ph-sheet-row', `<span class="ic">${m.icon}</span>
      <span class="tx"><span class="lb">${m.label}</span><span class="sb">${m.sub}</span></span>
      <span class="ch">›</span>`);
    a.href = m.href;
    a.dataset.view = m.view;
    a.onclick = closeSheets;
    sheetList.appendChild(a);
  });
  sheet.appendChild(sheetList);
  const layoutRow = el('button', 'ph-sheet-row ph-layout-row',
    `<span class="ic">🖥</span><span class="tx"><span class="lb">Switch to desktop layout</span>
     <span class="sb">Full-width site, tabs at the top</span></span>`);
  layoutRow.onclick = () => { closeSheets(); setPref('desktop'); };
  sheet.appendChild(layoutRow);

  // Floating "Contents" button — only on the reader.
  const tocFab = el('button', 'ph-toc-fab', '<span>☰</span> Contents');
  tocFab.onclick = e => { e.stopPropagation(); toggle('ph-toc-open'); };

  const lightbox = el('div', 'ph-lightbox');
  lightbox.onclick = () => body.classList.remove('ph-lightbox-open');

  [scrim, tabbar, sheet, tocFab, lightbox].forEach(n => body.appendChild(n));

  function toggle(cls) {
    const on = body.classList.contains(cls);
    closeSheets();
    if (!on) body.classList.add(cls);
    syncTabs();
  }
  function closeSheets() {
    body.classList.remove('ph-sheet-open', 'ph-toc-open');
    syncTabs();
  }

  function syncTabs() {
    const v = currentView();
    const sheetOpen = body.classList.contains('ph-sheet-open');
    tabbar.querySelectorAll('.ph-tab').forEach(t => {
      const active = t.dataset.view === '__more'
        ? (sheetOpen || MORE_VIEWS.includes(v))
        : (!sheetOpen && t.dataset.view === v);
      t.classList.toggle('active', active);
    });
    sheetList.querySelectorAll('.ph-sheet-row').forEach(r =>
      r.classList.toggle('active', r.dataset.view === v));
  }

  // ---- per-render touch-ups ----
  function enhance() {
    syncTabs();
    // The reader's TOC becomes a slide-up sheet; the FAB only exists there.
    body.classList.toggle('ph-has-toc', !!document.querySelector('.reader .toc'));
    if (!document.querySelector('.reader')) body.classList.remove('ph-toc-open');
  }

  // Tap a figure to open it full-screen (pinch-zoom works natively there).
  document.addEventListener('click', e => {
    if (!isPhone()) return;
    const img = e.target.closest('.article figure.fig img, .prac-imgwrap img');
    if (!img) return;
    lightbox.innerHTML = '';
    const big = el('img');
    big.src = img.src;
    big.alt = img.alt;
    lightbox.appendChild(big);
    const cap = img.closest('figure')?.querySelector('figcaption')?.textContent;
    if (cap) lightbox.appendChild(el('div', 'ph-lb-cap', cap));
    lightbox.appendChild(el('div', 'ph-lb-hint', 'Pinch to zoom · tap to close'));
    body.classList.add('ph-lightbox-open');
  });

  function apply() {
    body.classList.toggle('phone', isPhone());
    if (!isPhone()) closeSheets();
    enhance();
    updateFooterToggle();
  }

  // ---- footer control (visible in both layouts) ----
  const footerBtn = el('button', 'ph-layout-toggle');
  footerBtn.onclick = () => setPref(isPhone() ? 'desktop' : 'phone');
  function updateFooterToggle() {
    footerBtn.textContent = isPhone() ? '🖥 Use desktop layout' : '📱 Use phone layout';
    footerBtn.title = pref() === 'auto'
      ? 'Layout is picked automatically from your screen size'
      : 'You picked this layout — it is remembered on this device';
  }
  document.querySelector('footer')?.appendChild(el('div', 'ph-footer-tools')).appendChild(footerBtn);

  new MutationObserver(enhance).observe(document.getElementById('app'), { childList: true });
  window.addEventListener('hashchange', () => { closeSheets(); setTimeout(enhance, 0); });
  MQ.addEventListener('change', apply);
  apply();
})();
