/* ===========================
   app.js — Main Application
=========================== */

// ── Storage helpers ──────────────────────────────────────────────
const store = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
};

// ── Toast notification ───────────────────────────────────────────
let toastTimeout;
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ══════════════════════════════════════════════════════════════════
// 1. DATE / TIME & GREETING
// ══════════════════════════════════════════════════════════════════
const datetimeEl  = document.getElementById('datetime');
const greetingEl  = document.getElementById('greetingText');
const nameInput   = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveName');

function getTimeGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

function updateClock() {
  const now    = new Date();
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const dayName = days[now.getDay()];
  const date    = now.getDate();
  const month   = months[now.getMonth()];
  const year    = now.getFullYear();
  const hh      = String(now.getHours()).padStart(2, '0');
  const mm      = String(now.getMinutes()).padStart(2, '0');
  const ss      = String(now.getSeconds()).padStart(2, '0');

  datetimeEl.textContent = `${dayName}, ${date} ${month} ${year}  •  ${hh}:${mm}:${ss}`;

  // Greeting
  const name     = store.get('userName', '');
  const greeting = getTimeGreeting(now.getHours());
  greetingEl.textContent = name ? `${greeting}, ${name}! 👋` : `${greeting}! 👋`;
}

// Save custom name
saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  store.set('userName', name);
  nameInput.value = '';
  updateClock();
  showToast(name ? `Name saved as "${name}"` : 'Name cleared');
});

nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveNameBtn.click(); });

// Pre-fill with saved name
const savedName = store.get('userName', '');
if (savedName) nameInput.placeholder = `Current name: ${savedName}`;

setInterval(updateClock, 1000);
updateClock();

// ══════════════════════════════════════════════════════════════════
// 2. FOCUS TIMER (Pomodoro)
// ══════════════════════════════════════════════════════════════════
const timerDisplay   = document.getElementById('timerDisplay');
const startBtn       = document.getElementById('startTimer');
const stopBtn        = document.getElementById('stopTimer');
const resetBtn       = document.getElementById('resetTimer');
const pomodoroInput  = document.getElementById('pomodoroMinutes');
const applyTimeBtn   = document.getElementById('applyTime');

let timerInterval = null;
let totalSeconds  = store.get('pomodoroMinutes', 25) * 60;
let remainingSeconds = totalSeconds;
let timerRunning  = false;

pomodoroInput.value = store.get('pomodoroMinutes', 25);

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(remainingSeconds);
}

applyTimeBtn.addEventListener('click', () => {
  const mins = parseInt(pomodoroInput.value, 10);
  if (!mins || mins < 1 || mins > 120) {
    showToast('Enter a value between 1 and 120');
    return;
  }
  clearInterval(timerInterval);
  timerRunning = false;
  startBtn.textContent = '▶ Start';
  totalSeconds     = mins * 60;
  remainingSeconds = totalSeconds;
  store.set('pomodoroMinutes', mins);
  renderTimer();
  showToast(`Timer set to ${mins} minute${mins !== 1 ? 's' : ''}`);
});

startBtn.addEventListener('click', () => {
  if (timerRunning) return;
  if (remainingSeconds === 0) remainingSeconds = totalSeconds;
  timerRunning = true;
  startBtn.textContent = '⏱ Running…';
  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.textContent = '▶ Start';
      timerDisplay.textContent = '00:00';
      showToast('⏰ Time is up! Great work!');
    }
  }, 1000);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  startBtn.textContent = '▶ Start';
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  startBtn.textContent = '▶ Start';
  remainingSeconds = totalSeconds;
  renderTimer();
});

renderTimer();

// ══════════════════════════════════════════════════════════════════
// 3. TO-DO LIST
// ══════════════════════════════════════════════════════════════════
const taskInput  = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTask');
const taskList   = document.getElementById('taskList');
const sortSelect = document.getElementById('sortSelect');

let tasks = store.get('tasks', []);

function saveTasks() {
  store.set('tasks', tasks);
}

function getSortedTasks() {
  const sort = sortSelect.value;
  const copy = [...tasks];
  if (sort === 'az')   return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'za')   return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (sort === 'done') return copy.sort((a, b) => a.done - b.done);
  return copy; // default: insertion order
}

function renderTasks() {
  taskList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    const empty = document.createElement('li');
    empty.style.cssText = 'text-align:center;color:var(--text-muted);padding:20px;font-size:0.9rem;';
    empty.textContent = 'No tasks yet. Add one above!';
    taskList.appendChild(empty);
    return;
  }

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'task-check';
    check.checked = task.done;
    check.addEventListener('change', () => toggleTask(task.id));

    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'btn btn-secondary';
    editBtn.title = 'Edit task';
    editBtn.addEventListener('click', () => startEdit(task.id, li, textSpan, editBtn));

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.className = 'btn btn-danger';
    delBtn.title = 'Delete task';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(check);
    li.appendChild(textSpan);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    showToast('Please enter a task');
    return;
  }

  // ── Bonus: Prevent duplicate tasks (case-insensitive) ──
  const duplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    showToast('⚠️ That task already exists!');
    taskInput.select();
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  renderTasks();
  taskInput.value = '';
  showToast('Task added ✓');
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showToast('Task deleted');
}

function startEdit(id, li, textSpan, editBtn) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task-edit-input';
  editInput.value = task.text;
  editInput.maxLength = 100;

  li.replaceChild(editInput, textSpan);
  editBtn.textContent = '✔️';
  editBtn.title = 'Save edit';
  editInput.focus();

  const saveEdit = () => {
    const newText = editInput.value.trim();
    if (!newText) {
      showToast('Task cannot be empty');
      return;
    }
    // Check duplicate (excluding current task)
    const dup = tasks.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
    if (dup) {
      showToast('⚠️ A task with that name already exists!');
      return;
    }
    task.text = newText;
    saveTasks();
    renderTasks();
    showToast('Task updated ✓');
  };

  editBtn.onclick = saveEdit;
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTasks();
  });
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);

renderTasks();

// ══════════════════════════════════════════════════════════════════
// 4. QUICK LINKS
// ══════════════════════════════════════════════════════════════════
const linkNameInput = document.getElementById('linkName');
const linkUrlInput  = document.getElementById('linkUrl');
const addLinkBtn    = document.getElementById('addLink');
const linksListEl   = document.getElementById('linksList');

let links = store.get('quickLinks', []);

function saveLinks() {
  store.set('quickLinks', links);
}

function renderLinks() {
  linksListEl.innerHTML = '';

  if (links.length === 0) {
    linksListEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.9rem;">No links saved yet.</span>';
    return;
  }

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.style.display = 'flex';
    chip.style.alignItems = 'center';

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'link-chip';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete';
    delBtn.title = 'Remove link';
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
      showToast('Link removed');
    });

    a.appendChild(delBtn);
    chip.appendChild(a);
    linksListEl.appendChild(chip);
  });
}

addLinkBtn.addEventListener('click', () => {
  const name = linkNameInput.value.trim();
  let url     = linkUrlInput.value.trim();

  if (!name || !url) {
    showToast('Enter both a label and a URL');
    return;
  }

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  showToast(`Link "${name}" saved ✓`);
});

linkUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLinkBtn.click(); });

renderLinks();

// ══════════════════════════════════════════════════════════════════
// 5. LIGHT / DARK MODE (Bonus Feature 1)
// ══════════════════════════════════════════════════════════════════
const themeToggle = document.getElementById('themeToggle');
const html        = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Load saved theme (default to system preference)
const savedTheme = store.get('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);
