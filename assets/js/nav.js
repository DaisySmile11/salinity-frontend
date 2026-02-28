// assets/js/nav.js (module)
// Navbar mobile toggle + auth state (Login/Logout) + hide/show Admin link
import { isAdminLoggedIn, adminLogout, getAdminInfo } from "./auth.js";

function enforceCanonicalHost() {
  // Để localStorage không bị "mất" giữa www và non-www, ép dùng 1 host duy nhất.
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
  // đóng menu khi click link
  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function renderAuthNav() {
  const adminLink = document.getElementById("navAdmin");
  const authLink = document.getElementById("navAuth");

  const loggedIn = isAdminLoggedIn();
  const info = getAdminInfo();

  if (adminLink) adminLink.style.display = loggedIn ? "inline-block" : "none";

  if (!authLink) return;

  if (!loggedIn) {
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.onclick = null;
    document.body.classList.remove("is-admin");
  } else {
    authLink.textContent = `Logout (${info.email || "admin"})`;
    authLink.href = "#";
    authLink.onclick = (e) => {
      e.preventDefault();
      adminLogout();
      // sau logout quay về trang chủ
      window.location.href = "index.html";
    };
    document.body.classList.add("is-admin");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  enforceCanonicalHost();
  setupMobileToggle();
  renderAuthNav();
});

export { renderAuthNav };
