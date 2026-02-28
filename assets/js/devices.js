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
  THRESHOLDS,
  safeNum,
  fmtDateTime,
  getDeviceMeta,
  deviceRowClassFromLatest,
  deviceStatusTextFromLatest,
  loadThresholdsFromApi,
} from "./data.js";

import { isAdminLoggedIn } from "./auth.js";
import { renderAuthNav } from "./nav.js";


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



function updateThresholdNote() {
  // tương thích cả bản cũ (note-inline) và bản mới (spans)
  const note = document.querySelector(".note-card .note-inline");
  if (note) {
    note.innerHTML = `
      <strong>Ngưỡng đánh giá trạng thái thiết bị:</strong><br />
      Độ mặn: ${THRESHOLDS.SAL_LOW}‰ - ${THRESHOLDS.SAL_HIGH}‰.<br />
      pH: ${THRESHOLDS.PH_LOW} - ${THRESHOLDS.PH_HIGH}.<br />
      Nhiệt độ: ${THRESHOLDS.TEMP_LOW}°C - ${THRESHOLDS.TEMP_HIGH}°C.<br />
      Pin: > ${THRESHOLDS.BAT_LOW}%.
    `;
  }
  updateThresholdText();
}

async async function renderTable() {
  const tbody = $("deviceTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10">Đang tải…</td></tr>`;

  const ids = await listDeviceIds();
  const latestList = await Promise.all(ids.map(async (id) => [id, await fetchLatest(id)]));

  // dùng cho Export CSV
  currentRows = latestList.map(([id, latest]) => {
    const meta = getDeviceMeta(id);
    const sal = safeNum(latest?.salinity ?? latest?.sal ?? latest?.avgSalinity);
    const ph = safeNum(latest?.ph ?? latest?.avgPH);
    const temp = safeNum(latest?.temperature ?? latest?.temp ?? latest?.avgTemp);
    const volt = safeNum(latest?.batteryVolt ?? latest?.avgVoltage ?? latest?.voltage);
    const batPct = safeNum(latest?.batteryPct ?? latest?.batteryPercent ?? latest?.battery);
    const updatedAt = latest?.updatedAt ?? latest?.timestamp ?? latest?.measuredAt ?? latest?.time;
    return {
      deviceId: id,
      displayName: meta?.name || id,
      location: (meta?.lat != null && meta?.lng != null) ? (meta.lat + ", " + meta.lng) : (meta?.location || "—"),
      salinity: sal ?? "",
      temp: temp ?? "",
      ph: ph ?? "",
      batteryPct: batPct ?? "",
      batteryVolt: volt ?? "",
      statusText: deviceStatusTextFromLatest(latest),
      updatedAtText: fmtDateTime(updatedAt) || "",
    };
  });

  tbody.innerHTML = "";
  latestList.forEach(([id, latest]) => {
    tbody.appendChild(buildRow(id, latest));
  });

  if (!latestList.length) {
    tbody.innerHTML = `<tr><td colspan="10">Không có thiết bị.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderAuthNav();
  // Load global thresholds from your backend
  try { await loadThresholdsFromApi(); } catch (e) { console.warn(e); }
  updateThresholdNote();

  await renderTable();

  // Export CSV (chỉ hiện khi admin login)
  const exportBtn = document.getElementById("devicesExportBtn");
  if (exportBtn) {
    exportBtn.style.display = isAdminLoggedIn() ? "inline-block" : "none";
    exportBtn.onclick = () => {
      const csv = rowsToCsv(currentRows);
      downloadCsv(csv, `devices-${Date.now()}.csv`);
    };
  }


  // Auto refresh every 60s
  setInterval(renderTable, 60 * 1000);
})

function updateThresholdText() {
  const sal = document.getElementById("th_sal");
  const ph = document.getElementById("th_ph");
  const temp = document.getElementById("th_temp");
  const bat = document.getElementById("th_bat");

  if (sal) sal.textContent = `${THRESHOLDS.SAL_LOW}‰ - ${THRESHOLDS.SAL_HIGH}‰`;
  if (ph) ph.textContent = `${THRESHOLDS.PH_LOW} - ${THRESHOLDS.PH_HIGH}`;
  if (temp) temp.textContent = `${THRESHOLDS.TEMP_LOW}°C - ${THRESHOLDS.TEMP_HIGH}°C`;
  if (bat) bat.textContent = `> ${THRESHOLDS.BAT_LOW}%`;
}

function rowsToCsv(rows) {
  const header = ["device_id","display_name","location","salinity","temp","ph","battery_pct","battery_volt","status","updated_at"];
  const lines = [header.join(",")];

  for (const r of rows) {
    const line = [
      r.deviceId ?? "",
      r.displayName ?? "",
      r.location ?? "",
      r.salinity ?? "",
      r.temp ?? "",
      r.ph ?? "",
      r.batteryPct ?? "",
      r.batteryVolt ?? "",
      r.statusText ?? "",
      r.updatedAtText ?? ""
    ].map(v => `"${String(v).replaceAll('"','""')}"`).join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

;