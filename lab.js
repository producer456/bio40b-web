// BIO 40B — Lab Manual annotator (student-facing, ZERO tracking).
//
// Privacy model: the student opens THEIR OWN copy of the lab manual PDF. The
// file is read and rendered entirely in the browser — it is never uploaded,
// and the site hosts no manual. Whatever they type is saved ONLY in this
// browser's localStorage, keyed by a fingerprint of the file. Nothing is sent
// anywhere and nothing is tracked. (The site is otherwise read-only.)
//
// Loaded by index.html; app.js's router calls window.renderLab(root).

// Vendored locally so the tool needs no CDN at runtime (works even if a CDN is
// blocked, and keeps everything self-hosted). Absolute URLs (resolved against
// the page) so dynamic import() works from this classic script on both
// localhost and the GitHub Pages subpath. Update both files together.
const PDFJS_URL    = new URL('vendor/pdfjs/pdf.min.mjs', document.baseURI).href;
const PDFJS_WORKER = new URL('vendor/pdfjs/pdf.worker.min.mjs', document.baseURI).href;

let _pdfjs = null;
async function pdfjs() {
  if (!_pdfjs) {
    _pdfjs = await import(PDFJS_URL);
    _pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  }
  return _pdfjs;
}

const lel = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const lesc = s => (s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fingerprint = f => `${f.name}::${f.size}`;
const store = fp => `bio40b.lab.${fp}`;
const RECENTS = 'bio40b.lab.recents';

function loadAnno(fp) { try { return JSON.parse(localStorage.getItem(store(fp))) || { pages: {} }; } catch { return { pages: {} }; } }
function saveAnno(fp, data) { localStorage.setItem(store(fp), JSON.stringify(data)); }
function rememberFile(fp, name) {
  let r = []; try { r = JSON.parse(localStorage.getItem(RECENTS)) || []; } catch {}
  r = r.filter(x => x.fp !== fp);
  r.unshift({ fp, name });
  localStorage.setItem(RECENTS, JSON.stringify(r.slice(0, 8)));
}
function recents() { try { return JSON.parse(localStorage.getItem(RECENTS)) || []; } catch { return []; } }
function annoCount(fp) { const d = loadAnno(fp); return Object.values(d.pages).reduce((n, a) => n + a.length, 0); }

// module-scoped current session
let cur = null; // { fp, name, data, tool, fontClass }

function renderLab(root) {
  document.documentElement.style.setProperty('--accent', 'var(--respir)');
  const wrap = lel('div', 'lab-wrap');

  // Intro / open screen
  const intro = lel('div', 'lab-intro');
  intro.appendChild(lel('div', 'wip-kicker', '🚧 WORK IN PROGRESS · LAB MANUAL'));
  intro.appendChild(lel('h1', null, 'Fill in your lab manual'));
  intro.appendChild(lel('div', 'wip-banner',
    `This tool is still being built and tested — text boxes and saving work, but expect rough edges. Keep a backup of anything important.`));
  intro.appendChild(lel('div', 'lab-privacy',
    `Open <strong>your own copy</strong> of the lab manual PDF. It’s read and drawn right here in your browser — <strong>never uploaded</strong>, and this site doesn’t host the manual. Anything you type is saved <strong>only on this device</strong> (nothing is tracked). Tap a spot on a page to drop an answer box.`));

  const openBtn = lel('button', 'cta', '📄 Open a PDF from this device');
  const fileInput = lel('input'); fileInput.type = 'file'; fileInput.accept = 'application/pdf'; fileInput.style.display = 'none';
  openBtn.onclick = () => fileInput.click();
  fileInput.onchange = () => { if (fileInput.files[0]) openFile(fileInput.files[0], wrap); };
  intro.appendChild(openBtn);
  intro.appendChild(fileInput);

  // Drop zone
  const drop = lel('div', 'lab-drop', 'or drag a PDF here');
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => {
    e.preventDefault(); drop.classList.remove('over');
    const f = [...e.dataTransfer.files].find(x => x.type === 'application/pdf');
    if (f) openFile(f, wrap);
  };
  intro.appendChild(drop);

  // Recent files (annotations you already have on this device)
  const rec = recents().filter(r => annoCount(r.fp) > 0);
  if (rec.length) {
    const rl = lel('div', 'lab-recents');
    rl.appendChild(lel('div', 'lab-recents-h', 'Saved answers on this device — re-open the same PDF to continue:'));
    rec.forEach(r => {
      const row = lel('div', 'lab-recent-row');
      row.innerHTML = `<span>📄 ${lesc(r.name)}</span><span class="muted">${annoCount(r.fp)} answers saved</span>`;
      rl.appendChild(row);
    });
    intro.appendChild(rl);
  }

  wrap.appendChild(intro);
  root.appendChild(wrap);
}

async function openFile(file, wrap) {
  const fp = fingerprint(file);
  cur = { fp, name: file.name, data: loadAnno(fp), tool: 'text', fontClass: 'f-m' };
  rememberFile(fp, file.name);

  wrap.innerHTML = '';
  wrap.appendChild(buildToolbar(file.name));
  const status = lel('div', 'lab-status', 'Loading PDF…');
  wrap.appendChild(status);
  const pagesHost = lel('div', 'lab-pages'); wrap.appendChild(pagesHost);

  let pdf;
  try {
    const lib = await pdfjs();
    const buf = await file.arrayBuffer();
    pdf = await lib.getDocument({ data: buf }).promise;
  } catch (e) {
    status.className = 'lab-status err';
    status.textContent = `Couldn't open that PDF. ${String(e)}`;
    return;
  }
  status.remove();

  // Lazily render each page when it scrolls near the viewport.
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { io.unobserve(en.target); renderPage(pdf, +en.target.dataset.page, en.target); }
    });
  }, { rootMargin: '600px 0px' });

  for (let n = 1; n <= pdf.numPages; n++) {
    // Placeholder sized to the page aspect so scroll height is right before render.
    const page = await pdf.getPage(n);
    const vp = page.getViewport({ scale: 1 });
    const holder = lel('div', 'lab-page');
    holder.dataset.page = n;
    holder.style.aspectRatio = `${vp.width} / ${vp.height}`;
    holder.appendChild(lel('div', 'lab-page-num', `Page ${n}`));
    pagesHost.appendChild(holder);
    io.observe(holder);
  }
}

async function renderPage(pdf, n, holder) {
  const lib = await pdfjs();
  const page = await pdf.getPage(n);
  const cssWidth = holder.clientWidth || 800;
  const base = page.getViewport({ scale: 1 });
  const scale = cssWidth / base.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vp = page.getViewport({ scale: scale * dpr });

  const canvas = lel('canvas', 'lab-canvas');
  canvas.width = vp.width; canvas.height = vp.height;
  canvas.style.width = '100%'; canvas.style.height = 'auto';
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport: vp }).promise;

  holder.querySelector('.lab-page-num')?.remove();
  holder.style.aspectRatio = '';
  holder.appendChild(canvas);

  // Overlay layer that captures taps to add answer boxes.
  const overlay = lel('div', 'lab-overlay');
  overlay.dataset.page = n;
  overlay.onclick = (e) => {
    if (cur.tool !== 'text') return;
    if (e.target !== overlay) return;               // don't add when clicking an existing box
    const r = overlay.getBoundingClientRect();
    addBox(overlay, n, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, '', cur.fontClass, 0.28, null, true);
  };
  holder.appendChild(overlay);

  // Restore saved boxes for this page.
  (cur.data.pages[n] || []).forEach(b =>
    addBox(overlay, n, b.xf, b.yf, b.text, b.font || 'f-m', b.wf || 0.28, b.id, false));
}

let _bid = 0;
function addBox(overlay, page, xf, yf, text, fontClass, wf, id, focus) {
  id = id || `b${Date.now()}_${_bid++}`;
  const box = lel('div', `lab-box ${fontClass}`);
  box.style.left = `${xf * 100}%`;
  box.style.top = `${yf * 100}%`;
  box.style.width = `${wf * 100}%`;
  box.dataset.id = id;

  const handle = lel('div', 'lab-box-handle', '⠿');
  const del = lel('div', 'lab-box-del', '×');
  const body = lel('div', 'lab-box-body'); body.contentEditable = 'true'; body.spellcheck = false;
  body.textContent = text;
  box.appendChild(handle); box.appendChild(del); box.appendChild(body);
  overlay.appendChild(box);

  const persist = () => {
    const arr = (cur.data.pages[page] = cur.data.pages[page] || []);
    const rec = arr.find(x => x.id === id);
    const val = {
      id, xf: parseFloat(box.style.left) / 100, yf: parseFloat(box.style.top) / 100,
      wf: box.getBoundingClientRect().width / overlay.getBoundingClientRect().width,
      font: [...box.classList].find(c => c.startsWith('f-')) || 'f-m',
      text: body.textContent,
    };
    if (rec) Object.assign(rec, val); else arr.push(val);
    saveAnno(cur.fp, cur.data);
  };
  const removeSelf = () => {
    box.remove();
    const arr = cur.data.pages[page];
    if (arr) cur.data.pages[page] = arr.filter(x => x.id !== id);
    saveAnno(cur.fp, cur.data);
  };

  body.onblur = () => { if (!body.textContent.trim()) removeSelf(); else persist(); };
  del.onclick = removeSelf;

  // Resize (CSS resize on body) -> save width.
  new ResizeObserver(() => persist()).observe(box);

  // Drag by the handle.
  handle.onpointerdown = (e) => {
    e.preventDefault();
    const orect = overlay.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, l: parseFloat(box.style.left), t: parseFloat(box.style.top) };
    handle.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const dl = ((ev.clientX - start.x) / orect.width) * 100;
      const dt = ((ev.clientY - start.y) / orect.height) * 100;
      box.style.left = `${Math.max(0, Math.min(98, start.l + dl))}%`;
      box.style.top = `${Math.max(0, Math.min(99, start.t + dt))}%`;
    };
    const up = () => { handle.releasePointerCapture(e.pointerId); handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); persist(); };
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
  };

  if (focus) { persist(); setTimeout(() => body.focus(), 0); }
  return box;
}

function buildToolbar(name) {
  const bar = lel('div', 'lab-toolbar');
  const left = lel('div', 'lab-tb-left');
  const fileBtn = lel('button', 'lab-tb-btn', '📄 Open another');
  const inp = lel('input'); inp.type = 'file'; inp.accept = 'application/pdf'; inp.style.display = 'none';
  fileBtn.onclick = () => inp.click();
  inp.onchange = () => { if (inp.files[0]) openFile(inp.files[0], document.querySelector('.lab-wrap')); };
  left.appendChild(fileBtn); left.appendChild(inp);
  left.appendChild(lel('span', 'lab-tb-name muted', lesc(name)));

  const mid = lel('div', 'lab-tb-mid');
  const tools = [['text', '✍️ Add text', 'Tap a page to drop an answer box'], ['move', '✋ Move / edit', 'Rearrange or edit existing boxes']];
  tools.forEach(([t, label, title]) => {
    const b = lel('button', 'lab-tb-btn' + (cur.tool === t ? ' active' : ''), label);
    b.title = title;
    b.onclick = () => { cur.tool = t; bar.querySelectorAll('.lab-tb-mid .lab-tb-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); document.querySelector('.lab-pages')?.classList.toggle('move-mode', t === 'move'); };
    mid.appendChild(b);
  });
  // font size for NEW boxes
  const sizes = [['f-s', 'S'], ['f-m', 'M'], ['f-l', 'L']];
  const fontGrp = lel('div', 'lab-font-grp');
  sizes.forEach(([c, lab]) => {
    const b = lel('button', 'lab-tb-btn tiny' + (cur.fontClass === c ? ' active' : ''), lab);
    b.onclick = () => { cur.fontClass = c; fontGrp.querySelectorAll('.lab-tb-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); };
    fontGrp.appendChild(b);
  });
  mid.appendChild(fontGrp);

  const right = lel('div', 'lab-tb-right');
  const printBtn = lel('button', 'lab-tb-btn', '🖨️ Print / Save PDF');
  printBtn.title = 'Print (or Save as PDF) with your answers baked in';
  printBtn.onclick = () => window.print();
  right.appendChild(printBtn);

  bar.appendChild(left); bar.appendChild(mid); bar.appendChild(right);
  return bar;
}

window.renderLab = renderLab;
