// assets/js/admin.js (module)
// Trang Admin: chỉnh thresholds (yêu cầu đã login)
import { API_BASE } from "./config.js";
import { getAdminToken, isAdminLoggedIn } from "./auth.js";
import { renderAuthNav } from "./nav.js";

const $ = (id) => document.getElementById(id);

function showMsg(msg, ok = true) {
  const el = $("thresholdMsg");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("ok", ok);
  el.classList.toggle("err", !ok);
}

async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...(opts.headers || {}) };

  // attach token for protected routes
  const token = getAdminToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function getPayloadFromForm() {
  const num = (v) => Number(v);
  const intv = (v) => parseInt(v, 10);

  return {
    sal_low: num($("t_sal_low")?.value),
    sal_high: num($("t_sal_high")?.value),
    ph_low: num($("t_ph_low")?.value),
    ph_high: num($("t_ph_high")?.value),
    temp_low: num($("t_temp_low")?.value),
    temp_high: num($("t_temp_high")?.value),
    bat_low: num($("t_bat_low")?.value),
    offline_minutes: intv($("t_offline_minutes")?.value),
  };
}

function fillForm(t) {
  $("t_sal_low").value = t.sal_low ?? "";
  $("t_sal_high").value = t.sal_high ?? "";
  $("t_ph_low").value = t.ph_low ?? "";
  $("t_ph_high").value = t.ph_high ?? "";
  $("t_temp_low").value = t.temp_low ?? "";
  $("t_temp_high").value = t.temp_high ?? "";
  $("t_bat_low").value = t.bat_low ?? "";
  $("t_offline_minutes").value = t.offline_minutes ?? "";
}

async function loadThresholds() {
  const t = await apiFetch("/thresholds");
  fillForm(t || {});
}

function setupSave() {
  const form = $("thresholdForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      showMsg("Đang lưu...", true);
      const payload = getPayloadFromForm();
      const updated = await apiFetch("/thresholds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fillForm(updated);
      showMsg("✅ Lưu thành công. Hãy F5 các trang để áp dụng ngưỡng mới.", true);
    } catch (err) {
      showMsg(`❌ Lưu thất bại: ${err.message}`, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // cập nhật navbar Login/Logout
  renderAuthNav();

  // guard: chưa login -> chuyển sang login page
  if (!isAdminLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  try {
    await loadThresholds();
    setupSave();
  } catch (err) {
    showMsg(`❌ Không tải được thresholds: ${err.message}`, false);
  }
});
