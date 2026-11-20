/* Leonida Trophy Guide — offline checklist app.
   Loads app/data/trophies.json, keeps progress in localStorage,
   exports/imports it as JSON. No network calls. */
(function () {
  'use strict';

  var STORAGE_KEY = 'leonida-trophy-guide-v1';
  var DATA_URL = 'data/trophies.json';

  var KIND_LABELS = {
    story: 'Story', completion: '100% & collections', activity: 'Activity',
    side: 'Side character', crime: 'Crime & police', money: 'Money & property',
    exploration: 'Exploration', mischief: 'Mischief', platinum: 'Platinum'
  };

  var state = {
    trophies: [],
    earned: {},
    hideSpoilers: true,
    kind: 'all',
    grade: 'all',
    status: 'all',
    query: ''
  };

  var els = {};
  ['earned-count', 'progress-fill', 'progress-bar', 'progress-sub', 'search',
   'filter-kind', 'filter-grade', 'filter-status', 'spoiler-toggle',
   'export-btn', 'import-file', 'reset-btn', 'saved-note', 'trophy-list',
   'empty-state', 'list-count', 'list-title', 'missable-jump',
   'detail-dialog', 'detail-grade', 'detail-name', 'detail-desc',
   'detail-flags', 'detail-guide', 'detail-sources', 'detail-earned'
  ].forEach(function (id) { els[id] = document.getElementById(id); });

  function loadEarned() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) { return {}; }
  }

  function saveEarned(note) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.earned));
      if (note) {
        els['saved-note'].textContent = note;
        setTimeout(function () { els['saved-note'].textContent = ''; }, 2500);
      }
    } catch (e) { /* storage full or unavailable: progress stays in memory */ }
  }

  function gradeClass(grade) { return 'grade-' + grade; }

  function isSpoiled(t) {
    return state.hideSpoilers && t.spoiler && !state.earned[t.id];
  }

  function matches(t) {
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.status === 'earned' && !state.earned[t.id]) return false;
    if (state.status === 'todo' && state.earned[t.id]) return false;
    if (state.status === 'missable' && !t.missable) return false;
    if (state.status === 'unconfirmed' && !t.unconfirmed) return false;
    if (state.query) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.kind || '')).toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  function flagHtml(t) {
    var out = '';
    if (t.missable) out += '<span class="flag flag-missable">Missable</span>';
    if (t.hidden) out += '<span class="flag flag-hidden">Hidden</span>';
    if (t.unconfirmed) out += '<span class="flag flag-unconfirmed">Unconfirmed</span>';
    return out;
  }

  function renderList() {
    var list = state.trophies.filter(matches);
    var html = '';
    list.forEach(function (t) {
      var earned = !!state.earned[t.id];
      var spoiled = isSpoiled(t);
      html += '<article class="card' + (earned ? ' earned' : '') + '" data-id="' + t.id + '">' +
        '<div class="card-top"><span class="grade ' + gradeClass(t.grade) + '">' + t.grade + '</span>' +
        '<span class="kind">' + (KIND_LABELS[t.kind] || t.kind) + '</span></div>' +
        '<h3 class="' + (spoiled ? 'spoiled' : '') + '">' + escapeHtml(t.name) + '</h3>' +
        (spoiled
          ? '<p class="spoiler-note">Story trophy — hidden until earned. Tap the card to reveal it.</p>'
          : '<p class="desc">' + escapeHtml(t.description) + '</p>') +
        '<div class="flags">' + flagHtml(t) + '</div>' +
        '<div class="card-foot">' +
          '<button type="button" class="earned-toggle" data-toggle="' + t.id + '">' +
            (earned ? '✓ Earned — tap to undo' : '○ Mark as earned') +
          '</button>' +
          '<span class="open-hint">Guide →</span>' +
        '</div></article>';
    });
    els['trophy-list'].innerHTML = html;
    els['empty-state'].hidden = list.length > 0;
    els['list-count'].textContent = list.length + ' of ' + state.trophies.length + ' trophies shown';
  }

  function renderProgress() {
    var total = state.trophies.length || 55;
    var earned = state.trophies.filter(function (t) { return state.earned[t.id]; }).length;
    var pct = total ? Math.round((earned / total) * 100) : 0;
    els['earned-count'].textContent = earned;
    els['progress-fill'].style.width = pct + '%';
    els['progress-bar'].setAttribute('aria-valuenow', String(earned));
    els['progress-sub'].textContent = 'Platinum progress: ' + pct + '% · ' +
      (total - earned) + ' to go';
  }

  function render() { renderProgress(); renderList(); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findTrophy(id) {
    for (var i = 0; i < state.trophies.length; i++) {
      if (state.trophies[i].id === id) return state.trophies[i];
    }
    return null;
  }

  function openDetail(t) {
    els['detail-grade'].textContent = t.grade + ' trophy · ' + (KIND_LABELS[t.kind] || t.kind);
    els['detail-name'].textContent = t.name;
    els['detail-desc'].textContent = t.description;
    els['detail-flags'].innerHTML = flagHtml(t) +
      (t.unconfirmed ? '<span class="flag flag-unconfirmed">' + escapeHtml(t.unconfirmed) + '</span>' : '');
    els['detail-guide'].textContent = t.guide;
    els['detail-sources'].innerHTML = (t.sources || []).map(function (s) {
      return '<li>' + escapeHtml(s) + '</li>';
    }).join('');
    els['detail-earned'].checked = !!state.earned[t.id];
    els['detail-earned'].dataset.trophyId = t.id;
    if (typeof els['detail-dialog'].showModal === 'function') {
      els['detail-dialog'].showModal();
    }
  }

  function toggleEarned(id) {
    if (state.earned[id]) { delete state.earned[id]; }
    else { state.earned[id] = true; }
    saveEarned('Progress saved');
    render();
  }

  function exportProgress() {
    var payload = {
      app: 'leonida-trophy-guide',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: Object.keys(state.earned).filter(function (id) { return state.earned[id]; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    els['saved-note'].textContent = 'Exported ' + payload.earned.length + ' earned trophies';
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : (data.earned || []);
        var next = {};
        var valid = {};
        state.trophies.forEach(function (t) { valid[t.id] = true; });
        var count = 0;
        ids.forEach(function (id) {
          if (typeof id === 'string' && valid[id]) { next[id] = true; count++; }
        });
        state.earned = next;
        saveEarned('Imported ' + count + ' earned trophies');
        render();
      } catch (e) {
        els['saved-note'].textContent = 'That file could not be read as progress — try exporting first.';
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!window.confirm('Reset all trophy progress? This cannot be undone.')) return;
    state.earned = {};
    saveEarned('Progress reset');
    render();
  }

  function bindEvents() {
    var debounce = null;
    els.search.addEventListener('input', function () {
      clearTimeout(debounce);
      var value = els.search.value;
      debounce = setTimeout(function () {
        state.query = value.trim().toLowerCase();
        renderList();
      }, 150);
    });
    els['filter-kind'].addEventListener('change', function () {
      state.kind = els['filter-kind'].value; renderList();
    });
    els['filter-grade'].addEventListener('change', function () {
      state.grade = els['filter-grade'].value; renderList();
    });
    els['filter-status'].addEventListener('change', function () {
      state.status = els['filter-status'].value; renderList();
    });
    els['spoiler-toggle'].addEventListener('change', function () {
      state.hideSpoilers = els['spoiler-toggle'].checked; renderList();
    });
    els['export-btn'].addEventListener('click', exportProgress);
    els['import-file'].addEventListener('change', function () {
      if (els['import-file'].files[0]) importProgress(els['import-file'].files[0]);
      els['import-file'].value = '';
    });
    els['reset-btn'].addEventListener('click', resetProgress);
    els['missable-jump'].addEventListener('click', function () {
      state.kind = 'all'; state.grade = 'all'; state.status = 'missable'; state.query = '';
      els['filter-kind'].value = 'all';
      els['filter-grade'].value = 'all';
      els['filter-status'].value = 'missable';
      els.search.value = '';
      renderList();
      var card = document.querySelector('.card[data-id="positive-mental-attitude"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    els['trophy-list'].addEventListener('click', function (ev) {
      var toggle = ev.target.closest('[data-toggle]');
      if (toggle) { toggleEarned(toggle.getAttribute('data-toggle')); return; }
      var card = ev.target.closest('.card');
      if (!card) return;
      var t = findTrophy(card.getAttribute('data-id'));
      if (t) openDetail(t);
    });
    els['detail-earned'].addEventListener('change', function () {
      var id = els['detail-earned'].dataset.trophyId;
      if (!id) return;
      if (els['detail-earned'].checked) { state.earned[id] = true; }
      else { delete state.earned[id]; }
      saveEarned('Progress saved');
      render();
    });
  }

  function init() {
    state.earned = loadEarned();
    bindEvents();
    fetch(DATA_URL)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        state.trophies = data.trophies || [];
        render();
      })
      .catch(function () {
        els['trophy-list'].innerHTML =
          '<p class="empty">Could not load the trophy list. Open this guide from its own folder so data/trophies.json loads.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
