(function () {
  const form = document.getElementById('userLoginForm');
  const emailInput = document.getElementById('userEmail');
  const passwordInput = document.getElementById('userPassword');
  const btn = document.getElementById('btnUserLogin');
  const messages = document.getElementById('userLoginMessages');

  function showMessage(msg, type) {
    messages.innerHTML = '';
    if (!msg) return;
    const span = document.createElement('span');
    span.textContent = msg;
    span.className = type === 'error' ? 'error' : 'ok';
    messages.appendChild(span);
  }

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
    if (!res.ok) {
      const msg = json && json.message ? json.message : ('Request failed: ' + res.status);
      const err = new Error(msg);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  }

  function parseJwtRole(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return '';
      const payload = JSON.parse(atob(parts[1]));
      return payload.role || '';
    } catch (e) {
      return '';
    }
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!email || !password) {
        showMessage('Email and password required.', 'error');
        return;
      }
      btn.disabled = true;
      showMessage('Logging in...', '');
      try {
        const data = await fetchJson('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const token = data.token;
        if (!token) {
          showMessage('No token returned from server.', 'error');
          btn.disabled = false;
          return;
        }

        const role = parseJwtRole(token);
        if (role === 'admin') {
          showMessage('This is an admin account. Please use the Admin Login page instead.', 'error');
          btn.disabled = false;
          return;
        }

        localStorage.setItem('userToken', token);
        showMessage('Login successful. Redirecting to home...', 'ok');
        window.location.href = '/user-home.html';
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'Login failed', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }
})();
