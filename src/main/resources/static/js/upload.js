/* =============================================================
   upload.js — Upload page logic with drag-drop & progress
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  initNavUser();
  initUploadZone();
  initUploadForm();
});

let selectedFile = null;

// ── Upload Zone (drag & drop + click) ───────────────────────
function initUploadZone() {
  const zone      = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const preview   = document.getElementById('filePreview');
  const removBtn  = document.getElementById('removeFile');

  if (!zone) return;

  // Click handled by the hidden <input type="file"> inside zone
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFileSelected(fileInput.files[0]);
  });

  // Drag events
  ['dragenter', 'dragover'].forEach(evt => {
    zone.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      zone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    zone.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      zone.classList.remove('drag-over');
    });
  });
  zone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  });

  // Remove button
  removBtn?.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    preview.classList.remove('show');
    zone.style.display = 'block';
    document.getElementById('fileError').textContent = '';
  });
}

function handleFileSelected(file) {
  const allowed  = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const extAllow = ['.pdf', '.doc', '.docx', '.txt'];
  const ext      = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  document.getElementById('fileError').textContent = '';

  if (!allowed.includes(file.type) && !extAllow.includes(ext)) {
    document.getElementById('fileError').textContent = 'Unsupported file type. Please use PDF, DOCX, or TXT.';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    document.getElementById('fileError').textContent = 'File is too large. Maximum size is 10 MB.';
    return;
  }

  selectedFile = file;

  // Show preview, hide drop zone inner content (keep zone for another click)
  const preview = document.getElementById('filePreview');
  preview.classList.add('show');

  document.getElementById('filePreviewIcon').textContent = fileTypeIcon(file.type || ext);
  document.getElementById('filePreviewName').textContent = file.name;
  document.getElementById('filePreviewSize').textContent = formatFileSize(file.size);
}

// ── Upload Form Submit ───────────────────────────────────────
function initUploadForm() {
  const form = document.getElementById('uploadForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('uploadAlert');

    if (!selectedFile) {
      document.getElementById('fileError').textContent = 'Please select a file to upload.';
      return;
    }

    const title = document.getElementById('docTitle').value.trim();

    // Show processing overlay
    showProcessingOverlay();

    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      if (title) fd.append('title', title);

      // Step 1 — uploading
      setProcessStep(1);
      const doc = await API.documents.upload(fd);

      // Step 2-4 — simulate NLP pipeline steps (async analysis runs server-side)
      await animateProcessingSteps(doc.id);

      showToast('Document uploaded and analysis started!', 'success');
      setTimeout(() => window.location.href = '/results.html', 1200);

    } catch (err) {
      hideProcessingOverlay();
      showAlert('uploadAlert', err.message || 'Upload failed. Please try again.');
      document.getElementById('uploadBtnText').style.display = 'inline-flex';
      document.getElementById('uploadSpinner').style.display = 'none';
      document.getElementById('uploadBtn').disabled = false;
    }
  });
}

// ── Processing Overlay ───────────────────────────────────────
function showProcessingOverlay() {
  document.getElementById('processingOverlay').classList.add('show');
  document.getElementById('uploadBtnText').style.display = 'none';
  document.getElementById('uploadSpinner').style.display = 'inline-flex';
  document.getElementById('uploadBtn').disabled = true;
  setBar(0);
}

function hideProcessingOverlay() {
  document.getElementById('processingOverlay').classList.remove('show');
}

function setBar(pct) {
  const bar = document.getElementById('processBar');
  if (bar) bar.style.width = `${pct}%`;
}

function setProcessStep(n) {
  for (let i = 1; i <= 5; i++) {
    const el   = document.getElementById(`step${i}`);
    const icon = document.getElementById(`step${i}Icon`);
    if (!el) continue;
    el.classList.remove('done', 'active');
    if (i < n) {
      el.classList.add('done');
      if (icon) icon.className = 'fa-solid fa-check';
    } else if (i === n) {
      el.classList.add('active');
    }
  }
  const titles = [
    '', 'Uploading Document…', 'Extracting Text Content…',
    'Generating Embeddings…', 'Running Similarity Analysis…', 'Generating Report…'
  ];
  const processTitle = document.getElementById('processTitle');
  if (processTitle) processTitle.textContent = titles[n] || '';
  setBar(n * 20);
}

async function animateProcessingSteps(docId) {
  const delay = ms => new Promise(r => setTimeout(r, ms));

  setProcessStep(2); await delay(600);
  setProcessStep(3); await delay(700);
  setProcessStep(4); await delay(800);
  setProcessStep(5); await delay(500);
  setBar(100);

  // Poll until analysis completes (max 30s)
  const maxWait = 30000;
  const poll    = 2000;
  const start   = Date.now();

  while (Date.now() - start < maxWait) {
    await delay(poll);
    try {
      const result = await API.analysis.byDocument(docId);
      if (result && result.status === 'COMPLETED') return result;
    } catch (_) { /* not ready yet */ }
  }
}
