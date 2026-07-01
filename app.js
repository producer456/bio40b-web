// BIO 40B — class study site. READ-ONLY for students: browse the material and
// drill the learning objectives as flashcards. Nothing here writes back to the
// site; the owner updates content by regenerating data/*.json and pushing.
// (Per-student flashcard confidence is stored only in that student's browser.)

const CHAPTERS = [12, 13, 14, 15, 18, 19, 20, 22];
const UNITS = [
  { key: 'nervous',  name: 'Nervous System',        chaps: [12,13,14,15], color: 'var(--nervous)', icon: '🧠', sub: 'Chapters 12–15' },
  { key: 'cardio',   name: 'Cardiovascular System', chaps: [18,19,20],    color: 'var(--cardio)',  icon: '❤️', sub: 'Chapters 18–20' },
  { key: 'respir',   name: 'Respiratory System',    chaps: [22],          color: 'var(--respir)',  icon: '🫁', sub: 'Chapter 22' },
];
const unitOf = n => UNITS.find(u => u.chaps.includes(n));
const RATINGS = [
  { v:1, t:'No idea', c:'#d43d4f' }, { v:2, t:'Shaky', c:'#e8863a' },
  { v:3, t:'Close', c:'#c9a227' },   { v:4, t:'Solid', c:'#3b7dd8' },
  { v:5, t:'Nailed', c:'#2ea24b' },
];
const MASTERY = 4;

const state = { chapters: [], objByChapter: {}, sectionIndex: [] };
const $ = sel => document.querySelector(sel);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => (s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---- data load ----
async function loadData() {
  const chs = await Promise.all(CHAPTERS.map(n =>
    fetch(`data/ch${String(n).padStart(2,'0')}.json`).then(r => r.json())));
  state.chapters = chs.sort((a,b) => a.number - b.number);
  const obj = await fetch('data/objective_cards.json').then(r => r.json());
  obj.chapters.forEach(c => { state.objByChapter[c.number] = c; });
  // flat index of sections for prev/next + lookup
  state.chapters.forEach(ch => ch.sections.forEach(s =>
    state.sectionIndex.push({ chapter: ch, section: s })));
}
const objCardCount = () => Object.values(state.objByChapter).reduce((n,c) =>
  n + c.sections.reduce((m,s) => m + s.cards.length, 0), 0);
const figSrc = imageName => imageName ? `figures/${imageName.split('/').pop()}.jpg` : null;

// ---- router ----
function route() {
  const h = location.hash.slice(1) || '/home';
  const [, view, arg] = h.split('/');
  document.querySelectorAll('nav.tabs a').forEach(a =>
    a.classList.toggle('active', a.dataset.view === view));
  const root = $('#app');
  root.innerHTML = '';
  if (view === 'read')       renderRead(root, arg);
  else if (view === 'cards') renderCards(root, arg);
  else                       renderHome(root);
  window.scrollTo(0, 0);
}

// ---- Home ----
function renderHome(root) {
  const wrap = el('div', 'hero');
  wrap.innerHTML = `
    <span class="pill" style="background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)">De Anza · BIO 40B</span>
    <h1>Human Anatomy &amp; Physiology II</h1>
    <p class="sub">A study companion for our class — read the material by objective, then
    drill every learning objective as a flashcard until you've got them all. Free, no sign-in.</p>`;
  const stats = el('div', 'stat-row');
  const totalSecs = state.chapters.reduce((n,c) => n + c.sections.length, 0);
  [['8','Chapters'], [String(totalSecs),'Sections'], [String(objCardCount()),'Objective cards']]
    .forEach(([n,l]) => { const s = el('div','stat card'); s.innerHTML = `<div class="n">${n}</div><div class="l">${l}</div>`; stats.appendChild(s); });
  wrap.appendChild(stats);
  wrap.appendChild(el('button','cta','🎯 Start flashcards')).onclick = () => location.hash = '#/cards';

  const grid = el('div','unit-grid');
  grid.style.marginTop = '26px';
  UNITS.forEach(u => {
    const c = el('div','unit-card card');
    const chapNames = u.chaps.map(n => `Ch ${n}`).join(' · ');
    c.innerHTML = `<div class="ic" style="background:linear-gradient(135deg,${u.color},color-mix(in srgb,${u.color} 60%,#000))">${u.icon}</div>
      <h3>${u.name}</h3><div class="chaps">${u.sub} — ${chapNames}</div>`;
    c.onclick = () => { location.hash = `#/read/${firstSectionOfUnit(u)}`; };
    grid.appendChild(c);
  });
  root.appendChild(wrap);
  const unitsH = el('h2', null, 'Units'); unitsH.style.margin = '30px 0 12px';
  root.appendChild(unitsH);
  root.appendChild(grid);
}
function firstSectionOfUnit(u) {
  const ch = state.chapters.find(c => u.chaps.includes(c.number));
  return ch?.sections[0]?.id || '';
}

// ---- Reader ----
function renderRead(root, sectionId) {
  const reader = el('div', 'reader');
  const toc = el('aside', 'toc card');
  UNITS.forEach(u => {
    toc.appendChild(el('div','unit-h', u.name));
    state.chapters.filter(c => u.chaps.includes(c.number)).forEach(ch => {
      const d = el('details');
      const open = ch.sections.some(s => s.id === sectionId);
      if (open) d.open = true;
      const sum = el('summary', null, `<span style="color:${u.color}">${u.icon}</span> Ch ${ch.number} · ${esc(ch.title)}`);
      d.appendChild(sum);
      ch.sections.forEach(s => {
        const a = el('div', 'sec' + (s.id === sectionId ? ' active' : ''), esc(s.title));
        a.onclick = () => { location.hash = `#/read/${s.id}`; };
        d.appendChild(a);
      });
      toc.appendChild(d);
    });
  });

  const found = state.sectionIndex.find(x => x.section.id === sectionId) || state.sectionIndex[0];
  const article = el('article', 'article card');
  renderSection(article, found);
  reader.appendChild(toc);
  reader.appendChild(article);
  root.appendChild(reader);
}

function renderSection(container, { chapter, section }) {
  const u = unitOf(chapter.number);
  document.documentElement.style.setProperty('--accent', u.color);
  container.appendChild(el('div','kicker', `CH ${chapter.number} · ${esc(chapter.title).toUpperCase()}`));
  container.appendChild(el('h1', null, esc(section.title)));

  if (section.objectives?.length) {
    const box = el('div','obj-box');
    box.innerHTML = `<strong style="font-size:13px;color:var(--accent)">LEARNING OBJECTIVES</strong>
      <ul>${section.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul>`;
    container.appendChild(box);
  }

  // interleave content paragraphs with figures roughly
  (section.content || []).forEach((p, i) => {
    container.appendChild(el('p', null, esc(p)));
    const img = section.images?.[i];
    if (img) appendFigure(container, img);
  });
  // any remaining figures
  (section.images || []).slice((section.content||[]).length).forEach(img => appendFigure(container, img));

  if (section.glossary?.length) {
    container.appendChild(sectionH2('Key terms', '📖'));
    const dl = el('dl','gloss');
    section.glossary.forEach(g => { dl.appendChild(el('dt',null,esc(g.term))); dl.appendChild(el('dd',null,esc(g.definition))); });
    container.appendChild(dl);
  }

  if (section.reviewQuestions?.length) {
    container.appendChild(sectionH2('Check yourself', '✅'));
    section.reviewQuestions.forEach(q => container.appendChild(renderQuestion(q)));
  }

  // prev / next
  const idx = state.sectionIndex.findIndex(x => x.section.id === section.id);
  const nav = el('div','sec-nav');
  const prev = el('button', null, '← Previous'); const next = el('button', null, 'Next →');
  prev.disabled = idx <= 0; next.disabled = idx >= state.sectionIndex.length - 1;
  prev.onclick = () => { location.hash = `#/read/${state.sectionIndex[idx-1].section.id}`; };
  next.onclick = () => { location.hash = `#/read/${state.sectionIndex[idx+1].section.id}`; };
  nav.appendChild(prev); nav.appendChild(next);
  container.appendChild(nav);
}
function sectionH2(txt, icon){ return el('h2', null, `<span>${icon}</span> ${txt}`); }
function appendFigure(container, img){
  const src = figSrc(img.imageName); if (!src) return;
  const fig = el('figure','fig');
  const im = el('img'); im.loading='lazy'; im.src=src; im.alt=img.caption||'';
  im.onerror = () => { fig.remove(); };
  fig.appendChild(im);
  if (img.caption) fig.appendChild(el('figcaption', null, esc(img.caption)));
  container.appendChild(fig);
}
function renderQuestion(q){
  const box = el('div','q');
  box.appendChild(el('div','qq', esc(q.question)));
  let answered = false;
  q.choices.forEach((ch, i) => {
    const b = el('button','choice', esc(ch));
    b.onclick = () => {
      if (answered) return; answered = true;
      const correct = i === q.correctAnswer;
      b.classList.add(correct ? 'correct' : 'wrong');
      if (!correct) box.querySelectorAll('.choice')[q.correctAnswer].classList.add('correct');
      if (q.explanation) box.appendChild(el('div','expl', esc(q.explanation)));
    };
    box.appendChild(b);
  });
  return box;
}

// ---- Flashcards ----
function renderCards(root, sessionKey) {
  const wrap = el('div','fc-wrap');
  if (sessionKey) { renderSession(wrap, sessionKey); }
  else            { renderScopePicker(wrap); }
  root.appendChild(wrap);
}

function renderScopePicker(wrap) {
  document.documentElement.style.setProperty('--accent', 'var(--nervous)');
  wrap.appendChild(el('h1', null, 'Master the objectives'));
  wrap.appendChild(el('p','sub muted', `Pick a chapter or section. Reveal each answer, rate how well you knew it, and any card below “Solid” comes back until you’ve mastered them all.`));
  const list = el('div','scope-list');
  state.chapters.forEach(ch => {
    const oc = state.objByChapter[ch.number]; if (!oc) return;
    const u = unitOf(ch.number);
    const total = oc.sections.reduce((n,s)=>n+s.cards.length,0);
    const card = el('div','scope-chapter card');
    const row = el('div','row');
    row.innerHTML = `<div class="badge" style="background:${u.color}">${u.icon}</div>
      <div style="flex:1"><div style="font-weight:600">Ch ${ch.number} · ${esc(ch.title)}</div>
      <div class="muted" style="font-size:13px">${total} objectives · ${oc.sections.length} sections</div></div>
      <div class="muted">▾</div>`;
    const secWrap = el('div','scope-sections');
    const whole = el('button','whole', `<span>▶ Whole chapter</span><span>${total}</span>`);
    whole.onclick = () => startSession(`ch${ch.number}-all`);
    secWrap.appendChild(whole);
    oc.sections.forEach(s => {
      const b = el('button', null, `<span>${esc(s.title)}</span><span>${s.cards.length}</span>`);
      b.onclick = () => startSession(s.id);
      secWrap.appendChild(b);
    });
    row.onclick = () => secWrap.classList.toggle('open');
    card.appendChild(row); card.appendChild(secWrap);
    list.appendChild(card);
  });
  wrap.appendChild(list);
}

function cardsForKey(key) {
  if (key.endsWith('-all')) {
    const n = parseInt(key.replace('ch','').replace('-all',''), 10);
    const oc = state.objByChapter[n];
    return { title: `Ch ${n}: ${state.chapters.find(c=>c.number===n).title}`, chapter: n,
             cards: oc.sections.flatMap(s => s.cards) };
  }
  for (const [n, oc] of Object.entries(state.objByChapter)) {
    const s = oc.sections.find(x => x.id === key);
    if (s) return { title: s.title, chapter: +n, cards: s.cards };
  }
  return null;
}
function startSession(key){ location.hash = `#/cards/${key}`; }

function renderSession(wrap, key) {
  const scope = cardsForKey(key);
  if (!scope) { location.hash = '#/cards'; return; }
  const u = unitOf(scope.chapter);
  document.documentElement.style.setProperty('--accent', u.color);

  const sess = {
    queue: [...scope.cards], mastered: new Set(), ratings: {},
    round: 1, roundSize: scope.cards.length, reviewsThisRound: 0, total: scope.cards.length,
  };
  const store = key => `bio40b.conf.${key}`; // persist last confidence per objective (local only)

  const head = el('div','session-head');
  const back = el('button','back','← All decks'); back.onclick = () => location.hash = '#/cards';
  head.appendChild(back);
  head.appendChild(el('div', null, `<strong>${esc(scope.title)}</strong>`));
  wrap.appendChild(head);

  const track = el('div','progress-track'); const fill = el('div','progress-fill'); track.appendChild(fill);
  wrap.appendChild(track);
  const meta = el('div','meta-row'); wrap.appendChild(meta);
  const stage = el('div'); wrap.appendChild(stage);

  function update() {
    fill.style.width = `${sess.total ? (sess.mastered.size/sess.total*100) : 100}%`;
    meta.innerHTML = `<span>🔁 Round ${sess.round}</span><span>${sess.mastered.size}/${sess.total} mastered</span>`;
  }
  function rate(card, r) {
    sess.ratings[card.id ?? card.objective] = r;
    localStorage.setItem(store(card.objective), r);
    sess.queue.shift();
    if (r >= MASTERY) sess.mastered.add(card.objective); else sess.queue.push(card);
    sess.reviewsThisRound++;
    if (sess.reviewsThisRound >= sess.roundSize) {
      sess.reviewsThisRound = 0; sess.roundSize = sess.queue.length;
      if (sess.queue.length) sess.round++;
    }
    step();
  }
  function step() {
    update();
    stage.innerHTML = '';
    if (!sess.queue.length) { renderDone(); return; }
    const card = sess.queue[0];
    const fc = el('div','flashcard card');
    fc.innerHTML = `<div class="kick">OBJECTIVE</div><div class="obj">${esc(card.objective)}</div>`;
    const ans = el('div','ans'); ans.textContent = card.answer; ans.style.display = 'none';
    fc.appendChild(ans);
    stage.appendChild(fc);

    const revealBtn = el('button','reveal-btn','👁 Show answer');
    const ratingBox = el('div','rating');
    ratingBox.style.display = 'none';
    ratingBox.innerHTML = `<div class="lbl">How well did you know it?</div>`;
    const rrow = el('div','row');
    RATINGS.forEach(rl => {
      const b = el('button'); b.style.borderColor = rl.c; b.style.color = rl.c;
      b.innerHTML = `<span class="num">${rl.v}</span><span class="txt">${rl.t}</span>`;
      b.onclick = () => rate(card, rl.v);
      rrow.appendChild(b);
    });
    ratingBox.appendChild(rrow);
    ratingBox.appendChild(el('div','hint','4 or 5 masters the card · 1–3 brings it back'));

    const reveal = () => { ans.style.display='block'; revealBtn.style.display='none'; ratingBox.style.display='block'; };
    fc.onclick = reveal; revealBtn.onclick = reveal;
    stage.appendChild(revealBtn);
    stage.appendChild(ratingBox);
  }
  function renderDone() {
    const done = el('div','done card');
    done.innerHTML = `<div class="seal">✅</div><h2>All ${sess.total} objectives mastered</h2>
      <p class="muted">Finished in ${sess.round} round${sess.round===1?'':'s'}.</p>`;
    const recap = el('div','recap card');
    recap.appendChild(el('div', null, `<strong>Your confidence</strong>`));
    scope.cards.forEach(c => {
      const r = sess.ratings[c.id ?? c.objective];
      const rl = RATINGS.find(x=>x.v===r);
      const item = el('div','r-item');
      item.innerHTML = `<span class="r-num" style="background:color-mix(in srgb,${rl?.c||'#888'} 20%,transparent);color:${rl?.c||'#888'}">${r||'–'}</span><span>${esc(c.objective)}</span>`;
      recap.appendChild(item);
    });
    const actions = el('div','done-actions');
    const again = el('button', null, '↻ Study again'); again.onclick = () => { renderSession(clear(wrap), key); };
    const more  = el('button','primary','Pick another deck'); more.onclick = () => location.hash = '#/cards';
    actions.appendChild(again); actions.appendChild(more);
    stage.innerHTML=''; stage.appendChild(done); stage.appendChild(recap); stage.appendChild(actions);
    fill.style.width='100%';
  }
  step();
}
function clear(node){ node.innerHTML=''; return node; }

// ---- boot ----
(async function(){
  try {
    await loadData();
    window.addEventListener('hashchange', route);
    route();
  } catch (e) {
    $('#app').innerHTML = `<div class="card" style="padding:24px">Couldn't load study data. ${esc(String(e))}</div>`;
    console.error(e);
  }
})();
