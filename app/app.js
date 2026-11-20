(function () {
  'use strict';
  var STORE_KEY = 'gta6-trophy-guide-v1';
  var SPOILER_KEY = 'gta6-trophy-guide-spoiler-v1';
  var state = { earned: {}, spoiler: false, missableOnly: false, kind: 'all', grade: 'all', status: 'all', query: '' };
  var data = null;
  var grid = document.getElementById('grid');
  var searchEl = document.getElementById('search');
  var kindEl = document.getElementById('kindFilter');
  var gradeEl = document.getElementById('gradeFilter');
  var statusEl = document.getElementById('statusFilter');
  var spoilerEl = document.getElementById('spoilerToggle');
  var missableEl = document.getElementById('missableToggle');
  var resultCount = document.getElementById('resultCount');
  var dialog = document.getElementById('detail');
  var currentId = null;

  function loadStored() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) state.earned = JSON.parse(raw) || {};
      state.spoiler = localStorage.getItem(SPOILER_KEY) === '1';
    } catch (e) { state.earned = {}; }
    spoilerEl.checked = state.spoiler;
  }
  function saveStored() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.earned));
      localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
    } catch (e) { /* storage unavailable: progress lives only in memory */ }
  }
  function earnedCount() {
    return data.trophies.filter(function (t) { return state.earned[t.id]; }).length;
  }
  function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }
  function kindLabel(k) { return k.charAt(0).toUpperCase() + k.slice(1); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function sourceUrl(name) {
    var hit = (data.sources || []).filter(function (s) { return s.name.indexOf(name) === 0; })[0];
    return hit ? hit.url : null;
  }
  function renderSources() {
    var ul = document.getElementById('sourceList');
    ul.innerHTML = '';
    (data.sources || []).forEach(function (s) {
      var li = document.createElement('li');
      if (s.url) {
        var a = document.createElement('a');
        a.href = s.url; a.textContent = s.name; a.target = '_blank'; a.rel = 'noopener';
        li.appendChild(a);
      } else { li.textContent = s.name; }
      ul.appendChild(li);
    });
  }
  function matches(t) {
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.status === 'earned' && !state.earned[t.id]) return false;
    if (state.status === 'remaining' && state.earned[t.id]) return false;
    if (state.missableOnly && !t.missable) return false;
    if (state.query) {
      var q = state.query.toLowerCase();
      var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }
  function render() {
    var shown = data.trophies.filter(matches);
    grid.innerHTML = '';
    shown.forEach(function (t) {
      var card = el('article', 'card' + (state.earned[t.id] ? ' earned' : ''));
      if (state.spoiler && t.spoiler && !state.earned[t.id]) card.classList.add('hidden-spoiler');
      card.dataset.id = t.id;
      var top = el('div', 'card-top');
      top.appendChild(el('span', 'grade ' + t.grade, gradeLabel(t.grade)));
      top.appendChild(el('span', 'kind', kindLabel(t.kind)));
      card.appendChild(top);
      card.appendChild(el('h3', 't-name', t.name));
      card.appendChild(el('p', 't-desc', t.description));
      var flags = el('div', 'flags');
      if (t.missable) flags.appendChild(el('span', 'flag missable', 'Possibly missable'));
      if (t.spoiler) flags.appendChild(el('span', 'flag story', 'Story / hidden'));
      if (flags.children.length) card.appendChild(flags);
      var foot = el('div', 'card-foot');
      foot.appendChild(el('span', 'earn-state', state.earned[t.id] ? '✓ Earned' : 'Not earned'));
      var btn = el('button', 'guide-btn', 'Guide');
      btn.type = 'button';
      btn.addEventListener('click', function (ev) { ev.stopPropagation(); openDetail(t.id); });
      foot.appendChild(btn);
      card.appendChild(foot);
      card.addEventListener('click', function () { toggleEarned(t.id); });
      grid.appendChild(card);
    });
    if (!shown.length) {
      var p = el('p', 'empty', 'No trophies match these filters. Try clearing the search or a filter.');
      grid.appendChild(p);
    }
    var n = earnedCount();
    document.getElementById('earnedCount').textContent = n + ' / ' + data.trophies.length;
    document.getElementById('progressFill').style.width = Math.round(n / data.trophies.length * 100) + '%';
    var gc = {};
    data.trophies.forEach(function (t) { if (state.earned[t.id]) gc[t.grade] = (gc[t.grade] || 0) + 1; });
    document.getElementById('gradeCounts').textContent =
      'Platinum ' + (gc.platinum || 0) + '/1 · Gold ' + (gc.gold || 0) + '/2 · Silver ' + (gc.silver || 0) + '/6 · Bronze ' + (gc.bronze || 0) + '/46';
    resultCount.textContent = shown.length + ' of ' + data.trophies.length + ' trophies shown';
  }
  function toggleEarned(id) {
    if (state.earned[id]) delete state.earned[id]; else state.earned[id] = true;
    saveStored();
    render();
    if (currentId === id && dialog.open) openDetail(id);
  }
  function openDetail(id) {
    var t = data.trophies.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    currentId = id;
    document.getElementById('dGrade').textContent = gradeLabel(t.grade) + ' · ' + kindLabel(t.kind) + (t.missable ? ' · Possibly missable' : '');
    document.getElementById('dName').textContent = t.name;
    document.getElementById('dDesc').textContent = t.description;
    document.getElementById('dMeta').textContent = t.spoiler ? 'Story / hidden trophy — names missions, characters or story moments.' : 'Spoiler-free trophy.';
    document.getElementById('dGuide').textContent = t.guide;
    var ul = document.getElementById('dSources');
    ul.innerHTML = '';
    t.sources.forEach(function (name) {
      var li = document.createElement('li');
      var url = sourceUrl(name);
      if (url) {
        var a = document.createElement('a');
        a.href = url; a.textContent = name; a.target = '_blank'; a.rel = 'noopener';
        li.appendChild(a);
      } else { li.textContent = name; }
      ul.appendChild(li);
    });
    var btn = document.getElementById('dToggle');
    btn.textContent = state.earned[id] ? 'Mark as not earned' : 'Mark as earned';
    btn.onclick = function () { toggleEarned(id); };
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }
  function exportProgress() {
    var payload = { app: 'gta6-trophy-guide-01', version: 1, exportedAt: new Date().toISOString(), earned: Object.keys(state.earned).filter(function (k) { return state.earned[k]; }) };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(reader.result);
        var list = payload.earned || payload;
        if (!Array.isArray(list)) throw new Error('bad file');
        var next = {};
        list.forEach(function (id) {
          if (data.trophies.some(function (t) { return t.id === id; })) next[id] = true;
        });
        state.earned = next;
        saveStored();
        render();
        resultCount.textContent = 'Imported ' + Object.keys(next).length + ' earned trophies.';
      } catch (e) {
        resultCount.textContent = 'Import failed: that file is not a progress export from this guide.';
      }
    };
    reader.readAsText(file);
  }
  function wire() {
    searchEl.addEventListener('input', function () { state.query = searchEl.value.trim(); render(); });
    kindEl.addEventListener('change', function () { state.kind = kindEl.value; render(); });
    gradeEl.addEventListener('change', function () { state.grade = gradeEl.value; render(); });
    statusEl.addEventListener('change', function () { state.status = statusEl.value; render(); });
    spoilerEl.addEventListener('change', function () { state.spoiler = spoilerEl.checked; saveStored(); render(); });
    missableEl.addEventListener('change', function () { state.missableOnly = missableEl.checked; render(); });
    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('importBtn').addEventListener('click', function () { document.getElementById('importFile').click(); });
    document.getElementById('importFile').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', function () {
      if (window.confirm('Reset all progress? This clears every earned tick in this browser.')) {
        state.earned = {};
        saveStored();
        render();
      }
    });
    document.getElementById('warnJump').addEventListener('click', function () {
      state.missableOnly = true;
      missableEl.checked = true;
      render();
      var card = grid.querySelector('[data-id="positive-mental-attitude"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  window.__trophyGuide = {
    get earned() { return earnedCount(); },
    get total() { return data ? data.trophies.length : 0; },
    toggle: toggleEarned,
    open: openDetail
  };
  fetch('data/trophies.json')
    .then(function (r) { if (!r.ok) throw new Error('trophies.json failed to load'); return r.json(); })
    .then(function (json) { data = json; loadStored(); renderSources(); wire(); render(); })
    .catch(function (err) {
      grid.innerHTML = '<p class="empty">Could not load the trophy list: ' + err.message + '</p>';
    });
})();
