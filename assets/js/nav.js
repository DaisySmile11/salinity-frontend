// assets/js/nav.js (module)
// - Navbar mobile toggle
// - Hiển thị trạng thái Admin (Admin / Logout(email)) trên navbar

import { isAdminLoggedIn, adminLogout, getAdminInfo } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Mobile toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && e.target !== toggle) {
        nav.classList.remove("open");
      }
    });
  }

  renderAdminNav();
});

export function renderAdminNav() {
  // Navbar của bạn dùng link <a href="admin.html">Admin</a>
  const adminLink = document.querySelector('a[href="admin.html"]');
  if (!adminLink) return;

  if (isAdminLoggedIn()) {
    const info = getAdminInfo();
    adminLink.textContent = `Logout (${info.email || "admin"})`;
    adminLink.href = "#";
    adminLink.onclick = (e) => {
      e.preventDefault();
      adminLogout();
      // refresh để cập nhật UI ngay
      window.location.href = "index.html";
    };
    document.body.classList.add("is-admin");
  } else {
    adminLink.textContent = "Admin";
    adminLink.href = "admin.html";
    adminLink.onclick = null;
    document.body.classList.remove("is-admin");
  }
}
