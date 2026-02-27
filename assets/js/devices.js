// assets/js/devices.js
// Devices list page (devices.html)
// - List devices from Firestore
// - Read latest for each device
// - Row color based on thresholds (loaded from backend API)

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  db,
  safeNum,
  fmtDateTime,
  getDeviceMeta,
  deviceRowClassFromLatest,
  deviceStatusTextFromLatest,
  loadThresholdsFromApi,
} from "./data.js";

const $ = (id) => document.getElementById(id);

async function listDeviceIds() {
  const q = query(collection(db, "devices"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id).filter(Boolean);
}

async function fetchLatest(deviceId) {
  try {
    const ref = doc(db, "devices", deviceId, "stats", "latest");
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("fetchLatest failed:", deviceId, e);
    return null;
  }
}

function buildRow(deviceId, latest) {
  const meta = getDeviceMeta(deviceId);
  const sal = safeNum(latest?.salinity ?? latest?.sal ?? latest?.avgSalinity);
  const ph = safeNum(latest?.ph ?? latest?.avgPH);
  const temp = safeNum(latest?.temperature ?? latest?.temp ?? latest?.avgTemp);
  const volt = safeNum(latest?.batteryVolt ?? latest?.avgVoltage ?? latest?.voltage);
  const batPct = safeNum(latest?.batteryPct ?? latest?.batteryPercent ?? latest?.battery);

  const updatedAt = latest?.updatedAt ?? latest?.timestamp ?? latest?.measuredAt ?? latest?.time;

  const tr = document.createElement("tr");
  tr.className = deviceRowClassFromLatest(latest);

  tr.innerHTML = `
    <td>${deviceId}</td>
    <td>${meta?.name || deviceId}</td>
    <td>${(meta?.lat != null && meta?.lng != null) ? (meta.lat + ", " + meta.lng) : (meta?.location || "—")}</td>
    <td>${sal ?? "—"}</td>
    <td>${temp ?? "—"}</td>
    <td>${ph ?? "—"}</td>
    <td>${batPct ?? "—"}</td>
    <td>${volt ?? "—"}</td>
    <td>${deviceStatusTextFromLatest(latest)}</td>
    <td>${fmtDateTime(updatedAt) || "—"}</td>
  `;

  tr.style.cursor = "pointer";
  tr.addEventListener("click", () => {
    window.location.href = `device.html?device=${encodeURIComponent(deviceId)}`;
  });

  return tr;
}

async function renderTable() {
  const tbody = $("deviceTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10">Đang tải…</td></tr>`;

  const ids = await listDeviceIds();
  const latestList = await Promise.all(ids.map(async (id) => [id, await fetchLatest(id)]));

  tbody.innerHTML = "";
  latestList.forEach(([id, latest]) => {
    tbody.appendChild(buildRow(id, latest));
  });

  if (!latestList.length) {
    tbody.innerHTML = `<tr><td colspan="10">Không có thiết bị.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Load global thresholds from your backend
  try { await loadThresholdsFromApi(); } catch (e) { console.warn(e); }

  await renderTable();

  // Auto refresh every 60s
  setInterval(renderTable, 60 * 1000);
});