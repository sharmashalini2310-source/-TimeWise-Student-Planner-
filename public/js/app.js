const $ = (id) => document.getElementById(id);
const state = { token: localStorage.getItem("timewiseToken"), user: JSON.parse(localStorage.getItem("timewiseUser") || "null"), tasks: [], schedule: [], authMode: "login", editingTask: null, editingSchedule: null, selectedDay: "Monday" };
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const api = async (url, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
};
const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const niceDate = value => {
  if (!value) return "No due date";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); }
function authMessage(message, success = false) { $("authMessage").textContent = message; $("authMessage").style.color = success ? "#26785b" : "#b44747"; }
function setAuthMode(mode) {
  state.authMode = mode;
  const signup = mode === "register";
  $("authEyebrow").textContent = signup ? "GET STARTED" : "WELCOME BACK";
  $("authTitle").textContent = signup ? "Create your account" : "Sign in to your space";
  $("authSubtitle").textContent = signup ? "Build a routine that works for you." : "Your plans are waiting for you.";
  $("nameLabel").classList.toggle("hidden", !signup);
  $("name").required = signup;
  $("authSubmit").innerHTML = signup ? 'Create account <i class="bi bi-arrow-right"></i>' : 'Sign in <i class="bi bi-arrow-right"></i>';
  $("switchText").textContent = signup ? "Already have an account?" : "New to TimeWise?";
  $("switchMode").textContent = signup ? "Sign in" : "Create an account";
  $("password").autocomplete = signup ? "new-password" : "current-password";
  authMessage("");
}
$("switchMode").addEventListener("click", () => setAuthMode(state.authMode === "login" ? "register" : "login"));
$("authForm").addEventListener("submit", async e => {
  e.preventDefault(); authMessage("");
  const body = { email: $("email").value.trim(), password: $("password").value };
  if (state.authMode === "register") body.name = $("name").value.trim();
  try {
    const result = await api(`/api/auth/${state.authMode}`, { method: "POST", body: JSON.stringify(body) });
    state.token = result.token; state.user = result.user;
    localStorage.setItem("timewiseToken", state.token); localStorage.setItem("timewiseUser", JSON.stringify(state.user));
    $("authForm").reset(); await enterApp();
  } catch (error) { authMessage(error.message); }
});
function showApp(show) { $("authScreen").classList.toggle("hidden", show); $("app").classList.toggle("hidden", !show); }
async function enterApp() {
  if (!state.token || !state.user) { showApp(false); return; }
  showApp(true);
  $("profileName").textContent = state.user.name; $("avatar").textContent = state.user.name.charAt(0).toUpperCase(); $("topAvatar").textContent = $("avatar").textContent;
  $("welcomeTitle").textContent = `Hello, ${state.user.name.split(" ")[0]} 👋`;
  $("todayLabel").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  await loadData();
}
async function loadData() {
  try {
    const [tasks, schedule] = await Promise.all([api("/api/tasks"), api("/api/schedule")]);
    state.tasks = tasks; state.schedule = schedule;
    renderAll();
  } catch (error) {
    if (error.message.toLowerCase().includes("log in") || error.message.toLowerCase().includes("session")) logout();
    else toast(error.message);
  }
}
function renderAll() { renderStats(); renderUpcoming(); renderTasks(); renderDayTabs(); renderSchedule(); renderDashboardSchedule(); }
function renderStats() {
  const total = state.tasks.length, completed = state.tasks.filter(t => t.completed).length, pending = total - completed, percent = total ? Math.round(completed / total * 100) : 0;
  $("totalTasks").textContent = total; $("completedTasks").textContent = completed; $("pendingTasks").textContent = pending; $("completionRate").textContent = `${percent}%`;
  $("ringPercent").textContent = `${percent}%`; $("progressRing").style.setProperty("--progress", `${percent * 3.6}deg`);
  $("progressCaption").textContent = total ? (percent === 100 ? "Wonderful! All tasks completed." : "Keep going. You're making progress!") : "Add a task to get started.";
  $("taskNavCount").textContent = pending;
}
function taskRow(task, showDescription = false) {
  return `<div class="task-row ${task.completed ? "is-complete" : ""}">
    <button class="task-check ${task.completed ? "checked" : ""}" data-action="toggle" data-id="${task._id}" aria-label="Toggle completion">${task.completed ? '<i class="bi bi-check2"></i>' : ""}</button>
    <div class="task-main"><strong>${esc(task.title)}</strong><p>${esc(task.category)} · ${niceDate(task.dueDate)}${showDescription && task.description ? ` · ${esc(task.description)}` : ""}</p></div>
    <div class="task-meta"><span class="priority ${esc(task.priority)}">${esc(task.priority)}</span><div class="row-actions"><button class="tiny-action" data-action="edit" data-id="${task._id}" aria-label="Edit task"><i class="bi bi-pencil"></i></button><button class="tiny-action" data-action="delete" data-id="${task._id}" aria-label="Delete task"><i class="bi bi-trash3"></i></button></div></div>
  </div>`;
}
function renderUpcoming() {
  const tasks = [...state.tasks].filter(t => !t.completed).sort((a,b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).slice(0, 4);
  $("upcomingList").innerHTML = tasks.length ? tasks.map(t => taskRow(t)).join("") : `<div class="empty-state"><i class="bi bi-check2-circle"></i>No pending tasks. Add a new task to plan your day.</div>`;
}
function renderTasks() {
  const search = $("taskSearch").value.toLowerCase(), filter = $("taskFilter").value, priority = $("priorityFilter").value;
  const list = state.tasks.filter(t => (t.title + " " + t.description + " " + t.category).toLowerCase().includes(search))
    .filter(t => filter === "all" || (filter === "completed" ? t.completed : !t.completed))
    .filter(t => priority === "all" || t.priority === priority)
    .sort((a,b) => Number(a.completed)-Number(b.completed) || (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  $("allTasksList").innerHTML = list.length ? list.map(t => taskRow(t, true)).join("") : `<div class="empty-state"><i class="bi bi-clipboard-check"></i>No tasks match this view.</div>`;
}
document.addEventListener("click", async e => {
  const button = e.target.closest("[data-action]");
  if (!button) return;
  const task = state.tasks.find(t => t._id === button.dataset.id);
  if (!task) return;
  try {
    if (button.dataset.action === "toggle") await api(`/api/tasks/${task._id}`, { method: "PUT", body: JSON.stringify({ completed: !task.completed }) });
    if (button.dataset.action === "edit") openTaskModal(task);
    if (button.dataset.action === "delete") { if (!confirm(`Delete "${task.title}"?`)) return; await api(`/api/tasks/${task._id}`, { method: "DELETE" }); toast("Task deleted."); }
    if (button.dataset.action !== "edit") await loadData();
  } catch (error) { toast(error.message); }
});
$("taskSearch").addEventListener("input", renderTasks); $("taskFilter").addEventListener("change", renderTasks); $("priorityFilter").addEventListener("change", renderTasks);
function openTaskModal(task = null) {
  state.editingTask = task; $("taskForm").reset(); $("taskMessage").textContent = "";
  $("taskModalTitle").textContent = task ? "Edit task" : "Create a task";
  if (task) { $("taskTitle").value = task.title; $("taskDescription").value = task.description || ""; $("taskDueDate").value = task.dueDate || ""; $("taskPriority").value = task.priority; $("taskCategory").value = task.category; }
  $("taskModal").classList.remove("hidden"); setTimeout(() => $("taskTitle").focus(), 50);
}
$("quickAdd").addEventListener("click", () => openTaskModal()); $("newTaskBtn").addEventListener("click", () => openTaskModal());
$("taskForm").addEventListener("submit", async e => {
  e.preventDefault(); $("taskMessage").textContent = "";
  const body = { title: $("taskTitle").value.trim(), description: $("taskDescription").value.trim(), dueDate: $("taskDueDate").value, priority: $("taskPriority").value, category: $("taskCategory").value };
  try {
    if (state.editingTask) await api(`/api/tasks/${state.editingTask._id}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/api/tasks", { method: "POST", body: JSON.stringify(body) });
    $("taskModal").classList.add("hidden"); toast(state.editingTask ? "Task updated." : "Task added."); await loadData();
  } catch (error) { $("taskMessage").textContent = error.message; }
});
function renderDayTabs() {
  $("dayTabs").innerHTML = days.map(day => `<button class="day-tab ${state.selectedDay === day ? "active" : ""}" data-day="${day}">${day.slice(0,3)}</button>`).join("");
  $("scheduleDayTitle").textContent = `${state.selectedDay}'s classes`;
}
$("dayTabs").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (!b) return; state.selectedDay = b.dataset.day; renderDayTabs(); renderSchedule(); });
function renderSchedule() {
  const entries = state.schedule.filter(s => s.day === state.selectedDay).sort((a,b) => a.startTime.localeCompare(b.startTime));
  $("scheduleList").innerHTML = entries.length ? entries.map(s => `<div class="schedule-item"><div class="schedule-time">${esc(s.startTime)} – ${esc(s.endTime)}</div><div class="schedule-detail"><strong>${esc(s.subject)}</strong><small>${esc(s.location || "Location not set")}</small></div><div class="row-actions"><button class="tiny-action" data-schedule-action="edit" data-id="${s._id}" aria-label="Edit class"><i class="bi bi-pencil"></i></button><button class="tiny-action" data-schedule-action="delete" data-id="${s._id}" aria-label="Delete class"><i class="bi bi-trash3"></i></button></div></div>`).join("") : `<div class="empty-state"><i class="bi bi-calendar-plus"></i>No classes planned for ${state.selectedDay}. Add one to start your timetable.</div>`;
}
function renderDashboardSchedule() {
  const todayIndex = new Date().getDay(); const today = days[todayIndex === 0 ? 6 : todayIndex - 1];
  const entries = state.schedule.filter(s => s.day === today).sort((a,b) => a.startTime.localeCompare(b.startTime)).slice(0,3);
  $("dashboardSchedule").innerHTML = entries.length ? entries.map(s => `<div class="schedule-chip"><small>${esc(s.startTime)} – ${esc(s.endTime)}</small><strong>${esc(s.subject)}</strong><span>${esc(s.location || s.day)}</span></div>`).join("") : `<div class="empty-state" style="grid-column:1/-1;padding:15px"><i class="bi bi-calendar-week"></i>No classes for ${today} yet.</div>`;
}
function openScheduleModal(entry = null) {
  state.editingSchedule = entry; $("scheduleForm").reset(); $("scheduleMessage").textContent = "";
  $("scheduleModalTitle").textContent = entry ? "Edit class" : "Add a class";
  $("scheduleDay").value = state.selectedDay;
  if (entry) { $("subject").value = entry.subject; $("scheduleDay").value = entry.day; $("startTime").value = entry.startTime; $("endTime").value = entry.endTime; $("location").value = entry.location || ""; }
  $("scheduleModal").classList.remove("hidden");
}
$("newScheduleBtn").addEventListener("click", () => openScheduleModal());
$("scheduleList").addEventListener("click", async e => {
  const b = e.target.closest("[data-schedule-action]"); if (!b) return;
  const entry = state.schedule.find(s => s._id === b.dataset.id); if (!entry) return;
  if (b.dataset.scheduleAction === "edit") return openScheduleModal(entry);
  if (confirm(`Delete class "${entry.subject}"?`)) {
    try { await api(`/api/schedule/${entry._id}`, { method: "DELETE" }); toast("Class deleted."); await loadData(); }
    catch (error) { toast(error.message); }
  }
});
$("scheduleForm").addEventListener("submit", async e => {
  e.preventDefault(); $("scheduleMessage").textContent = "";
  const body = { subject: $("subject").value.trim(), day: $("scheduleDay").value, startTime: $("startTime").value, endTime: $("endTime").value, location: $("location").value.trim() };
  if (body.endTime <= body.startTime) { $("scheduleMessage").textContent = "End time must be later than start time."; return; }
  try {
    if (state.editingSchedule) await api(`/api/schedule/${state.editingSchedule._id}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/api/schedule", { method: "POST", body: JSON.stringify(body) });
    state.selectedDay = body.day; $("scheduleModal").classList.add("hidden"); toast(state.editingSchedule ? "Class updated." : "Class added."); await loadData();
  } catch (error) { $("scheduleMessage").textContent = error.message; }
});
function switchView(view) {
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active-view"));
  $(`${view}View`).classList.add("active-view");
  document.querySelectorAll(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  $("breadcrumbCurrent").textContent = view === "dashboard" ? "Dashboard" : view === "tasks" ? "My Tasks" : "Timetable";
  $("sidebar").classList.remove("open");
}
document.querySelectorAll(".nav-link").forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => switchView(b.dataset.goto)));
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("logoutBtn").addEventListener("click", logout);
function logout() {
  state.token = null; state.user = null; state.tasks = []; state.schedule = [];
  localStorage.removeItem("timewiseToken"); localStorage.removeItem("timewiseUser");
  showApp(false); setAuthMode("login"); $("authForm").reset();
}
document.querySelectorAll(".close-modal").forEach(b => b.addEventListener("click", () => { $("taskModal").classList.add("hidden"); $("scheduleModal").classList.add("hidden"); }));
document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", e => { if (e.target === backdrop) backdrop.classList.add("hidden"); }));
document.addEventListener("keydown", e => { if (e.key === "Escape") { $("taskModal").classList.add("hidden"); $("scheduleModal").classList.add("hidden"); $("sidebar").classList.remove("open"); } });
if (state.token && state.user) enterApp(); else setAuthMode("login");
