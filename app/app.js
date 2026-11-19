// GTA 6 Trophy Guide — Leonida Checklist.
// Offline tracker: loads app/data/trophies.json, saves progress in localStorage,
// filters by kind, hides hidden trophies while spoiler-safe is on, exports/imports
// progress, and renders the roadmap to the Platinum. No network requests.

const DATA_URL = 'data/trophies.json';
const STORAGE_KEY = 'gta6-trophy-guide-v1';

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const KIND_LABEL = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  world: 'World',
  online: 'Online',
};

let guideData = null;
let state = loadState();
let openTrophyId = null;

const ui = {
  view: 'checklist',
  kind: 'all',
  grade: 'all',
  search: '',
  sort: 'id',
  spoiler: true,
  earnedOnly: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: {}, counts: {} };
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
    };
  } catch {
    return { earned: {}, counts: {} };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: progress stays for this session only.
  }
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'roadmap' || view === 'missables' || view === 'checklist') ui.view = view;
  const filter = params.get('filter');
  if (filter && (filter === 'all' || KIND_LABEL[filter])) ui.kind = filter;
  const spoiler = params.get('spoiler');
  if (spoiler === 'on') ui.spoiler = true;
  if (spoiler === 'off') ui.spoiler = false;
  const open = params.get('open');
  if (open && /^\d+$/.test(open)) openTrophyId = Number(open);
  const earned = params.get('earned');
  if (earned) {
    let changed = false;
    for (const part of earned.split(',')) {
      const id = Number(part.trim());
      if (Number.isInteger(id) && id >= 1 && id <= 55 && !state.earned[id]) {
        state.earned[id] = true;
        changed = true;
      }
    }
    if (changed) saveState();
  }
}

async function loadData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('Could not load ' + DATA_URL);
  guideData = await response.json();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trophyById(id) {
  return guideData.trophies.find(function (t) { return t.id === id; });
}

function isEarned(trophy) {
  return Boolean(state.earned[trophy.id]);
}

function trophyCount(trophy) {
  const value = Number(state.counts[trophy.id]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function isSpoilerHidden(trophy) {
  return ui.spoiler && trophy.hidden && !isEarned(trophy);
}

function visibleName(trophy) {
  return isSpoilerHidden(trophy) ? 'Hidden trophy' : trophy.name;
}

function visibleDescription(trophy) {
  if (!isSpoilerHidden(trophy)) return trophy.description;
  return 'Hidden on PlayStation until earned. Turn spoiler-safe off, or earn it, to reveal the name and description.';
}

function toggleEarned(id, checked) {
  state.earned[id] = checked;
  if (!checked) delete state.earned[id];
  saveState();
  renderAll();
}

function setCount(id, value) {
  const trophy = trophyById(id);
  if (!trophy || !trophy.count) return;
  const clamped = Math.max(0, Math.min(trophy.count, Math.floor(value) || 0));
  if (clamped === 0) delete state.counts[id];
  else state.counts[id] = clamped;
  if (clamped >= trophy.count) state.earned[id] = true;
  saveState();
  renderAll();
}

function changeCount(id, delta) {
  setCount(id, trophyCount(trophyById(id)) + delta);
}

function filteredTrophies() {
  const query = ui.search.trim().toLowerCase();
  let list = guideData.trophies.slice();
  if (ui.kind === 'missable') list = list.filter(function (t) { return t.missable; });
  else if (ui.kind === 'online') list = [];
  else if (ui.kind !== 'all') list = list.filter(function (t) { return t.kind === ui.kind; });
  if (ui.grade !== 'all') list = list.filter(function (t) { return t.grade === ui.grade; });
  if (ui.earnedOnly) list = list.filter(function (t) { return isEarned(t); });
  if (query) {
    list = list.filter(function (t) {
      return (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(query);
    });
  }
  if (ui.sort === 'grade') {
    list.sort(function (a, b) {
      return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id;
    });
  } else if (ui.sort === 'stage') {
    list.sort(function (a, b) { return a.stage - b.stage || a.id - b.id; });
  } else if (ui.sort === 'name') {
    list.sort(function (a, b) { return a.name.localeCompare(b.name); });
  } else {
    list.sort(function (a, b) { return a.id - b.id; });
  }
  return list;
}

function gradeBadge(trophy) {
  return '<span class="grade-badge grade-' + trophy.grade + '" title="' + trophy.grade + '">' +
    GRADE_LETTER[trophy.grade] + '</span>';
}

function trophyTags(trophy) {
  const tags = [];
  tags.push('<span class="tag tag-kind">' + KIND_LABEL[trophy.kind] + '</span>');
  tags.push('<span class="tag tag-stage">Stage ' + trophy.stage + '</span>');
  if (trophy.hidden) tags.push('<span class="tag tag-hidden">Hidden</span>');
  if (trophy.missable) tags.push('<span class="tag tag-missable">Missable</span>');
  return tags.join('');
}

function countStepperHtml(trophy) {
  if (!trophy.count) return '';
  const current = trophyCount(trophy);
  const done = current >= trophy.count;
  return '<div class="count-stepper" data-stepper="' + trophy.id + '">' +
    '<button type="button" data-delta="-1" aria-label="Decrease count">−</button>' +
    '<input type="number" min="0" max="' + trophy.count + '" value="' + current + '" aria-label="Progress count">' +
    '<button type="button" data-delta="1" aria-label="Increase count">+</button>' +
    '<span>/ ' + trophy.count.toLocaleString('en-US') + ' ' + escapeHtml(trophy.countLabel || '') + '</span>' +
    (done ? '<span class="count-done">Done</span>' : '') +
    '</div>';
}

function trophyCardHtml(trophy) {
  const earned = isEarned(trophy);
  const open = openTrophyId === trophy.id;
  const hidden = isSpoilerHidden(trophy);
  let html = '<li class="trophy' + (earned ? ' is-earned' : '') + '" data-id="' + trophy.id + '">';
  html += '<div class="trophy-head" role="button" tabindex="0" data-toggle="' + trophy.id + '" aria-expanded="' + open + '">';
  html += gradeBadge(trophy);
  html += '<div class="trophy-main">';
  html += '<div class="trophy-name">' + escapeHtml(visibleName(trophy)) + '</div>';
  html += '<div class="trophy-desc">' + escapeHtml(visibleDescription(trophy)) + '</div>';
  html += '<div class="trophy-tags">' + trophyTags(trophy) + '</div>';
  html += countStepperHtml(trophy);
  html += '</div>';
  html += '<label class="trophy-check" data-check="' + trophy.id + '">';
  html += '<input type="checkbox"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + escapeHtml(visibleName(trophy)) + ' as earned">';
  html += '<span>' + (earned ? 'Earned' : 'Earn') + '</span></label>';
  html += '</div>';
  if (open && !hidden) {
    html += '<div class="trophy-detail">';
    html += '<h3>Guide</h3><p>' + escapeHtml(trophy.guide) + '</p>';
    if (trophy.steps && trophy.steps.length) {
      html += '<h3>Steps</h3><ol>';
      for (const step of trophy.steps) html += '<li>' + escapeHtml(step) + '</li>';
      html += '</ol>';
    }
    if (trophy.missable) {
      html += '<p class="missable-warning"><strong>Missable:</strong> the Chapter 1 balcony meditation disappears after Chapter 1. Do it early and keep a manual save from Chapter 1 until this trophy pops.</p>';
    }
    if (trophy.sources && trophy.sources.length) {
      html += '<p class="detail-sources">Sources: ';
      html += trophy.sources.map(function (s) {
        return '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.name) + '</a>';
      }).join(' · ');
      html += '</p>';
    }
    html += '</div>';
  }
  if (open && hidden) {
    html += '<div class="trophy-detail"><p>Earn this trophy to reveal its guide — it stays hidden while spoiler-safe is on.</p></div>';
  }
  html += '</li>';
  return html;
}

function renderProgress() {
  const total = guideData.trophies.length;
  const earned = guideData.trophies.filter(isEarned).length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById('earned-count').textContent = earned + ' / ' + total;
  document.getElementById('earned-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map(function (grade) {
    const all = guideData.trophies.filter(function (t) { return t.grade === grade; }).length;
    const got = guideData.trophies.filter(function (t) { return t.grade === grade && isEarned(t); }).length;
    return GRADE_LETTER[grade] + ' ' + got + '/' + all;
  }).join(' · ');
  document.getElementById('grade-counts').textContent = byGrade;
}

function renderChecklist() {
  const list = filteredTrophies();
  const listEl = document.getElementById('trophy-list');
  const noteEl = document.getElementById('list-note');
  const emptyEl = document.getElementById('list-empty');
  if (ui.kind === 'online') {
    noteEl.textContent = 'No online trophies: the whole list is offline single-player (PowerPyx). Nothing to filter here.';
    listEl.innerHTML = '';
    emptyEl.hidden = false;
    emptyEl.textContent = 'No online trophies in GTA 6.';
    return;
  }
  noteEl.textContent = 'Showing ' + list.length + ' of 55 trophies' +
    (ui.kind !== 'all' ? ' · ' + KIND_LABEL[ui.kind] : '') +
    (ui.grade !== 'all' ? ' · ' + ui.grade : '') +
    (ui.spoiler ? ' · spoiler-safe on' : ' · spoiler-safe off') + '.';
  listEl.innerHTML = list.map(trophyCardHtml).join('');
  emptyEl.hidden = list.length > 0;
}

function renderRoadmap() {
  const container = document.getElementById('roadmap');
  container.innerHTML = guideData.roadmap.map(function (stage) {
    const stageTrophies = stage.trophies.map(trophyById).filter(Boolean);
    const earned = stageTrophies.filter(isEarned).length;
    let html = '<li class="stage-card"><h3><span class="stage-n">' + stage.stage + '</span>' +
      escapeHtml(stage.title) + '</h3>';
    html += '<p>' + escapeHtml(stage.text) + '</p>';
    html += '<p class="stage-progress">' + earned + ' / ' + stageTrophies.length + ' earned in this stage</p>';
    html += '<ul class="stage-trophies">';
    for (const trophy of stageTrophies) {
      html += '<li class="' + (isEarned(trophy) ? 'is-earned' : '') + '">' +
        '<span class="dot dot-' + trophy.grade + '"></span>' +
        escapeHtml(isSpoilerHidden(trophy) ? 'Hidden trophy' : trophy.name) + '</li>';
    }
    html += '</ul></li>';
    return html;
  }).join('');
}

function renderMissables() {
  const list = guideData.trophies.filter(function (t) { return t.missable; });
  document.getElementById('missable-list').innerHTML = list.map(trophyCardHtml).join('');
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderMissables();
}

function switchView(view) {
  ui.view = view;
  document.querySelectorAll('.view-tab').forEach(function (tab) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(function (section) {
    section.classList.toggle('is-active', section.id === 'view-' + view);
  });
}

function setKind(kind) {
  ui.kind = kind;
  document.querySelectorAll('#kind-chips .chip').forEach(function (chip) {
    chip.classList.toggle('is-active', chip.dataset.kind === kind);
  });
  renderChecklist();
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: Object.keys(state.earned).map(Number),
    counts: state.counts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  document.getElementById('data-status').textContent = 'Progress exported to gta6-trophy-progress.json.';
}

function importProgress(file) {
  const status = document.getElementById('data-status');
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const parsed = JSON.parse(String(reader.result));
      const earned = {};
      const counts = {};
      const earnedList = Array.isArray(parsed.earned) ? parsed.earned : Object.keys(parsed.earned || {});
      for (const id of earnedList) {
        const num = Number(id);
        if (Number.isInteger(num) && trophyById(num)) earned[num] = true;
      }
      if (parsed.counts && typeof parsed.counts === 'object') {
        for (const key of Object.keys(parsed.counts)) {
          const trophy = trophyById(Number(key));
          if (trophy && trophy.count) {
            counts[key] = Math.max(0, Math.min(trophy.count, Math.floor(Number(parsed.counts[key])) || 0));
          }
        }
      }
      state = { earned: earned, counts: counts };
      saveState();
      renderAll();
      status.textContent = 'Progress imported: ' + Object.keys(earned).length + ' trophies earned.';
    } catch {
      status.textContent = 'That file could not be read as progress. Export first, then import the same file back.';
    }
  };
  reader.readAsText(file);
}

function resetProgress() {
  if (!window.confirm('Reset all progress in this browser? This cannot be undone.')) return;
  state = { earned: {}, counts: {} };
  saveState();
  renderAll();
  document.getElementById('data-status').textContent = 'Progress reset.';
}

function bindEvents() {
  document.querySelectorAll('.view-tab').forEach(function (tab) {
    tab.addEventListener('click', function () { switchView(tab.dataset.view); });
  });
  document.querySelectorAll('#kind-chips .chip').forEach(function (chip) {
    chip.addEventListener('click', function () { setKind(chip.dataset.kind); });
  });
  document.getElementById('search').addEventListener('input', function (event) {
    ui.search = event.target.value;
    renderChecklist();
  });
  document.getElementById('grade-filter').addEventListener('change', function (event) {
    ui.grade = event.target.value;
    renderChecklist();
  });
  document.getElementById('sort').addEventListener('change', function (event) {
    ui.sort = event.target.value;
    renderChecklist();
  });
  document.getElementById('spoiler').addEventListener('change', function (event) {
    ui.spoiler = event.target.checked;
    renderAll();
  });
  document.getElementById('earned-only').addEventListener('change', function (event) {
    ui.earnedOnly = event.target.checked;
    renderChecklist();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', function (event) {
    importProgress(event.target.files && event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', resetProgress);

  document.addEventListener('click', function (event) {
    const check = event.target.closest('[data-check]');
    if (check) {
      event.stopPropagation();
      return;
    }
    const stepper = event.target.closest('[data-stepper]');
    if (stepper) {
      const button = event.target.closest('button[data-delta]');
      if (button) {
        event.stopPropagation();
        changeCount(Number(stepper.dataset.stepper), Number(button.dataset.delta));
      }
      event.stopPropagation();
      return;
    }
    const head = event.target.closest('[data-toggle]');
    if (head) {
      const id = Number(head.dataset.toggle);
      openTrophyId = openTrophyId === id ? null : id;
      renderAll();
      if (openTrophyId === id) {
        const card = document.querySelector('.trophy[data-id="' + id + '"]');
        if (card) card.scrollIntoView({ block: 'nearest' });
      }
    }
  });
  document.addEventListener('change', function (event) {
    const check = event.target.closest('[data-check]');
    if (check && event.target.type === 'checkbox') {
      event.stopPropagation();
      toggleEarned(Number(check.dataset.check), event.target.checked);
      return;
    }
    const stepper = event.target.closest('[data-stepper]');
    if (stepper && event.target.tagName === 'INPUT') {
      setCount(Number(stepper.dataset.stepper), Number(event.target.value));
    }
  });
  document.addEventListener('keydown', function (event) {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-toggle]')) {
      event.preventDefault();
      const id = Number(event.target.dataset.toggle);
      openTrophyId = openTrophyId === id ? null : id;
      renderAll();
    }
  });
}

function syncControls() {
  document.querySelectorAll('.view-tab').forEach(function (tab) {
    tab.classList.toggle('is-active', tab.dataset.view === ui.view);
  });
  document.querySelectorAll('.view').forEach(function (section) {
    section.classList.toggle('is-active', section.id === 'view-' + ui.view);
  });
  document.querySelectorAll('#kind-chips .chip').forEach(function (chip) {
    chip.classList.toggle('is-active', chip.dataset.kind === ui.kind);
  });
  document.getElementById('spoiler').checked = ui.spoiler;
}

async function boot() {
  applyUrlParams();
  await loadData();
  bindEvents();
  syncControls();
  renderAll();
  if (openTrophyId) {
    const card = document.querySelector('.trophy[data-id="' + openTrophyId + '"]');
    if (card) card.scrollIntoView({ block: 'center' });
  }
}

boot().catch(function (error) {
  document.getElementById('trophy-list').innerHTML =
    '<li class="trophy"><div class="trophy-detail"><p>Could not load the trophy list (' +
    escapeHtml(error.message) + '). The file app/data/trophies.json must sit next to this page.</p></div></li>';
});
