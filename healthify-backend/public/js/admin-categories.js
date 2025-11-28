(function () {
  const tokenInput = document.getElementById('tokenInput');
  const btnUseToken = document.getElementById('btnUseToken');
  const btnClearToken = document.getElementById('btnClearToken');
  const tokenInfo = document.getElementById('tokenInfo');
  const healthStatus = document.getElementById('healthStatus');
  const btnCheckHealth = document.getElementById('btnCheckHealth');

  const createForm = document.getElementById('createForm');
  const nameInput = document.getElementById('nameInput');
  const descInput = document.getElementById('descInput');
  const imageInput = document.getElementById('imageInput');
  const createMessages = document.getElementById('createMessages');

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const btnReload = document.getElementById('btnReload');
  const listMessages = document.getElementById('listMessages');
  const categoriesList = document.getElementById('categoriesList');

  const API_BASE = '';

  function getToken() {
    return localStorage.getItem('token') || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  function showMessage(el, msg, type) {
    if (!el) return;
    if (!msg) { el.textContent = ''; return; }
    el.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = msg;
    span.className = type === 'error' ? 'error' : 'ok';
    el.appendChild(span);
  }

  function renderTokenInfo() {
    const t = getToken();
    if (!t) {
      showMessage(tokenInfo, 'No token stored.', 'error');
      if (tokenInput) tokenInput.value = '';
    } else {
      showMessage(tokenInfo, 'Token loaded. Length: ' + t.length, 'ok');
      if (tokenInput) tokenInput.value = t;
    }
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

  async function checkHealth() {
    if (!healthStatus) return;
    healthStatus.textContent = 'Checking health...';
    try {
      const data = await fetchJson(API_BASE + '/health');
      const ok = data && data.status ? data.status : 'unknown';
      healthStatus.textContent = 'Health: ' + ok;
      healthStatus.style.color = ok === 'ok' ? '#38a169' : '#e53e3e';
    } catch (err) {
      console.error(err);
      healthStatus.textContent = 'Health check failed: ' + (err.message || 'Error');
      healthStatus.style.color = '#e53e3e';
    }
  }

  async function loadCategories() {
    listMessages.textContent = 'Loading categories...';
    categoriesList.innerHTML = '';
    try {
      const q = searchInput.value.trim();
      const params = new URLSearchParams({ page: '1', limit: '50', q });
      const data = await fetchJson(API_BASE + '/api/categories?' + params.toString());
      const arr = data.data || [];
      if (!arr.length) {
        showMessage(listMessages, 'No categories found.', 'error');
        return;
      }
      listMessages.textContent = '';
      arr.forEach(function (cat) {
        const li = document.createElement('li');
        li.className = 'category';

        const title = document.createElement('div');
        title.innerHTML = '<strong>' + (cat.name || '(no name)') + '</strong> ' +
          '<span class="meta">(' + (cat.slug || '-') + ')</span>';

        const desc = document.createElement('div');
        desc.textContent = cat.description || '';
        desc.style.fontSize = '0.9rem';
        desc.style.marginTop = '0.25rem';

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = 'ID: ' + cat._id;

        const actions = document.createElement('div');
        actions.style.marginTop = '0.35rem';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'secondary';
        editBtn.type = 'button';
        editBtn.style.marginRight = '0.5rem';
        editBtn.addEventListener('click', function () {
          updateCategory(cat);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'danger';
        delBtn.type = 'button';
        delBtn.addEventListener('click', function () {
          const ok = confirm('Delete this category?');
          if (!ok) return;
          deleteCategory(cat._id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(title);
        if (cat.description) li.appendChild(desc);
        li.appendChild(meta);
        li.appendChild(actions);
        categoriesList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      showMessage(listMessages, err.message || 'Failed to load categories', 'error');
    }
  }

  async function updateCategory(cat) {
    const token = getToken();
    if (!token) {
      alert('Token required. Paste admin JWT in Step 1.');
      return;
    }

    const currentName = cat.name || '';
    const currentDesc = cat.description || '';
    const currentImage = cat.image || '';

    const name = prompt('Name', currentName);
    if (name === null) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Name is required.');
      return;
    }

    const description = prompt('Description', currentDesc);
    if (description === null) return;

    const image = prompt('Image URL', currentImage);
    if (image === null) return;

    try {
      await fetchJson(API_BASE + '/api/categories/' + encodeURIComponent(cat._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name: trimmedName, description: description, image: image })
      });
      await loadCategories();
    } catch (err) {
      console.error(err);
      alert('Update failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function deleteCategory(id) {
    const token = getToken();
    if (!token) {
      alert('Token required. Paste admin JWT in Step 1.');
      return;
    }
    try {
      await fetchJson(API_BASE + '/api/categories/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      await loadCategories();
    } catch (err) {
      console.error(err);
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  }

  if (btnUseToken) {
    btnUseToken.addEventListener('click', function () {
      const t = tokenInput.value.trim();
      if (!t) {
        showMessage(tokenInfo, 'Please paste a token first.', 'error');
        return;
      }
      setToken(t);
      renderTokenInfo();
    });
  }

  if (btnClearToken) {
    btnClearToken.addEventListener('click', function () {
      setToken('');
      renderTokenInfo();
    });
  }

  if (createForm) {
    createForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const token = getToken();
      if (!token) {
        showMessage(createMessages, 'Token required. Paste admin JWT in Step 1.', 'error');
        return;
      }
      const name = nameInput.value.trim();
      if (!name) {
        showMessage(createMessages, 'Name is required.', 'error');
        return;
      }
      const description = descInput.value.trim();
      const image = imageInput.value.trim();
      const btn = document.getElementById('btnCreate');
      btn.disabled = true;
      showMessage(createMessages, 'Creating...', '');
      try {
        await fetchJson(API_BASE + '/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ name, description, image })
        });
        nameInput.value = '';
        descInput.value = '';
        imageInput.value = '';
        showMessage(createMessages, 'Category created.', 'ok');
        await loadCategories();
      } catch (err) {
        console.error(err);
        showMessage(createMessages, err.message || 'Create failed', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      loadCategories();
    });
  }

  if (btnReload) {
    btnReload.addEventListener('click', function () {
      loadCategories();
    });
  }

  if (btnCheckHealth) {
    btnCheckHealth.addEventListener('click', function () {
      checkHealth();
    });
  }

  renderTokenInfo();
  checkHealth();
  loadCategories();
})();
