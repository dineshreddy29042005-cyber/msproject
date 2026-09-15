/* =============================================================
   auth.js — Login & Register page logic
   ============================================================= */

// ── Password visibility toggle ───────────────────────────────
function initTogglePass(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    const isPass = input.type === 'password';
    input.type   = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
      ? '<i class="fa-regular fa-eye-slash"></i>'
      : '<i class="fa-regular fa-eye"></i>';
  });
}

// ── Password strength meter ──────────────────────────────────
function initStrengthMeter(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const segs   = [1, 2, 3, 4].map(i => document.getElementById(`s${i}`));
  const label  = document.getElementById('strengthLabel');
  const colors = ['var(--danger)', '#ff7a00', 'var(--warning)', 'var(--success)'];
  const labels = ['Too weak', 'Weak', 'Moderate', 'Strong'];

  input.addEventListener('input', () => {
    const v = input.value;
    let score = 0;
    if (v.length >= 6)               score++;
    if (v.length >= 10)              score++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v))     score++;

    segs.forEach((seg, i) => {
      seg.style.background = i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)';
    });
    label.textContent  = v.length === 0 ? 'Enter a password' : labels[score - 1] || 'Too weak';
    label.style.color  = v.length === 0 ? 'var(--text-muted)' : colors[score - 1];
  });
}

// ── Field validation helper ──────────────────────────────────
function setFieldError(fieldId, errId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.style.borderColor = message ? 'var(--danger)' : '';
  if (err)   err.textContent = message || '';
}

function clearErrors(...errIds) {
  errIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ── Login Page ───────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  Auth.redirectIfLoggedIn();
  initTogglePass('togglePass', 'password');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('loginAlert');
    clearErrors('usernameError', 'passwordError');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    let valid = true;

    if (!username) { setFieldError('username', 'usernameError', 'Username is required'); valid = false; }
    if (!password) { setFieldError('password', 'passwordError', 'Password is required'); valid = false; }
    if (!valid) return;

    // Show spinner
    document.getElementById('loginBtnText').style.display = 'none';
    document.getElementById('loginSpinner').style.display = 'inline-flex';
    document.getElementById('loginBtn').disabled = true;

    try {
      const data = await API.auth.login({ username, password });
      Auth.setSession(data);
      showToast(`Welcome back, ${data.username}!`, 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 600);
    } catch (err) {
      showAlert('loginAlert', err.message || 'Login failed. Please try again.');
      document.getElementById('loginBtnText').style.display = 'inline-flex';
      document.getElementById('loginSpinner').style.display = 'none';
      document.getElementById('loginBtn').disabled = false;
    }
  });
}

// ── Register Page ────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  Auth.redirectIfLoggedIn();
  initTogglePass('toggleRegPass', 'regPassword');
  initStrengthMeter('regPassword');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('registerAlert');
    clearErrors('regUsernameError', 'regEmailError', 'regPasswordError');

    const username = document.getElementById('regUsername').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const role     = document.getElementById('regRole').value;
    const password = document.getElementById('regPassword').value;
    let valid = true;

    if (!username || username.length < 3) {
      setFieldError('regUsername', 'regUsernameError', 'Username must be at least 3 characters');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('regEmail', 'regEmailError', 'Enter a valid email address');
      valid = false;
    }
    if (!password || password.length < 6) {
      setFieldError('regPassword', 'regPasswordError', 'Password must be at least 6 characters');
      valid = false;
    }
    if (!valid) return;

    document.getElementById('regBtnText').style.display = 'none';
    document.getElementById('regSpinner').style.display = 'inline-flex';
    document.getElementById('registerBtn').disabled = true;

    try {
      const data = await API.auth.register({ username, email, password, role });
      Auth.setSession(data);
      showToast('Account created successfully!', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 600);
    } catch (err) {
      showAlert('registerAlert', err.message || 'Registration failed. Please try again.');
      document.getElementById('regBtnText').style.display = 'inline-flex';
      document.getElementById('regSpinner').style.display = 'none';
      document.getElementById('registerBtn').disabled = false;
    }
  });
}
