import * as pdfjsLib from './node_modules/pdfjs-dist/build/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.mjs';

const tabsEl = document.getElementById('tabs');
const viewer = document.getElementById('viewer');
const pagesEl = document.getElementById('pages');
const empty = document.getElementById('empty');
const pageInfo = document.getElementById('pageinfo');

const SCROLL_STEP = 60; // about 3-4 lines
let zoom = 1.25;        // default size
let tabs = [];
let active = -1;
let viewId = 0;
let observer = null;

function currentPage() {
  const pages = pagesEl.children;
  let cur = 0;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].offsetTop <= viewer.scrollTop + 30) cur = i;
    else break;
  }
  return cur;
}

function updatePageInfo() {
  const t = tabs[active];
  pageInfo.textContent = t ? `${currentPage() + 1} / ${t.doc.numPages}` : '';
}

function goToPage(i) {
  const el = pagesEl.children[i];
  if (el) viewer.scrollTop = el.offsetTop - 8;
}

async function renderPage(div, id, doc) {
  if (id !== viewId || div.dataset.done) return;
  div.dataset.done = '1';
  try {
    const page = await doc.getPage(+div.dataset.n);
    if (id !== viewId) return;
    const dpr = window.devicePixelRatio || 1;
    const vp = page.getViewport({ scale: zoom * dpr });
    const c = document.createElement('canvas');
    c.width = vp.width;
    c.height = vp.height;
    c.style.width = '100%';
    c.style.height = '100%';
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    if (id !== viewId || !div.dataset.done) return;
    div.replaceChildren(c);
  } catch (e) { /* ignore */ }
}

async function buildView(ratio = null) {
  const id = ++viewId;
  if (observer) observer.disconnect();
  pagesEl.innerHTML = '';
  const t = tabs[active];
  if (!t) {
    empty.style.display = 'flex';
    pageInfo.textContent = '';
    return;
  }
  empty.style.display = 'none';

  const sizes = await Promise.all(
    Array.from({ length: t.doc.numPages }, async (_, i) => {
      const p = await t.doc.getPage(i + 1);
      const vp = p.getViewport({ scale: zoom });
      return { w: vp.width, h: vp.height };
    })
  );
  if (id !== viewId) return;

  observer = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) renderPage(en.target, id, t.doc);
      else { en.target.replaceChildren(); delete en.target.dataset.done; }
    }
  }, { root: viewer, rootMargin: '800px 0px' });

  sizes.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'page';
    div.style.width = s.w + 'px';
    div.style.height = s.h + 'px';
    div.dataset.n = i + 1;
    pagesEl.appendChild(div);
    observer.observe(div);
  });

  viewer.scrollTop = ratio !== null ? ratio * viewer.scrollHeight : t.scroll;
  updatePageInfo();
}

function renderTabs() {
  tabsEl.innerHTML = '';
  tabs.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'tab' + (i === active ? ' active' : '');
    el.innerHTML = `<span class="name">${t.name}</span><span class="x">×</span>`;
    el.onclick = () => { if (i !== active) switchTab(i); };
    el.querySelector('.x').onclick = (e) => { e.stopPropagation(); closeTab(i); };
    tabsEl.appendChild(el);
  });
}

async function switchTab(i) {
  if (tabs[active]) tabs[active].scroll = viewer.scrollTop;
  active = i;
  renderTabs();
  await buildView();
}

function closeTab(i) {
  const wasActive = i === active;
  tabs[i].doc.destroy();
  tabs.splice(i, 1);
  if (i < active) active--;
  if (active >= tabs.length) active = tabs.length - 1;
  renderTabs();
  if (wasActive) buildView();
}

async function addFile(name, data) {
  const doc = await pdfjsLib.getDocument({ data }).promise;
  tabs.push({ name, doc, scroll: 0 });
  switchTab(tabs.length - 1);
}

async function openDialog() {
  const files = await window.api.openFiles();
  for (const f of files) await addFile(f.name, f.data);
}

function changeZoom(delta) {
  if (!tabs[active]) return;
  const ratio = viewer.scrollTop / viewer.scrollHeight;
  zoom = Math.min(3, Math.max(0.4, zoom + delta));
  buildView(ratio);
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
}

document.getElementById('fs').onclick = toggleFullscreen;
document.addEventListener('fullscreenchange', () =>
  document.body.classList.toggle('fullscreen', !!document.fullscreenElement));
viewer.addEventListener('scroll', updatePageInfo);

document.addEventListener('keydown', (e) => {
  const t = tabs[active];
  const k = e.key.toLowerCase();

  if (e.ctrlKey) {
    if (k === 'o') { e.preventDefault(); openDialog(); }
    else if (k === 'w' && t) closeTab(active);
    else if (k === '=' || k === '+') changeZoom(0.1);
    else if (k === '-') changeZoom(-0.1);
    return;
  }

  if (k === 'f') { toggleFullscreen(); return; }
  if (!t) return;

  if (e.key === 'ArrowRight') {
    const c = currentPage();
    if (c < t.doc.numPages - 1) goToPage(c + 1);
  } else if (e.key === 'ArrowLeft') {
    const c = currentPage();
    if (c > 0) goToPage(c - 1);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    viewer.scrollBy(0, SCROLL_STEP);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    viewer.scrollBy(0, -SCROLL_STEP);
  }
});

document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  for (const f of e.dataTransfer.files) {
    if (f.name.toLowerCase().endsWith('.pdf')) {
      addFile(f.name, new Uint8Array(await f.arrayBuffer()));
    }
  }
});

let wheelTimer = null;
viewer.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  if (!tabs[active]) return;
  const ratio = viewer.scrollTop / viewer.scrollHeight;
  zoom = Math.min(3, Math.max(0.4, zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => buildView(ratio), 120);
}, { passive: false });

window.api.onOpenFiles(async (files) => {
  for (const f of files) await addFile(f.name, f.data);
});

window.api.getInitialFiles().then(async (files) => {
  for (const f of files) await addFile(f.name, f.data);
});