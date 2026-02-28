// assets/js/devices.js
// Danh sách thiết bị (devices.html)

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

let currentRows = [];

async function listDeviceIds() {
  const q = query(collection(db, "devices"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id).filter(Boolean);
}

async function fetchLatest(deviceId) {
  const ref = doc(db, "devices", deviceId, "stats", "latest");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
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
    <td class="col-location">${(meta?.lat != null && meta?.lng != null) ? (meta.lat + ", " + meta.lng) : (meta?.location || "—")}</td>
    <td>${sal ?? "—"}</td>
    <td>${temp ?? "—"}</td>
    <td>${ph ?? "—"}</td>
    <td>${batPct ?? "—"}</td>
    <td class="col-voltage">${volt ?? "—"}</td>
    <td>${deviceStatusTextFromLatest(latest)}</td>
    <td>${fmtDateTime(updatedAt) || "—"}</td>
  `;

  tr.style.cursor = "pointer";
  tr.addEventListener("click", () => {
    window.location.href = `device.html?device=${encodeURIComponent(deviceId)}`;
  });

  return tr;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateThresholdNote() {
  setText("thrSalLow", `${THRESHOLDS.SAL_LOW}`);
  setText("thrSalHigh", `${THRESHOLDS.SAL_HIGH}`);
  setText("thrPhLow", `${THRESHOLDS.PH_LOW}`);
  setText("thrPhHigh", `${THRESHOLDS.PH_HIGH}`);
  setText("thrTempLow", `${THRESHOLDS.TEMP_LOW}`);
  setText("thrTempHigh", `${THRESHOLDS.TEMP_HIGH}`);
  setText("thrBatLow", `${THRESHOLDS.BAT_LOW}`);
}

function toCsvValue(v) {
  const s = (v ?? "").toString().replaceAll('"', '""');
  return `"${s}"`;
}

function exportDevicesCsv() {
  const header = ["deviceId","displayName","location","salinity","temp","ph","batteryPct","batteryVolt","status","updatedAt"];
  const lines = [header.join(",")];

  for (const r of currentRows) {
    lines.push([
      toCsvValue(r.deviceId),
      toCsvValue(r.displayName),
      toCsvValue(r.location),
      toCsvValue(r.salinity),
      toCsvValue(r.temp),
      toCsvValue(r.ph),
      toCsvValue(r.batteryPct),
      toCsvValue(r.batteryVolt),
      toCsvValue(r.statusText),
      // ✅ format datetime human readable
      toCsvValue(fmtDateTime(r.updatedAt) || "")
    ].join(","));
  }

  const csv = lines.join("\n");
  const blob = new Blob(["﻿"+csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devices-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function renderTable() {
  const tbody = $("deviceTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10">Đang tải…</td></tr>`;

  let ids = [];
  try {
    ids = await listDeviceIds();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="10">Không thể tải danh sách thiết bị.</td></tr>`;
    return;
  }

  const latestList = await Promise.all(ids.map(async (id) => {
    try {
      return [id, await fetchLatest(id)];
    } catch {
      return [id, null];
    }
  }));

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
      updatedAt,
    };
  });

  tbody.innerHTML = "";

  if (!latestList.length) {
    tbody.innerHTML = `<tr><td colspan="10">Chưa có thiết bị nào.</td></tr>`;
    return;
  }

  for (const [id, latest] of latestList) {
    tbody.appendChild(buildRow(id, latest));
  }
}

function setupExportButton() {
  const btn = $("devicesExportBtn");
  if (!btn) return;
  btn.style.display = isAdminLoggedIn() ? "inline-flex" : "none";
  btn.onclick = (e) => {
    e.preventDefault();
    exportDevicesCsv();
  };
}

async function init() {
  renderAuthNav();

  // load thresholds from backend; if fail, still render with default thresholds
  try { await loadThresholdsFromApi(); } catch {}
  updateThresholdNote();

  await renderTable();
  setupExportButton();
}

document.addEventListener("DOMContentLoaded", init);
