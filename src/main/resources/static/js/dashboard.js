/* =============================================================
   dashboard.js — Dashboard page logic
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  initNavUser();

  const user = Auth.getUser();
  const greet = document.getElementById('greetName');
  if (greet && user) greet.textContent = user.username;

  loadDashboardStats();
  loadRecentDocuments();
});

// ── Dashboard Stats ──────────────────────────────────────────
async function loadDashboardStats() {
  try {
    const stats = await API.analysis.dashStats();
    const total    = stats.totalDocuments    || 0;
    const analyzed = stats.analyzedDocuments || 0;
    const pending  = stats.pendingDocuments  || 0;
    const avg      = stats.averagePlagiarismScore || 0;

    const high     = stats.highRiskCount     || 0;
    const critical = stats.criticalRiskCount || 0;
    const medium   = stats.mediumRiskCount   || 0;
    const low      = stats.lowRiskCount      || 0;

    // Animate stat numbers
    animateCount(document.getElementById('statTotal'),    total);
    animateCount(document.getElementById('statAnalyzed'), analyzed);
    animateCount(document.getElementById('statPending'),  pending);

    const avgEl = document.getElementById('statAvg');
    if (avgEl) {
      avgEl.style.color = scoreColor(avg);
      animateCount(avgEl, Math.round(avg), '%');
    }

    // Risk distribution bars
    const totalRisk = high + critical + medium + low || 1;
    setRiskBar('riskCritical', critical, totalRisk);
    setRiskBar('riskHigh',     high,     totalRisk);
    setRiskBar('riskMedium',   medium,   totalRisk);
    setRiskBar('riskLow',      low,      totalRisk);

    // Quick action counts
    const qaHigh = document.getElementById('qaHighRisk');
    const qaCrit = document.getElementById('qaCritical');
    if (qaHigh) qaHigh.textContent = high;
    if (qaCrit) qaCrit.textContent = critical;

  } catch (err) {
    console.error('Stats load failed:', err);
    showToast('Could not load dashboard stats', 'error');
  }
}

function setRiskBar(prefix, count, total) {
  const pct    = Math.round((count / total) * 100);
  const pctEl  = document.getElementById(`${prefix}Pct`);
  const barEl  = document.getElementById(`${prefix}Bar`);
  if (pctEl) pctEl.textContent = `${count} (${pct}%)`;
  if (barEl) {
    // Animate bar width
    requestAnimationFrame(() => {
      setTimeout(() => { barEl.style.width = `${pct}%`; }, 100);
    });
  }
}

// ── Recent Documents Table ───────────────────────────────────
async function loadRecentDocuments() {
  const tbody = document.getElementById('recentTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7">
    <div class="empty-state">
      <div style="display:flex;justify-content:center">
        <span class="spinner" style="width:32px;height:32px;border-width:3px"></span>
      </div>
      <div class="empty-title" style="margin-top:0.75rem">Loading documents…</div>
    </div>
  </td></tr>`;

  try {
    const [docs, results] = await Promise.all([
      API.documents.list(),
      API.analysis.myResults()
    ]);

    // Map results by documentId for quick lookup
    const resultMap = {};
    (results || []).forEach(r => { resultMap[r.documentId] = r; });

    if (!docs || docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No documents yet</div>
          <div class="empty-subtitle">Upload your first document to get started</div>
          <a href="upload.html" class="btn btn-primary btn-sm" style="margin-top:1rem">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload Now
          </a>
        </div>
      </td></tr>`;
      return;
    }

    // Show latest 10
    const recent = docs.slice(0, 10);
    tbody.innerHTML = recent.map(doc => {
      const result = resultMap[doc.id];
      const score  = result?.overallScore;
      const risk   = result?.riskLevel;
      const scoreDisplay = score != null
        ? `<span style="font-weight:700;color:${scoreColor(score)}">${score.toFixed(1)}%</span>`
        : '<span style="color:var(--text-muted)">—</span>';

      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.6rem">
            <span style="font-size:1.2rem">${fileTypeIcon(doc.fileType)}</span>
            <div>
              <div class="doc-title">${escHtml(doc.title)}</div>
              <div class="doc-size">${formatFileSize(doc.fileSize)}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size:0.78rem;color:var(--text-muted)">${fileTypeName(doc.fileType)}</span></td>
        <td>${statusBadgeHtml(doc.status)}</td>
        <td>${risk ? riskBadgeHtml(risk) : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>${scoreDisplay}</td>
        <td><span style="font-size:0.8rem;color:var(--text-muted)">${formatDate(doc.uploadedAt)}</span></td>
        <td>
          ${result
            ? `<a href="results.html?id=${result.id}" class="btn btn-outline btn-sm">
                <i class="fa-solid fa-chart-bar"></i> View
              </a>`
            : `<span style="font-size:0.78rem;color:var(--text-muted)">Pending…</span>`
          }
        </td>
      </tr>`;
    }).join('');

  } catch (err) {
    console.error('Documents load failed:', err);
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Failed to load documents</div>
        <div class="empty-subtitle">${escHtml(err.message)}</div>
      </div>
    </td></tr>`;
  }
}

// ── Helpers ──────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function fileTypeName(mime) {
  if (!mime) return 'Unknown';
  if (mime.includes('pdf'))  return 'PDF';
  if (mime.includes('word') || mime.includes('doc')) return 'Word';
  if (mime.includes('text') || mime.includes('txt')) return 'Text';
  return 'File';
}
