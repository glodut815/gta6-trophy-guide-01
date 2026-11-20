/* GTA 6 Trophy Guide — checklist, roadmap and missables for the 55 PS5 trophies.
   All data lives in data/trophies.json. Progress is saved in this browser only. */
(function () {
  'use strict';

  var STORAGE_KEY = 'gta6-trophy-guide-v1';
  var DATA_URL = 'data/trophies.json';

  var SOURCES = {
    powerpyx: { name: 'PowerPyx', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/' },
    gamemapa: { name: 'GameMapa', url: 'https://gamemapa.com/en/gta-6/guides/gta-6-trophy-achievement-list/' },
    howtovideogame: { name: 'HowToVideoGame', url: 'https://howtovideogame.com/gta-6-trophies/' },
    gtaboom: { name: 'GTA BOOM', url: 'https://www.gtaboom.com/every-gta-6-trophy-and-achievement-at-launch-and-how-to-unlock-them-fc5f' },
    keengamer: { name: 'KeenGamer', url: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/' },
    gtascoop: { name: 'GTA Scoop', url: 'https://gtascoop.com/guides/gta-6-trophies-achievements/' },
    mobalytics: { name: 'Mobalytics', url: 'https://mobalytics.gg/gamebase/guides/grand-theft-auto-6-all-trophies' },
    gamesfuze: { name: 'GamesFuze', url: 'https://gamesfuze.com/gta-6-wiki/achievements/' }
  };

  var KIND_LABELS = {
    platinum: 'Platinum',
    completion: '100% & Collections',
    activity: 'Activities',
    stranger: 'Strangers',
    robbery: 'Robberies',
    money: 'Money & Property',
    mischief: 'Mischief',
    story: 'Story'
  };

  var KIND_ORDER = ['platinum', 'story', 'completion', 'activity', 'stranger', 'robbery', 'money', 'mischief'];
  var GRADE_ORDER = ['Platinum', 'Gold', 'Silver', 'Bronze'];
  var UNSOLVED = ['in-the-beginning', 'capital-offense', 'bad-luck-i-guess', 'the-truth-is-out-there', 'ten-pin'];
  var DEMO_EARNED = ['just-like-paradise', 'paradise-lost', 'tits-ass-drug-money', 'vice-city-baby', 'top-of-the-world-ma', 'trust', 'master-of-none', 'whip-it-good', 'treat-yo-self', 'on-the-spot', 'a-classic-blitz-play', 'stick-fiddler'];

  var trophies = [];
  var byId = {};
  var earned = new Set();
  var demoMode = false;
  var filters = { kind: 'all', grade: 'all', status: 'all', search: '' };
  var hideSpoilers = false;
  var currentView = 'checklist';

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      var list = Array.isArray(data) ? data : data.earned;
      if (Array.isArray(list)) list.forEach(function (id) { earned.add(id); });
    } catch (e) { /* corrupted save: start fresh */ }
  }

  function saveProgress() {
    if (demoMode) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ app: 'gta6-trophy-guide', earned: Array.from(earned).sort() }));
    } catch (e) { /* storage unavailable: progress lives for this visit only */ }
  }

  function applyParams() {
    var q = new URLSearchParams(window.location.search);
    var view = q.get('view');
    if (view === 'roadmap' || view === 'missables' || view === 'checklist') currentView = view;
    if (q.get('spoiler') === 'on') hideSpoilers = true;
    if (q.get('demo') === '1' && earned.size === 0) {
      demoMode = true;
      DEMO_EARNED.forEach(function (id) { earned.add(id); });
    }
  }

  function isHiddenStory(t) {
    return hideSpoilers && t.story && !earned.has(t.id);
  }

  function visibleTrophies() {
    var q = filters.search.trim().toLowerCase();
    return trophies.filter(function (t) {
      if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
      if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
      if (filters.status === 'earned' && !earned.has(t.id)) return false;
      if (filters.status === 'remaining' && earned.has(t.id)) return false;
      if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function gradeChip(t) {
    var s = el('span', 'grade grade-' + t.grade, t.grade);
    return s;
  }

  function tag(text, cls) {
    return el('span', 'tag' + (cls ? ' ' + cls : ''), text);
  }

  function cardFor(t) {
    if (isHiddenStory(t)) {
      var hidden = el('article', 'card spoiler-hidden');
      hidden.appendChild(el('div', 'lock', '\uD83D\uDD12'));
      hidden.appendChild(el('p', null, 'Hidden story trophy — earn it to reveal it.'));
      return hidden;
    }
    var card = el('article', 'card' + (earned.has(t.id) ? ' earned' : ''));
    var top = el('div', 'card-top');
    top.appendChild(el('h3', 'card-name', t.name));
    top.appendChild(gradeChip(t));
    card.appendChild(top);
    card.appendChild(el('p', 'card-desc', t.description));
    var meta = el('div', 'card-meta');
    meta.appendChild(tag(KIND_LABELS[t.kind] || t.kind));
    if (t.story) meta.appendChild(tag('Story', 'story-tag'));
    if (t.hidden) meta.appendChild(tag('Hidden'));
    if (t.missable) meta.appendChild(tag('Missable', 'missable'));
    if (UNSOLVED.indexOf(t.id) !== -1) meta.appendChild(tag('Method unconfirmed', 'unconfirmed'));
    card.appendChild(meta);
    var check = el('label', 'card-check');
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('click', function (ev) { ev.stopPropagation(); });
    box.addEventListener('change', function () { toggleEarned(t.id); });
    check.appendChild(box);
    check.appendChild(document.createTextNode(earned.has(t.id) ? 'Earned' : 'Mark as earned'));
    card.appendChild(check);
    card.addEventListener('click', function () { openDetail(t); });
    return card;
  }

  function renderProgress() {
    var total = trophies.length;
    var count = 0;
    var byGrade = {};
    GRADE_ORDER.forEach(function (g) { byGrade[g] = [0, 0]; });
    trophies.forEach(function (t) {
      byGrade[t.grade][1] += 1;
      if (earned.has(t.id)) { count += 1; byGrade[t.grade][0] += 1; }
    });
    $('#earned-count').textContent = String(count);
    $('#total-count').textContent = String(total);
    $('#progress-fill').style.width = (total ? Math.round(count / total * 100) : 0) + '%';
    $('#grade-counts').textContent = GRADE_ORDER.map(function (g) {
      return g + ' ' + byGrade[g][0] + '/' + byGrade[g][1];
    }).join('  ·  ');
  }

  function renderChecklist() {
    var grid = $('#trophy-grid');
    grid.textContent = '';
    var list = visibleTrophies();
    list.forEach(function (t) { grid.appendChild(cardFor(t)); });
    $('#empty-note').hidden = list.length !== 0;
    $('#count-line').textContent = 'Showing ' + list.length + ' of ' + trophies.length + ' trophies.';
  }

  function renderRoadmap() {
    var facts = $('#roadmap-facts');
    if (!facts.hasChildNodes()) {
      var data = [
        ['55', 'trophies: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze'],
        ['4 / 10', 'difficulty, per PowerPyx'],
        ['~200 h', 'to the platinum in one playthrough'],
        ['1', 'playthrough needed'],
        ['0', 'online trophies'],
        ['1', 'missable trophy']
      ];
      data.forEach(function (pair) {
        var f = el('div', 'fact');
        f.appendChild(el('b', null, pair[0]));
        f.appendChild(el('span', null, pair[1]));
        facts.appendChild(f);
      });
    }
    document.querySelectorAll('.step-trophies').forEach(function (box) {
      if (box.hasChildNodes()) return;
      var step = box.getAttribute('data-step');
      var list = trophies.filter(function (t) {
        if (step === 'story') return t.kind === 'story';
        if (step === 'completion') return t.kind !== 'story' && t.kind !== 'stranger' && t.kind !== 'platinum';
        if (step === 'strangers') return t.kind === 'stranger' || t.kind === 'platinum';
        return false;
      });
      list.forEach(function (t) {
        var chip = tag(t.name + (earned.has(t.id) ? ' ✓' : ''));
        chip.addEventListener('click', function () { openDetail(t); });
        box.appendChild(chip);
      });
    });
  }

  function renderMissables() {
    var grid = $('#missable-grid');
    grid.textContent = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) { grid.appendChild(cardFor(t)); });
    var ug = $('#unsolved-grid');
    ug.textContent = '';
    UNSOLVED.forEach(function (id) { if (byId[id]) ug.appendChild(cardFor(byId[id])); });
  }

  function renderAll() {
    renderProgress();
    renderChecklist();
    renderRoadmap();
    renderMissables();
  }

  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id); else earned.add(id);
    saveProgress();
    renderAll();
  }

  function buildFilters() {
    var kinds = $('#kind-filters');
    var all = el('button', 'chip active', 'All kinds');
    all.type = 'button';
    all.addEventListener('click', function () { filters.kind = 'all'; syncChips(kinds, all); renderChecklist(); });
    kinds.appendChild(all);
    KIND_ORDER.forEach(function (k) {
      var b = el('button', 'chip', KIND_LABELS[k]);
      b.type = 'button';
      b.addEventListener('click', function () { filters.kind = k; syncChips(kinds, b); renderChecklist(); });
      kinds.appendChild(b);
    });
    var grades = $('#grade-filters');
    var ga = el('button', 'chip active', 'All grades');
    ga.type = 'button';
    ga.addEventListener('click', function () { filters.grade = 'all'; syncChips(grades, ga); renderChecklist(); });
    grades.appendChild(ga);
    GRADE_ORDER.forEach(function (g) {
      var b = el('button', 'chip', g);
      b.type = 'button';
      b.addEventListener('click', function () { filters.grade = g; syncChips(grades, b); renderChecklist(); });
      grades.appendChild(b);
    });
    var status = $('#status-filters');
    [['all', 'All'], ['earned', 'Earned'], ['remaining', 'Not earned']].forEach(function (pair, i) {
      var b = el('button', 'chip' + (i === 0 ? ' active' : ''), pair[1]);
      b.type = 'button';
      b.addEventListener('click', function () { filters.status = pair[0]; syncChips(status, b); renderChecklist(); });
      status.appendChild(b);
    });
  }

  function syncChips(row, activeBtn) {
    Array.prototype.forEach.call(row.querySelectorAll('.chip'), function (c) { c.classList.remove('active'); });
    activeBtn.classList.add('active');
  }

  function showView(name) {
    currentView = name;
    document.querySelectorAll('.tab').forEach(function (tab) {
      var on = tab.getAttribute('data-view') === name;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.toggle('active', v.id === 'view-' + name);
    });
  }

  function openDetail(t) {
    var body = $('#detail-body');
    body.textContent = '';
    var head = el('div', 'card-top');
    head.appendChild(el('h2', null, t.name));
    head.appendChild(gradeChip(t));
    body.appendChild(head);
    body.appendChild(el('p', 'official', 'Official description: “' + t.description + '”'));
    var meta = el('div', 'card-meta');
    meta.appendChild(tag(KIND_LABELS[t.kind] || t.kind));
    if (t.story) meta.appendChild(tag('Story', 'story-tag'));
    if (t.hidden) meta.appendChild(tag('Hidden'));
    if (t.missable) meta.appendChild(tag('Missable', 'missable'));
    if (UNSOLVED.indexOf(t.id) !== -1) meta.appendChild(tag('Method unconfirmed', 'unconfirmed'));
    body.appendChild(meta);
    if (t.missable) {
      var warn = el('p', null, 'Missable: this is the one trophy you can miss. Read the guide before Chapter 1 ends.');
      warn.style.color = 'var(--danger)';
      body.appendChild(warn);
    }
    body.appendChild(el('h3', null, 'Guide'));
    body.appendChild(el('p', 'guide-text', t.guide));
    var src = el('p', 'sources', 'Sources: ');
    t.sources.forEach(function (key, i) {
      var s = SOURCES[key];
      if (!s) return;
      if (i > 0) src.appendChild(document.createTextNode(', '));
      var a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      src.appendChild(a);
    });
    body.appendChild(src);
    var toggle = el('button', null, earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned');
    toggle.type = 'button';
    toggle.style.marginTop = '12px';
    toggle.addEventListener('click', function () {
      toggleEarned(t.id);
      toggle.textContent = earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
    });
    body.appendChild(toggle);
    var dlg = $('#detail-dialog');
    if (typeof dlg.showModal === 'function') dlg.showModal();
  }

  function renderSources() {
    var span = $('#source-list');
    Object.keys(SOURCES).forEach(function (key, i) {
      if (i > 0) span.appendChild(document.createTextNode(', '));
      var a = document.createElement('a');
      a.href = SOURCES[key].url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = SOURCES[key].name;
      span.appendChild(a);
    });
  }

  function exportProgress() {
    var blob = new Blob([JSON.stringify({ app: 'gta6-trophy-guide', exportedAt: new Date().toISOString(), earned: Array.from(earned).sort() }, null, 2)], { type: 'application/json' });
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
        var data = JSON.parse(String(reader.result));
        var list = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(list)) throw new Error('bad file');
        var next = new Set();
        list.forEach(function (id) { if (byId[id]) next.add(id); });
        earned = next;
        saveProgress();
        renderAll();
      } catch (e) {
        window.alert('That file is not a progress export from this guide.');
      }
    };
    reader.readAsText(file);
  }

  function init() {
    loadProgress();
    applyParams();
    buildFilters();
    renderSources();
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { showView(tab.getAttribute('data-view')); });
    });
    $('#search').addEventListener('input', function (ev) {
      filters.search = ev.target.value;
      renderChecklist();
    });
    var spoiler = $('#spoiler-toggle');
    spoiler.checked = hideSpoilers;
    spoiler.addEventListener('change', function () {
      hideSpoilers = spoiler.checked;
      renderChecklist();
      renderMissables();
    });
    $('#export-btn').addEventListener('click', exportProgress);
    $('#import-btn').addEventListener('click', function () { $('#import-file').click(); });
    $('#import-file').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    $('#reset-btn').addEventListener('click', function () {
      if (window.confirm('Clear all checked trophies?')) {
        earned = new Set();
        saveProgress();
        renderAll();
      }
    });
    showView(currentView);
    fetch(DATA_URL).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      trophies = data;
      trophies.forEach(function (t) { byId[t.id] = t; });
      renderAll();
    }).catch(function () {
      $('#trophy-grid').textContent = '';
      var p = el('p', 'empty', 'Could not load the trophy list. Open this guide through its local server instead of opening the file directly: run "node serve.ts" in the repository, then open http://localhost:8080');
      $('#trophy-grid').appendChild(p);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
