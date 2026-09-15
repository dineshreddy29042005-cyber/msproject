/* =============================================================
   results.js — My Reports page + Report detail modal
   ============================================================= */

let allResults   = [];
let activeResult = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  initNavUser();
  loadResults();
  initModal();
  initFilters();

  // If ?id=X in URL, auto-open that result
  const params   = new URLSearchParams(window.location.search);
  const resultId = params.get('id');
  if (resultId) {
    // Will be opened once results load
    window._autoOpenId = parseInt(resultId, 10);
  }
});

// ── Load All Results ─────────────────────────────────────────
async function loadResults() {
  const container = document.getElementById('resultsContainer');

  try {
    allResults = await API.analysis.myResults() || [];
    renderResults(allResults);

    // Auto-open if URL param present
    if (window._autoOpenId) {
      const r = allResults.find(x => x.id === window._autoOpenId);
      if (r) openReportModal(r);
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Failed to load reports</div>
        <div class="empty-subtitle">${escHtml(err.message)}</div>
        <button class="btn btn-outline btn-sm" style="margin-top:1rem" onclick="loadResults()">
          <i class="fa-solid fa-arrows-rotate"></i> Retry
        </button>
      </div>`;
  }
}

// ── Render Results Grid ──────────────────────────────────────
function renderResults(results) {
  const container = document.getElementById('resultsContainer');

  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:4rem 1rem">
        <div class="empty-icon">📊</div>
        <div class="empty-title">No reports yet</div>
        <div class="empty-subtitle">Upload a document to run your first plagiarism check</div>
        <a href="upload.html" class="btn btn-primary btn-sm" style="margin-top:1.25rem">
          <i class="fa-solid fa-cloud-arrow-up"></i> Upload Document
        </a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.25rem">
      ${results.map(r => resultCardHtml(r)).join('')}
    </div>`;

  // Attach click listeners
  container.querySelectorAll('[data-result-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.resultId, 10);
      const r  = allResults.find(x => x.id === id);
      if (r) openReportModal(r);
    });
  });
}

function resultCardHtml(r) {
  const score     = r.overallScore ?? null;
  const risk      = r.riskLevel;
  const status    = r.status;
  const isReady   = status === 'COMPLETED';
  const scoreDisp = score != null ? `${score.toFixed(1)}%` : '—';
  const matchCnt  = r.matches?.length ?? 0;

  const ringColor = score != null ? scoreColor(score) : 'var(--text-muted)';
  const ringDash  = score != null ? Math.round((1 - score / 100) * 314) : 314;

  return `
    <div class="card" style="cursor:pointer;transition:var(--transition)" data-result-id="${r.id}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${escHtml(r.documentTitle || 'Untitled')}
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem">
            ${formatDate(r.analyzedAt)}
          </div>
        </div>
        ${isReady ? riskBadgeHtml(risk) : statusBadgeHtml(status)}
      </div>

      ${isReady ? `
        <!-- Score Ring -->
        <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1rem">
          <svg width="72" height="72" viewBox="0 0 72 72" style="flex-shrink:0">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
            <circle cx="36" cy="36" r="28" fill="none" stroke="${ringColor}" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="176" stroke-dashoffset="${Math.round((1 - (score||0) / 100) * 176)}"
              transform="rotate(-90 36 36)"/>
            <text x="36" y="40" text-anchor="middle" fill="${ringColor}"
              font-size="13" font-weight="800" font-family="Sora,sans-serif">${scoreDisp}</text>
          </svg>
          <div style="flex:1">
            <div class="score-bar-wrap">
              <div class="score-bar-header">
                <span class="name" style="font-size:0.75rem">Exact</span>
                <span class="pct" style="font-size:0.75rem">${(r.exactMatchScore||0).toFixed(1)}%</span>
              </div>
              <div class="score-bar-track"><div class="score-bar-fill" style="background:var(--danger);width:${r.exactMatchScore||0}%"></div></div>
            </div>
            <div class="score-bar-wrap">
              <div class="score-bar-header">
                <span class="name" style="font-size:0.75rem">Semantic</span>
                <span class="pct" style="font-size:0.75rem">${(r.semanticScore||0).toFixed(1)}%</span>
              </div>
              <div class="score-bar-track"><div class="score-bar-fill" style="background:var(--warning);width:${r.semanticScore||0}%"></div></div>
            </div>
            <div class="score-bar-wrap">
              <div class="score-bar-header">
                <span class="name" style="font-size:0.75rem">Paraphrase</span>
                <span class="pct" style="font-size:0.75rem">${(r.paraphraseScore||0).toFixed(1)}%</span>
              </div>
              <div class="score-bar-track"><div class="score-bar-fill" style="background:var(--accent);width:${r.paraphraseScore||0}%"></div></div>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:0.78rem;color:var(--text-muted)">
            <i class="fa-solid fa-link" style="color:var(--primary)"></i>
            ${matchCnt} matching source${matchCnt !== 1 ? 's' : ''}
          </span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openById(${r.id})">
            <i class="fa-solid fa-magnifying-glass"></i> Full Report
          </button>
        </div>
      ` : `
        <div class="processing-anim" style="padding:1rem 0">
          <div style="display:flex;align-items:center;gap:0.75rem;font-size:0.85rem;color:var(--text-secondary)">
            <span class="spinner"></span> Analysis in progress…
          </div>
        </div>
      `}
    </div>`;
}

function openById(id) {
  const r = allResults.find(x => x.id === id);
  if (r) openReportModal(r);
}

// ── Report Detail Modal ──────────────────────────────────────
function initModal() {
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('reportModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('reportModal')) closeModal();
  });
}

function openReportModal(result) {
  activeResult = result;
  const modal  = document.getElementById('reportModal');
  if (!modal) return;

  // Header
  document.getElementById('modalDocTitle').textContent = result.documentTitle || 'Report';
  document.getElementById('modalDate').textContent     = `Analyzed: ${formatDate(result.analyzedAt)}`;
  document.getElementById('modalRiskBadge').innerHTML  = riskBadgeHtml(result.riskLevel);

  // Score minis
  setText('mOverall',    formatScore(result.overallScore));
  setText('mExact',      formatScore(result.exactMatchScore));
  setText('mSemantic',   formatScore(result.semanticScore));
  setText('mParaphrase', formatScore(result.paraphraseScore));

  // Score mini colors
  if (result.overallScore != null) {
    document.getElementById('mOverall').style.color = scoreColor(result.overallScore);
  }

  // Progress bars (animate after open)
  setTimeout(() => {
    setBar('barExact',      result.exactMatchScore);
    setBar('barSemantic',   result.semanticScore);
    setBar('barParaphrase', result.paraphraseScore);
  }, 150);

  // Summary & Explanation
  setText('mSummary',     result.summary     || 'No summary available.');
  setText('mExplanation', result.explanation || 'No explanation available.');

  // Matches
  renderMatches(result.matches || []);

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  activeResult = null;
}

function setBar(elId, value) {
  const pct  = Math.min(Math.max(value || 0, 0), 100);
  const bar  = document.getElementById(elId);
  const pctEl= document.getElementById(elId + 'Pct');
  if (bar)   bar.style.width        = `${pct}%`;
  if (pctEl) pctEl.textContent      = `${pct.toFixed(1)}%`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderMatches(matches) {
  const list    = document.getElementById('matchesList');
  const countEl = document.getElementById('matchCount');
  if (countEl) countEl.textContent = matches.length;

  if (!matches || matches.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:1.5rem">
        <div class="empty-icon">✅</div>
        <div class="empty-title">No matching sources found</div>
        <div class="empty-subtitle">No significant similarity detected</div>
      </div>`;
    return;
  }

  list.innerHTML = matches.map(m => {
    const typeCls  = { EXACT: 'badge-danger', SEMANTIC: 'badge-warning', PARAPHRASE: 'badge-info' };
    const pct      = m.similarityScore != null ? `${m.similarityScore.toFixed(1)}%` : '—';
    const color    = m.similarityScore != null ? scoreColor(m.similarityScore) : 'var(--text-muted)';

    return `
      <div class="match-card">
        <div class="match-card-header">
          <div>
            <div class="match-source-name">
              <i class="fa-solid fa-globe" style="color:var(--primary);margin-right:4px"></i>
              ${escHtml(m.sourceTitle || 'Unknown Source')}
            </div>
            ${m.sourceUrl
              ? `<div class="match-source-url">
                  <a href="${escHtml(m.sourceUrl)}" target="_blank" rel="noopener">
                    ${escHtml(m.sourceUrl)}
                  </a>
                </div>`
              : ''}
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0">
            <span class="badge ${typeCls[m.matchType] || 'badge-purple'}">${m.matchType || '—'}</span>
            <span style="font-family:'Sora',sans-serif;font-size:1rem;font-weight:800;color:${color}">${pct}</span>
          </div>
        </div>
        ${m.matchedText ? `
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.35rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">
            Matched Text
          </div>
          <div class="match-text-block">${escHtml(m.matchedText)}</div>
        ` : ''}
        <div class="match-meta">
          ${m.sectionName  ? `<div class="match-meta-item">Section: <span>${escHtml(m.sectionName)}</span></div>` : ''}
          ${m.startPosition != null ? `<div class="match-meta-item">Position: <span>${m.startPosition}–${m.endPosition}</span></div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Search & Filter ──────────────────────────────────────────
function initFilters() {
  const search = document.getElementById('searchInput');
  const risk   = document.getElementById('filterRisk');
  const run    = () => applyFilters();
  search?.addEventListener('input',  run);
  risk?.addEventListener('change',   run);
}

function applyFilters() {
  const q    = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const risk = document.getElementById('filterRisk')?.value || '';

  const filtered = allResults.filter(r => {
    const matchQ    = !q    || (r.documentTitle || '').toLowerCase().includes(q);
    const matchRisk = !risk || r.riskLevel === risk;
    return matchQ && matchRisk;
  });

  renderResults(filtered);
}

// ── Escape HTML ──────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
