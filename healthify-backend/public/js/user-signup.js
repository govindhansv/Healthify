(function () {
  const form = document.getElementById('userSignupForm');
  const emailInput = document.getElementById('signupEmail');
  const pass1Input = document.getElementById('signupPassword');
  const pass2Input = document.getElementById('signupPassword2');
  const btn = document.getElementById('btnUserSignup');
  const messages = document.getElementById('userSignupMessages');

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
      const p1 = pass1Input.value;
      const p2 = pass2Input.value;
      if (!email || !p1 || !p2) {
        showMessage('All fields are required.', 'error');
        return;
      }
      if (p1 !== p2) {
        showMessage('Passwords do not match.', 'error');
        return;
      }
      btn.disabled = true;
      showMessage('Signing up...', '');
      try {
        const data = await fetchJson('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: p1 })
        });
        const token = data.token;
        if (token) {
          localStorage.setItem('userToken', token);
        }
        showMessage('Signup successful. You can now login.', 'ok');
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'Signup failed', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }
})();
