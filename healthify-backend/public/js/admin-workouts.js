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
  const difficultyInput = document.getElementById('difficultyInput');
  const exercisesInput = document.getElementById('exercisesInput');
  const thumbnailInput = document.getElementById('thumbnailInput');
  const createMessages = document.getElementById('createMessages');

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const filterDifficulty = document.getElementById('filterDifficulty');
  const btnReload = document.getElementById('btnReload');
  const listMessages = document.getElementById('listMessages');
  const workoutsList = document.getElementById('workoutsList');

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

  function parseIds(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  async function loadWorkouts() {
    listMessages.textContent = 'Loading workouts...';
    workoutsList.innerHTML = '';
    try {
      const q = searchInput.value.trim();
      const diff = filterDifficulty.value;
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q) params.set('q', q);
      if (diff) params.set('difficulty', diff);
      const data = await fetchJson(API_BASE + '/api/workouts?' + params.toString());
      const arr = data.data || [];
      if (!arr.length) {
        showMessage(listMessages, 'No workouts found.', 'error');
        return;
      }
      listMessages.textContent = '';
      arr.forEach(w => {
        const li = document.createElement('li');
        li.className = 'workout';

        const title = document.createElement('div');
        title.innerHTML = '<strong>' + (w.name || '(no name)') + '</strong>';

        const meta = document.createElement('div');
        meta.className = 'meta';
        const diffTxt = w.difficulty || 'unknown';
        const dur = w.totalDuration || 0;
        const exCount = (w.exercises || []).length;
        meta.textContent = 'Difficulty: ' + diffTxt + ' | Total duration: ' + dur + 's | Exercises: ' + exCount + ' | ID: ' + w._id;

        const desc = document.createElement('div');
        desc.textContent = w.description || '';
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
          updateWorkout(w);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'danger';
        delBtn.type = 'button';
        delBtn.addEventListener('click', function () {
          const ok = confirm('Delete this workout?');
          if (!ok) return;
          deleteWorkout(w._id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(title);
        if (w.description) li.appendChild(desc);
        li.appendChild(meta);
        li.appendChild(actions);
        workoutsList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      showMessage(listMessages, err.message || 'Failed to load workouts', 'error');
    }
  }

  async function updateWorkout(w) {
    const token = getToken();
    if (!token) {
      alert('Token required. Use Admin Login first.');
      return;
    }

    const newDesc = prompt('Description', w.description || '');
    if (newDesc === null) return;

    const newDiff = prompt('Difficulty (beginner/intermediate/advanced)', w.difficulty || 'beginner');
    if (newDiff === null) return;

    const newThumb = prompt('Thumbnail URL', w.thumbnail || '');
    if (newThumb === null) return;

    const currentIds = (w.exercises || []).map(e => e._id || e).join(', ');
    const newIdsStr = prompt('Exercise IDs (comma separated)', currentIds);
    if (newIdsStr === null) return;
    const newIds = parseIds(newIdsStr);

    try {
      await fetchJson(API_BASE + '/api/workouts/' + encodeURIComponent(w._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          description: newDesc,
          difficulty: newDiff,
          thumbnail: newThumb,
          exercises: newIds
        })
      });
      await loadWorkouts();
    } catch (err) {
      console.error(err);
      alert('Update failed: ' + (err.message || 'Unknown error'));
    }
  }

  async function deleteWorkout(id) {
    const token = getToken();
    if (!token) {
      alert('Token required. Use Admin Login first.');
      return;
    }
    try {
      await fetchJson(API_BASE + '/api/workouts/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      await loadWorkouts();
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
      const name = nameInput.value.trim();
      if (!name) {
        showMessage(createMessages, 'Name is required.', 'error');
        return;
      }
      const description = descInput.value.trim();
      const difficulty = difficultyInput.value || 'beginner';
      const exercises = parseIds(exercisesInput.value.trim());
      const thumbnail = thumbnailInput.value.trim();
      const btn = document.getElementById('btnCreate');
      btn.disabled = true;
      showMessage(createMessages, 'Creating...', '');
      try {
        const body = {
          name,
          description,
          difficulty,
          thumbnail
        };
        if (exercises.length) body.exercises = exercises;
        await fetchJson(API_BASE + '/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(body)
        });
        nameInput.value = '';
        descInput.value = '';
        exercisesInput.value = '';
        thumbnailInput.value = '';
        showMessage(createMessages, 'Workout created.', 'ok');
        await loadWorkouts();
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
      loadWorkouts();
    });
  }

  if (btnReload) {
    btnReload.addEventListener('click', function () {
      loadWorkouts();
    });
  }

  if (btnCheckHealth) {
    btnCheckHealth.addEventListener('click', function () {
      checkHealth();
    });
  }

  renderTokenInfo();
  checkHealth();
  loadWorkouts();
})();
