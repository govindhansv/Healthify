(function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const btn = document.getElementById('btnLogin');
  const messages = document.getElementById('loginMessages');

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
        localStorage.setItem('token', token);
        showMessage('Login successful. Token stored in localStorage.token', 'ok');
        setTimeout(function () {
          window.location.href = '/admin-categories.html';
        }, 800);
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'Login failed', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }
})();
