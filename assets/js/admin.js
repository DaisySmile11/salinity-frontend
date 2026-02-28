// assets/js/admin.js (module)
// Admin flow using backend (JWT):
// - Login: POST /auth/login
// - Load thresholds: GET /thresholds
// - Save thresholds: PUT /thresholds (requires Bearer token)

import { API_BASE } from "./config.js";
import { setAdminSession, getAdminToken, adminLogout, isAdminLoggedIn } from "./auth.js";

const $ = (id) => document.getElementById(id);

async function apiFetch(path, opts = {}) {
  const token = getAdminToken();
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function updateAdminPageUi() {
  const form = $("adminLoginForm");
  const actions = $("adminLoggedInActions");
  const title = $("adminTitle");
  const msg = $("adminMsg");

  if (!form && !actions) return;

  if (isAdminLoggedIn()) {
    if (form) form.style.display = "none";
    if (actions) actions.style.display = "grid";
    if (title) title.textContent = "Thiết lập Admin";
    if (msg) msg.textContent = "";
  } else {
    if (form) form.style.display = "grid";
    if (actions) actions.style.display = "none";
    if (title) title.textContent = "Đăng nhập Admin";
    if (msg) msg.textContent = "";
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

      setAdminSession(out.token, out.admin);
      updateAdminPageUi();
      await loadThresholdForm();
      if (msg) msg.textContent = "✅ Đăng nhập thành công.";
    } catch (err) {
      adminLogout();
      updateAdminPageUi();
      if (msg) msg.textContent = "Đăng nhập thất bại: " + err.message;
    }
  });
}

function bindLogout() {
  const btn = $("adminLogoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    adminLogout();
    updateAdminPageUi();
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

    if (!isAdminLoggedIn()) {
      if (msg) msg.textContent = "❌ Bạn cần đăng nhập admin trước.";
      return;
    }

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

  if (isAdminLoggedIn()) {
    try {
      await loadThresholdForm();
    } catch {
      adminLogout();
      updateAdminPageUi();
    }
  }
});
