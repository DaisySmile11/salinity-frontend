// Navbar mobile toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && e.target !== toggle) {
      nav.classList.remove("open");
    }
  });
});

import { isAdminLoggedIn, adminLogout, getAdminInfo } from "./auth.js";

export function renderAdminNav() {
  const adminLink = document.querySelector('a[href="admin.html"]');
  if (!adminLink) return;

  if (isAdminLoggedIn()) {
    const info = getAdminInfo();
    adminLink.textContent = `Logout (${info.email || "admin"})`;
    adminLink.href = "#";
    adminLink.onclick = (e) => {
      e.preventDefault();
      adminLogout();
      location.href = "index.html";
    };
    document.body.classList.add("is-admin");
  } else {
    adminLink.textContent = "Admin";
    adminLink.href = "admin.html";
    adminLink.onclick = null;
    document.body.classList.remove("is-admin");
  }
}

renderAdminNav();