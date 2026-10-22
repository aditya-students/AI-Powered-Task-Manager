/* ═══════════════════════════════════════════════
   TaskFlow – Frontend Logic
   ═══════════════════════════════════════════════ */

const API = '';   // same origin

// ── State ──────────────────────────────────────
let allTasks    = [];
let activeStatus   = 'all';
let activePriority = 'all';
let searchQuery    = '';
let deleteTargetId = null;
let editingId      = null;
let chatOpen       = false;

// ── DOM Refs ────────────────────────────────────
const tasksContainer   = document.getElementById('tasks-container');
const emptyState       = document.getElementById('empty-state');
const taskCountBadge   = document.getElementById('task-count-badge');
const pageTitle        = document.getElementById('page-title');
const searchInput      = document.getElementById('search-input');
const addTaskBtn       = document.getElementById('add-task-btn');
const toggleChatBtn    = document.getElementById('toggle-chat-btn');
const chatPanel        = document.getElementById('chat-panel');
const chatCloseBtn     = document.getElementById('chat-close-btn');
const chatMessages     = document.getElementById('chat-messages');
const chatInput        = document.getElementById('chat-input');
const chatSendBtn      = document.getElementById('chat-send-btn');

// Modal
const taskModalOverlay  = document.getElementById('task-modal-overlay');
const modalTitle        = document.getElementById('modal-title');
const taskForm          = document.getElementById('task-form');
const taskIdInput       = document.getElementById('task-id');
const taskTitleInput    = document.getElementById('task-title');
const taskDescInput     = document.getElementById('task-description');
const taskPriorityInput = document.getElementById('task-priority');
const taskStatusInput   = document.getElementById('task-status');
const taskDueDateInput  = document.getElementById('task-due-date');
const modalClose        = document.getElementById('modal-close');
const modalCancel       = document.getElementById('modal-cancel');
const modalSubmit       = document.getElementById('modal-submit');

// Delete modal
const deleteModalOverlay = document.getElementById('delete-modal-overlay');
const deleteTaskTitle    = document.getElementById('delete-task-title');
const deleteModalClose   = document.getElementById('delete-modal-close');
const deleteCancel       = document.getElementById('delete-cancel');
const deleteConfirm      = document.getElementById('delete-confirm');

// Stats
const totalCount    = document.getElementById('total-count');
const progressCount = document.getElementById('progress-count');
const doneCount     = document.getElementById('done-count');
const pendingCount  = document.getElementById('pending-count');

// Toast
const toastContainer = document.getElementById('toast-container');


/* ═══════════════════════════════════════════════
   API HELPERS
═══════════════════════════════════════════════ */

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */

async function loadStats() {
  try {
    const s = await apiFetch('/api/stats');
    totalCount.textContent    = s.total;
    progressCount.textContent = s.in_progress;
    doneCount.textContent     = s.done;
    pendingCount.textContent  = s.pending;
  } catch {/* silent */}
}

/* ═══════════════════════════════════════════════
   TASK LIST
═══════════════════════════════════════════════ */

async function loadTasks() {
  try {
    const params = new URLSearchParams();
    if (activeStatus !== 'all')   params.set('status', activeStatus);
    if (activePriority !== 'all') params.set('priority', activePriority);
    allTasks = await apiFetch(`/api/todos?${params}`);
    renderTasks();
    loadStats();
  } catch (e) {
    showToast('Failed to load tasks: ' + e.message, 'error');
  }
}

function filterTasks() {
  if (!searchQuery) return allTasks;
  const q = searchQuery.toLowerCase();
  return allTasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q)
  );
}

function renderTasks() {
  const filtered = filterTasks();

  // Remove old cards (keep empty state)
  [...tasksContainer.querySelectorAll('.task-card')].forEach(c => c.remove());

  const titleMap = {
    all: 'All Tasks',
    pending: '⏳ Pending',
    in_progress: '🔄 In Progress',
    done: '✅ Done',
  };
  pageTitle.textContent = titleMap[activeStatus] || 'All Tasks';
  taskCountBadge.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

  emptyState.style.display = filtered.length ? 'none' : 'flex';

  filtered.forEach(task => {
    const card = buildTaskCard(task);
    tasksContainer.appendChild(card);
  });
}

function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority} status-${task.status}`;
  card.dataset.id = task.id;

  const priorityLabels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  const statusLabels   = { pending: '⏳ Pending', in_progress: '🔄 In Progress', done: '✅ Done' };

  card.innerHTML = `
    <div class="task-card-top">
      <p class="task-title">${escHtml(task.title)}</p>
      <div class="task-actions">
        <button class="task-action-btn edit-btn" title="Edit" data-id="${task.id}">✏️</button>
        <button class="task-action-btn delete-btn" title="Delete" data-id="${task.id}">🗑️</button>
      </div>
    </div>
    ${task.description ? `<p class="task-description">${escHtml(task.description)}</p>` : ''}
    <div class="task-meta">
      <span class="badge badge-priority-${task.priority}">${priorityLabels[task.priority] || task.priority}</span>
      <span class="badge badge-status-${task.status}">${statusLabels[task.status] || task.status}</span>
      ${task.due_date ? `<span class="task-due">📅 ${task.due_date}</span>` : ''}
    </div>
    <div class="task-footer">
      <select class="status-change-select" data-id="${task.id}" title="Change status">
        <option value="pending"     ${task.status === 'pending'     ? 'selected' : ''}>⏳ Pending</option>
        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>🔄 In Progress</option>
        <option value="done"        ${task.status === 'done'        ? 'selected' : ''}>✅ Done</option>
      </select>
      <span class="task-created">${task.created_at || ''}</span>
    </div>
  `;

  card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
  card.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(task));
  card.querySelector('.status-change-select').addEventListener('change', async e => {
    try {
      await apiFetch(`/api/todos/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: e.target.value }),
      });
      showToast('Status updated!', 'success');
      loadTasks();
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error');
    }
  });

  return card;
}

/* ═══════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════ */

function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'New Task';
  modalSubmit.textContent = 'Create Task';
  taskForm.reset();
  taskIdInput.value = '';
  taskStatusInput.value = 'pending';
  taskPriorityInput.value = 'medium';
  taskModalOverlay.classList.add('open');
  taskTitleInput.focus();
}

function openEditModal(task) {
  editingId = task.id;
  modalTitle.textContent = 'Edit Task';
  modalSubmit.textContent = 'Save Changes';
  taskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || '';
  taskPriorityInput.value = task.priority || 'medium';
  taskStatusInput.value = task.status || 'pending';
  taskDueDateInput.value = task.due_date || '';
  taskModalOverlay.classList.add('open');
  taskTitleInput.focus();
}

function closeTaskModal() {
  taskModalOverlay.classList.remove('open');
}

function openDeleteModal(task) {
  deleteTargetId = task.id;
  deleteTaskTitle.textContent = `"${task.title}"`;
  deleteModalOverlay.classList.add('open');
}

function closeDeleteModal() {
  deleteModalOverlay.classList.remove('open');
  deleteTargetId = null;
}

/* Form submit */
taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    title:       taskTitleInput.value.trim(),
    description: taskDescInput.value.trim(),
    priority:    taskPriorityInput.value,
    status:      taskStatusInput.value,
    due_date:    taskDueDateInput.value,
  };
  if (!body.title) return;

  try {
    if (editingId) {
      await apiFetch(`/api/todos/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Task updated!', 'success');
    } else {
      await apiFetch('/api/todos', { method: 'POST', body: JSON.stringify(body) });
      showToast('Task created!', 'success');
    }
    closeTaskModal();
    loadTasks();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

/* Delete confirm */
deleteConfirm.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    await apiFetch(`/api/todos/${deleteTargetId}`, { method: 'DELETE' });
    showToast('Task deleted.', 'info');
    closeDeleteModal();
    loadTasks();
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
});

/* Close buttons */
addTaskBtn.addEventListener('click', openAddModal);
modalClose.addEventListener('click', closeTaskModal);
modalCancel.addEventListener('click', closeTaskModal);
taskModalOverlay.addEventListener('click', e => { if (e.target === taskModalOverlay) closeTaskModal(); });
deleteModalClose.addEventListener('click', closeDeleteModal);
deleteCancel.addEventListener('click', closeDeleteModal);
deleteModalOverlay.addEventListener('click', e => { if (e.target === deleteModalOverlay) closeDeleteModal(); });

/* ═══════════════════════════════════════════════
   FILTERS
═══════════════════════════════════════════════ */

document.getElementById('status-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn || btn.dataset.status === undefined) return;
  document.querySelectorAll('#status-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeStatus = btn.dataset.status;
  loadTasks();
});

document.getElementById('priority-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn || btn.dataset.priority === undefined) return;
  document.querySelectorAll('#priority-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activePriority = btn.dataset.priority;
  loadTasks();
});

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  renderTasks();
});

/* ═══════════════════════════════════════════════
   CHAT PANEL
═══════════════════════════════════════════════ */

function toggleChat() {
  chatOpen = !chatOpen;
  chatPanel.classList.toggle('open', chatOpen);
  if (chatOpen) chatInput.focus();
}

toggleChatBtn.addEventListener('click', toggleChat);
chatCloseBtn.addEventListener('click', toggleChat);

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';

  appendChatMsg(text, 'user');

  // Typing indicator
  const typingEl = appendTypingIndicator();

  try {
    const data = await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    });
    typingEl.remove();
    appendChatMsg(data.response, 'ai');
    // Refresh tasks after AI may have changed them
    loadTasks();
  } catch (err) {
    typingEl.remove();
    appendChatMsg('⚠️ Error: ' + err.message, 'ai');
  }
}

function appendChatMsg(text, sender) {
  const div = document.createElement('div');
  div.className = `chat-msg ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'chat-msg ai-msg typing-indicator';
  div.innerHTML = `<div class="msg-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */

function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ═══════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════ */

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
loadTasks();
