(function () {
  const tokenInput = document.getElementById('tokenInput');
  const btnUseToken = document.getElementById('btnUseToken');
  const btnClearToken = document.getElementById('btnClearToken');
  const tokenInfo = document.getElementById('tokenInfo');
  const healthStatus = document.getElementById('healthStatus');
  const btnCheckHealth = document.getElementById('btnCheckHealth');

  const createForm = document.getElementById('createForm');
  const titleInput = document.getElementById('titleInput');
  const descInput = document.getElementById('descInput');
  const difficultyInput = document.getElementById('difficultyInput');
  const durationInput = document.getElementById('durationInput');
  const equipmentInput = document.getElementById('equipmentInput');
  const categoryInput = document.getElementById('categoryInput');
  const imageInput = document.getElementById('imageInput');
  const createMessages = document.getElementById('createMessages');

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const filterDifficulty = document.getElementById('filterDifficulty');
  const filterCategory = document.getElementById('filterCategory');
  const btnReload = document.getElementById('btnReload');
  const listMessages = document.getElementById('listMessages');
  const exercisesList = document.getElementById('exercisesList');

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

  function parseEquipment(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  async function loadExercises() {
    listMessages.textContent = 'Loading exercises...';
    exercisesList.innerHTML = '';
    try {
      const q = searchInput.value.trim();
      const diff = filterDifficulty.value;
      const catId = filterCategory.value.trim();
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q) params.set('q', q);
      if (diff) params.set('difficulty', diff);
      if (catId) params.set('category', catId);
      const data = await fetchJson(API_BASE + '/api/exercises?' + params.toString());
      const arr = data.data || [];
      if (!arr.length) {
        showMessage(listMessages, 'No exercises found.', 'error');
        return;
      }
      listMessages.textContent = '';
      arr.forEach(ex => {
        const li = document.createElement('li');
        li.className = 'exercise';

        const title = document.createElement('div');
        title.innerHTML = '<strong>' + (ex.title || '(no title)') + '</strong> ' +
          '<span class="meta">(' + (ex.slug || '-') + ')</span>';

        const meta = document.createElement('div');
        meta.className = 'meta';
        const diffTxt = ex.difficulty || 'unknown';
        const catName = ex.category && ex.category.name ? ex.category.name : 'No category';
        meta.textContent = 'Difficulty: ' + diffTxt + ' | Category: ' + catName + ' | ID: ' + ex._id;

        const desc = document.createElement('div');
        desc.textContent = ex.description || '';
        desc.style.fontSize = '0.9rem';
        desc.style.marginTop = '0.25rem';

        const actions = document.createElement('div');
        actions.style.marginTop = '0.35rem';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'secondary';
        editBtn.type = 'button';
        editBtn.style.marginRight = '0.5rem';
        editBtn.addEventListener('click', function () {
          updateExercise(ex);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'danger';
        delBtn.type = 'button';
        delBtn.addEventListener('click', function () {
          const ok = confirm('Delete this exercise?');
          if (!ok) return;
          deleteExercise(ex._id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(title);
        if (ex.description) li.appendChild(desc);
        li.appendChild(meta);
        li.appendChild(actions);
        exercisesList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      showMessage(listMessages, err.message || 'Failed to load exercises', 'error');
    }
  }

  async function updateExercise(ex) {
    const token = getToken();
    if (!token) {
      alert('Token required. Use Admin Login first.');
      return;
    }

    const newDesc = prompt('Description', ex.description || '');
    if (newDesc === null) return;

    const newDiff = prompt('Difficulty (beginner/intermediate/advanced)', ex.difficulty || 'beginner');
    if (newDiff === null) return;

    const newDurationStr = prompt('Duration (seconds)', String(ex.duration || 0));
    if (newDurationStr === null) return;
    const newDuration = parseInt(newDurationStr, 10) || 0;

    const newEquipStr = prompt('Equipment (comma separated)', (ex.equipment || []).join(', '));
    if (newEquipStr === null) return;
    const newEquip = parseEquipment(newEquipStr);

    try {
      await fetchJson(API_BASE + '/api/exercises/' + encodeURIComponent(ex._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          description: newDesc,
          difficulty: newDiff,
          duration: newDuration,
          equipment: newEquip
        })
      });
      await loadExercises();
    } catch (err) {
      console.error(err);
      alert('Update failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function deleteExercise(id) {
    const token = getToken();
    if (!token) {
      alert('Token required. Use Admin Login first.');
      return;
    }
    try {
      await fetchJson(API_BASE + '/api/exercises/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      await loadExercises();
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
        showMessage(createMessages, 'Token required. Use Admin Login first.', 'error');
        return;
      }
      const title = titleInput.value.trim();
      if (!title) {
        showMessage(createMessages, 'Title is required.', 'error');
        return;
      }
      const description = descInput.value.trim();
      const difficulty = difficultyInput.value || 'beginner';
      const duration = parseInt(durationInput.value || '0', 10) || 0;
      const equipment = parseEquipment(equipmentInput.value.trim());
      const categoryId = categoryInput.value.trim();
      const image = imageInput.value.trim();
      const btn = document.getElementById('btnCreate');
      btn.disabled = true;
      showMessage(createMessages, 'Creating...', '');
      try {
        const body = {
          title,
          description,
          difficulty,
          duration,
          equipment,
          image
        };
        if (categoryId) body.category = categoryId;
        await fetchJson(API_BASE + '/api/exercises', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(body)
        });
        titleInput.value = '';
        descInput.value = '';
        durationInput.value = '300';
        equipmentInput.value = '';
        categoryInput.value = '';
        imageInput.value = '';
        showMessage(createMessages, 'Exercise created.', 'ok');
        await loadExercises();
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
      loadExercises();
    });
  }

  if (btnReload) {
    btnReload.addEventListener('click', function () {
      loadExercises();
    });
  }

  if (btnCheckHealth) {
    btnCheckHealth.addEventListener('click', function () {
      checkHealth();
    });
  }

  renderTokenInfo();
  checkHealth();
  loadExercises();
})();
