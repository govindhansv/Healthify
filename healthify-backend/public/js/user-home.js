(function () {
  const healthStatus = document.getElementById('healthStatus');
  const catMessages = document.getElementById('catMessages');
  const categoriesGrid = document.getElementById('categoriesGrid');
  const exMessages = document.getElementById('exMessages');
  const exercisesGrid = document.getElementById('exercisesGrid');
  const woMessages = document.getElementById('woMessages');
  const workoutsGrid = document.getElementById('workoutsGrid');
  const currentWorkoutInfo = document.getElementById('currentWorkoutInfo');
  const userInfo = document.getElementById('userInfo');
  const btnUserLogout = document.getElementById('btnUserLogout');

  const API_BASE = '';

  function showMessage(el, msg, type) {
    if (!el) return;
    el.innerHTML = '';
    if (!msg) return;
    const span = document.createElement('span');
    span.textContent = msg;
    span.className = type === 'error' ? 'error' : 'ok';
    el.appendChild(span);
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

  function getUserToken() {
    return localStorage.getItem('userToken') || '';
  }

  function parseJwtEmail(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return '';
      const payload = JSON.parse(atob(parts[1]));
      return payload.email || '';
    } catch (e) {
      return '';
    }
  }

  function getCurrentWorkout() {
    try {
      const raw = localStorage.getItem('currentWorkout');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setCurrentWorkout(w) {
    if (!w || !w._id) {
      localStorage.removeItem('currentWorkout');
    } else {
      const payload = {
        id: w._id,
        name: w.name || '',
        difficulty: w.difficulty || '',
        totalDuration: w.totalDuration || 0
      };
      localStorage.setItem('currentWorkout', JSON.stringify(payload));
    }
    renderCurrentWorkout();
  }

  function renderCurrentWorkout() {
    if (!currentWorkoutInfo) return;
    const cw = getCurrentWorkout();
    if (!cw) {
      currentWorkoutInfo.textContent = 'No workout selected.';
      return;
    }
    const diff = cw.difficulty || 'unknown';
    const dur = cw.totalDuration || 0;
    currentWorkoutInfo.textContent = 'Current workout: ' + (cw.name || '(no name)') + ' • Difficulty: ' + diff + ' • Duration: ' + dur + 's';
  }

  function renderUserInfo() {
    if (!userInfo) return;
    const t = getUserToken();
    if (!t) {
      userInfo.textContent = 'Not logged in.';
      if (btnUserLogout) btnUserLogout.disabled = true;
    } else {
      const email = parseJwtEmail(t) || '(unknown)';
      userInfo.textContent = 'Logged in as ' + email;
      if (btnUserLogout) btnUserLogout.disabled = false;
    }
  }

  async function loadHealth() {
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
    if (!categoriesGrid) return;
    showMessage(catMessages, 'Loading categories...', '');
    categoriesGrid.innerHTML = '';
    try {
      const data = await fetchJson(API_BASE + '/api/categories?page=1&limit=50');
      const arr = data.data || [];
      if (!arr.length) {
        showMessage(catMessages, 'No categories found.', 'error');
        return;
      }
      showMessage(catMessages, '', '');
      arr.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'card';
        const title = document.createElement('div');
        title.innerHTML = '<strong>' + (cat.name || '(no name)') + '</strong>';
        const slug = document.createElement('div');
        slug.className = 'meta';
        slug.textContent = 'Slug: ' + (cat.slug || '-');
        const desc = document.createElement('div');
        desc.textContent = cat.description || '';
        desc.style.fontSize = '0.9rem';
        desc.style.marginTop = '0.25rem';
        card.appendChild(title);
        card.appendChild(slug);
        if (cat.description) card.appendChild(desc);
        categoriesGrid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      showMessage(catMessages, err.message || 'Failed to load categories', 'error');
    }
  }

  async function loadExercises() {
    if (!exercisesGrid) return;
    showMessage(exMessages, 'Loading exercises...', '');
    exercisesGrid.innerHTML = '';
    try {
      const data = await fetchJson(API_BASE + '/api/exercises?page=1&limit=50');
      const arr = data.data || [];
      if (!arr.length) {
        showMessage(exMessages, 'No exercises found.', 'error');
        return;
      }
      showMessage(exMessages, '', '');
      arr.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'card';
        const title = document.createElement('div');
        title.innerHTML = '<strong>' + (ex.title || '(no title)') + '</strong>';
        const meta = document.createElement('div');
        meta.className = 'meta';
        const diff = ex.difficulty || 'unknown';
        const duration = ex.duration || 0;
        const catName = ex.category && ex.category.name ? ex.category.name : 'No category';
        meta.textContent = 'Difficulty: ' + diff + ' • Duration: ' + duration + 's • Category: ' + catName;
        const desc = document.createElement('div');
        desc.textContent = ex.description || '';
        desc.style.fontSize = '0.9rem';
        desc.style.marginTop = '0.25rem';
        card.appendChild(title);
        card.appendChild(meta);
        if (ex.description) card.appendChild(desc);
        exercisesGrid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      showMessage(exMessages, err.message || 'Failed to load exercises', 'error');
    }
  }

  async function loadWorkouts() {
    if (!workoutsGrid) return;
    showMessage(woMessages, 'Loading workouts...', '');
    workoutsGrid.innerHTML = '';
    try {
      const data = await fetchJson(API_BASE + '/api/workouts?page=1&limit=50');
      const arr = data.data || [];
      if (!arr.length) {
        showMessage(woMessages, 'No workouts found.', 'error');
        return;
      }
      showMessage(woMessages, '', '');
      const current = getCurrentWorkout();
      arr.forEach(w => {
        const card = document.createElement('div');
        card.className = 'card';
        const title = document.createElement('div');
        title.innerHTML = '<strong>' + (w.name || '(no name)') + '</strong>';
        const meta = document.createElement('div');
        meta.className = 'meta';
        const diff = w.difficulty || 'unknown';
        const dur = w.totalDuration || 0;
        const count = (w.exercises || []).length;
        meta.textContent = 'Difficulty: ' + diff + ' • Total duration: ' + dur + 's • Exercises: ' + count;
        const desc = document.createElement('div');
        desc.textContent = w.description || '';
        desc.style.fontSize = '0.9rem';
        desc.style.marginTop = '0.25rem';
        const btn = document.createElement('button');
        btn.textContent = 'Take this workout';
        btn.type = 'button';
        btn.style.marginTop = '0.5rem';
        btn.addEventListener('click', function () {
          setCurrentWorkout(w);
        });

        if (current && current.id === w._id) {
          card.style.borderColor = '#3182ce';
          card.style.boxShadow = '0 0 0 1px #3182ce';
        }

        card.appendChild(title);
        card.appendChild(meta);
        if (w.description) card.appendChild(desc);
        card.appendChild(btn);
        workoutsGrid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      showMessage(woMessages, err.message || 'Failed to load workouts', 'error');
    }
  }

  if (btnUserLogout) {
    btnUserLogout.addEventListener('click', function () {
      localStorage.removeItem('userToken');
      renderUserInfo();
    });
  }

  renderCurrentWorkout();
  renderUserInfo();
  loadHealth();
  loadCategories();
  loadExercises();
  loadWorkouts();
})();
