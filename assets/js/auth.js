// assets/js/auth.js
// Persist admin session across pages AND across subdomains (www/non-www) using cookie fallback.

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // Use domain=.salinity.site so it works on both www.salinity.site and salinity.site.
  // On localhost, the domain attribute is ignored by browsers, so this is safe.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=.salinity.site; SameSite=Lax${secure}`;
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : "";
}

function clearCookie(name) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.salinity.site; SameSite=Lax${secure}`;
}

export function getAdminToken() {
  return localStorage.getItem("adminToken") || getCookie("adminToken") || "";
}

export function isAdminLoggedIn() {
  return !!getAdminToken();
}

export function adminLogout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminInfo");
  clearCookie("adminToken");
  clearCookie("adminInfo");
}

export function setAdminSession(token, admin) {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminInfo", JSON.stringify(admin || {}));
  setCookie("adminToken", token);
  setCookie("adminInfo", JSON.stringify(admin || {}));
}

export function getAdminInfo() {
  const raw = localStorage.getItem("adminInfo") || getCookie("adminInfo") || "{}";
  try { return JSON.parse(raw); }
  catch { return {}; }
}
