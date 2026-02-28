// assets/js/login.js (module)
// Trang Login: đăng nhập admin qua backend, lưu token vào localStorage
import { API_BASE } from "./config.js";
import { setAdminSession, isAdminLoggedIn } from "./auth.js";
import { renderAuthNav } from "./nav.js";

const $ = (id) => document.getElementById(id);

function showMsg(msg, ok = true) {
  const el = $("loginMsg");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("ok", ok);
  el.classList.toggle("err", !ok);
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  renderAuthNav();

  // đã login rồi -> về trang chủ
  if (isAdminLoggedIn()) {
    window.location.href = "/";
    return;
  }

  const form = $("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("loginEmail")?.value?.trim();
    const password = $("loginPassword")?.value;

    try {
      showMsg("Đang đăng nhập...", true);
      const data = await login(email, password);
      setAdminSession(data.token, data.admin);
      showMsg("✅ Đăng nhập thành công!", true);
      // về trang chủ (navbar sẽ hiện Admin + Logout)
      window.location.href = "/";
    } catch (err) {
      showMsg(`❌ ${err.message}`, false);
    }
  });
});
