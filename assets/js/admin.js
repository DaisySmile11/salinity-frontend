// assets/js/admin.js (module)
// Secure-ish admin flow using backend (JWT):
// - Login: POST /auth/login
// - Load thresholds: GET /thresholds
// - Save thresholds: PUT /thresholds (requires Bearer token)
// Also exposes window.AdminAuth.isAuthed() for UI gating elsewhere.

import { API_BASE } from "./config.js";

const TOKEN_KEY = "salinity_admin_token_v1";
const ADMIN_KEY = "salinity_admin_info_v1";

const $ = (id) => document.getElementById(id);

function setToken(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin || {}));
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}
function isAuthed() {
  return !!getToken();
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function updateExportUi() {
  const exportBtn = document.getElementById("exportCsvBtn");
  if (exportBtn) exportBtn.style.display = isAuthed() ? "inline-flex" : "none";
}

function updateAdminPageUi() {
  const form = $("adminLoginForm");
  const actions = $("adminLoggedInActions");
  const title = $("adminTitle");
  const msg = $("adminMsg");

  if (!form && !actions) return;

  if (isAuthed()) {
    if (form) form.style.display = "none";
    if (actions) actions.style.display = "grid";
    if (msg) msg.textContent = "";
    if (title) title.textContent = "Thiết lập Admin";
  } else {
    if (form) form.style.display = "grid";
    if (actions) actions.style.display = "none";
    if (msg) msg.textContent = "";
    if (title) title.textContent = "Đăng nhập Admin";
  }
}

async function loadThresholdForm() {
  const t = await apiFetch("/thresholds");
  if (!t) return;

  $("t_sal_low").value = t.sal_low ?? "";
  $("t_sal_high").value = t.sal_high ?? "";
  $("t_ph_low").value = t.ph_low ?? "";
  $("t_ph_high").value = t.ph_high ?? "";
  $("t_temp_low").value = t.temp_low ?? "";
  $("t_temp_high").value = t.temp_high ?? "";
  $("t_bat_low").value = t.bat_low ?? "";
  $("t_offline_minutes").value = t.offline_minutes ?? "";
}

function bindGoHome() {
  const btn1 = $("goHomeBtn");
  const btn2 = $("goHomeBtnLogin");
  if (btn1) btn1.addEventListener("click", () => (window.location.href = "index.html"));
  if (btn2) btn2.addEventListener("click", () => (window.location.href = "index.html"));
}

function bindLogin() {
  const form = $("adminLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = String($("adminEmail")?.value || "").trim();
    const password = String($("adminPassword")?.value || "");

    const msg = $("adminMsg");
    if (msg) msg.textContent = "Đang đăng nhập…";

    try {
      const out = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(out.token, out.admin);
      updateAdminPageUi();
      await loadThresholdForm();
      if (msg) msg.textContent = "";
    } catch (err) {
      clearToken();
      updateAdminPageUi();
      if (msg) msg.textContent = "Đăng nhập thất bại: " + err.message;
    }
  });
}

function bindLogout() {
  const btn = $("adminLogoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    clearToken();
    updateAdminPageUi();
    updateExportUi();
    const tmsg = $("thresholdMsg");
    if (tmsg) tmsg.textContent = "";
  });
}

function bindThresholdSave() {
  const form = $("thresholdForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("thresholdMsg");
    if (msg) msg.textContent = "Đang lưu…";

    const payload = {
      sal_low: Number($("t_sal_low").value),
      sal_high: Number($("t_sal_high").value),
      ph_low: Number($("t_ph_low").value),
      ph_high: Number($("t_ph_high").value),
      temp_low: Number($("t_temp_low").value),
      temp_high: Number($("t_temp_high").value),
      bat_low: Number($("t_bat_low").value),
      offline_minutes: parseInt($("t_offline_minutes").value, 10),
    };

    try {
      await apiFetch("/thresholds", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (msg) msg.textContent = "✅ Đã lưu ngưỡng. Vui lòng F5/refresh các trang dashboard để áp dụng ngay.";
    } catch (err) {
      if (msg) msg.textContent = "❌ Lưu thất bại: " + err.message;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindGoHome();
  bindLogin();
  bindLogout();
  bindThresholdSave();

  updateAdminPageUi();
  updateExportUi();

  if (isAuthed()) {
    try {
      await loadThresholdForm();
    } catch (e) {
      // token có thể hết hạn
      clearToken();
      updateAdminPageUi();
    }
  }
});

window.AdminAuth = { isAuthed };


import { API_BASE } from "./config.js";
import { setAdminSession, getAdminToken } from "./auth.js";

async function login(email, password) {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Login failed");

  setAdminSession(data.token, data.admin);
}

import { getAdminToken } from "./auth.js";

async function saveThresholds(payload) {
  const token = getAdminToken();
  const r = await fetch(`${API_BASE}/thresholds`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Failed to update thresholds");
  return data;
}