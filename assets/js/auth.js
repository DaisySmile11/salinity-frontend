export function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

export function isAdminLoggedIn() {
  return !!getAdminToken();
}

export function adminLogout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminInfo");
}

export function setAdminSession(token, admin) {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminInfo", JSON.stringify(admin || {}));
}

export function getAdminInfo() {
  try { return JSON.parse(localStorage.getItem("adminInfo") || "{}"); }
  catch { return {}; }
}