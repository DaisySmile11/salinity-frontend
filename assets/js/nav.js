// assets/js/nav.js (module)
// Navbar mobile toggle + auth state (Đăng nhập / Đăng xuất) + hide/show Admin link
import { isAdminLoggedIn, adminLogout, getAdminInfo } from "./auth.js";

function enforceCanonicalHost() {
  // Prefer non-www to avoid localStorage split. If user hits www, redirect to root.
  const h = window.location.hostname;
  if (h === "www.salinity.site") {
    const url = new URL(window.location.href);
    url.hostname = "salinity.site";
    window.location.replace(url.toString());
  }
}

function setupMobileToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
}


function setActiveNav() {
  const navDevices = document.getElementById("navDevices");
  const navAdmin = document.getElementById("navAdmin");

  // clear
  [navDevices, navAdmin].forEach(el => el && el.classList.remove("active"));

  const p = window.location.pathname.toLowerCase();
  if (p.endsWith("/devices.html")) {
    navDevices && navDevices.classList.add("active");
  } else if (p.endsWith("/admin.html")) {
    navAdmin && navAdmin.classList.add("active");
  }
}

export function renderAuthNav() {
  const adminLink = document.getElementById("navAdmin");
  const loginLink = document.getElementById("navLogin");
  const userLink = document.getElementById("navUserEmail");
  const logoutBtn = document.getElementById("navLogoutBtn");

  const loggedIn = isAdminLoggedIn();
  const info = getAdminInfo();

  if (adminLink) adminLink.style.display = loggedIn ? "inline-block" : "none";

  if (!loginLink || !userLink || !logoutBtn) return;

  if (!loggedIn) {
    loginLink.style.display = "inline-block";
    userLink.style.display = "none";
    logoutBtn.style.display = "none";
    document.body.classList.remove("is-admin");
  } else {
    loginLink.style.display = "none";
    userLink.style.display = "inline-block";
    userLink.textContent = info.email || "admin";
    logoutBtn.style.display = "inline-block";
    document.body.classList.add("is-admin");

    logoutBtn.onclick = (e) => {
      e.preventDefault();
      const ok = window.confirm("Bạn chắc chắn muốn đăng xuất chứ?");
      if (!ok) return;
      adminLogout();
      window.location.href = "/";
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  enforceCanonicalHost();
  setupMobileToggle();
  setActiveNav();
  renderAuthNav();
});
