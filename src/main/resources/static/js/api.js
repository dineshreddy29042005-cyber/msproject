/* =============================================================
   api.js — Shared API client, auth helpers, toast & utilities
   ============================================================= */

const API_BASE = '/api';

// ── Token helpers ────────────────────────────────────────────
const Auth = {
  getToken  : ()         => localStorage.getItem('pc_token'),
  getUser   : ()         => JSON.parse(localStorage.getItem('pc_user') || 'null'),
  setSession: (data)     => {
    localStorage.setItem('pc_token', data.token);
    localStorage.setItem('pc_user',  JSON.stringify({
      userId  : data.userId,
      username: data.username,
      email   : data.email,
      role    : data.role
    }));
  },
  clear: () => {
    localStorage.removeItem('pc_token');
    localStorage.removeItem('pc_user');
  },
  isLoggedIn: () => !!localStorage.getItem('pc_token'),
  requireAuth: () => {
    if (!localStorage.getItem('pc_token')) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
  redirectIfLoggedIn: () => {
    if (localStorage.getItem('pc_token')) {
      window.location.href = '/dashboard.html';
    }
  }
};

// ── Core fetch wrapper ───────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    Auth.clear();
    window.location.href = '/login.html';
    return;
  }

  let body;
  const ct = res.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    const msg = body?.message || body?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
}

// ── Multipart upload (no Content-Type header so browser sets boundary) ──
async function apiUpload(path, formData) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (res.status === 401) {
    Auth.clear();
    window.location.href = '/login.html';
    return;
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `Upload failed (${res.status})`);
  return body;
}

// ── API calls ────────────────────────────────────────────────
const API = {
  auth: {
    login   : (data) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  documents: {
    upload : (fd)  => apiUpload('/documents/upload', fd),
    list   : ()    => apiFetch('/documents'),
    get    : (id)  => apiFetch(`/documents/${id}`),
    delete : (id)  => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
  },
  analysis: {
    byDocument: (docId)    => apiFetch(`/analysis/document/${docId}`),
    byId      : (resultId) => apiFetch(`/analysis/${resultId}`),
    myResults : ()         => apiFetch('/analysis/my-results'),
    dashStats : ()         => apiFetch('/analysis/dashboard-stats'),
  }
};

// ── Toast notifications ──────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Alert helper ─────────────────────────────────────────────
function showAlert(elementId, message, type = 'danger') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = 'flex';
  el.className = `alert alert-${type}`;
  el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><span>${message}</span>`;
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

// ── Formatting helpers ───────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatScore(score) {
  if (score == null) return '—';
  return `${score.toFixed(1)}%`;
}

function fileTypeIcon(mimeOrName) {
  const s = (mimeOrName || '').toLowerCase();
  if (s.includes('pdf'))  return '📕';
  if (s.includes('word') || s.includes('doc')) return '📘';
  if (s.includes('text') || s.includes('txt')) return '📄';
  return '📎';
}

function riskColor(level) {
  const map = { LOW: 'var(--success)', MEDIUM: 'var(--warning)', HIGH: 'var(--danger)', CRITICAL: '#ff2052' };
  return map[level] || 'var(--text-secondary)';
}

function scoreColor(score) {
  if (score >= 70) return 'var(--danger)';
  if (score >= 50) return '#ff7a00';
  if (score >= 25) return 'var(--warning)';
  return 'var(--success)';
}

function riskBadgeHtml(level) {
  if (!level) return '<span class="badge badge-pending">PENDING</span>';
  const cls = { LOW: 'badge-success', MEDIUM: 'badge-warning', HIGH: 'badge-danger', CRITICAL: 'badge-critical' };
  return `<span class="badge ${cls[level] || 'badge-pending'}">${level}</span>`;
}

function statusBadgeHtml(status) {
  const map = {
    COMPLETED : '<span class="badge badge-success">Completed</span>',
    PROCESSING: '<span class="badge badge-info">Processing</span>',
    PENDING   : '<span class="badge badge-pending">Pending</span>',
    FAILED    : '<span class="badge badge-danger">Failed</span>',
  };
  return map[status] || `<span class="badge badge-pending">${status}</span>`;
}

// ── Navbar user chip initializer ─────────────────────────────
function initNavUser() {
  const user = Auth.getUser();
  if (!user) return;

  const avatar   = document.getElementById('navAvatar');
  const username = document.getElementById('navUsername');
  if (avatar)   avatar.textContent   = user.username.charAt(0).toUpperCase();
  if (username) username.textContent = user.username;

  // Logout buttons
  document.querySelectorAll('#sidebarLogout').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      Auth.clear();
      window.location.href = '/login.html';
    });
  });
}

// Animated number counter
function animateCount(el, target, suffix = '') {
  const duration = 800;
  const start    = performance.now();
  const from     = 0;
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * ease) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
