import {
  clearAllData,
  deleteDay,
  deleteExchange,
  exportAllData,
  getAllDays,
  getAllExchanges,
  getDay,
  getExchange,
  getSettings,
  importAllData,
  saveExchange,
  setDay,
  setSettings,
} from "./db.js";
import {
  getAutonomousCommunities,
  getCommunityHolidays,
  getMunicipalitiesByCommunity,
  getMunicipalityHolidays,
  getSpanishNationalHolidays,
  isSunday,
  parseCustomHolidayList,
} from "./holidays.js";
import { calculateMonthPayroll } from "./salary.js";

const SHIFT_MAP = {
  3: [
    { id: "morning", label: "Mañana", hours: 7, nightHours: 0 },
    { id: "afternoon", label: "Tarde", hours: 7, nightHours: 0 },
    { id: "night", label: "Noche", hours: 10, nightHours: 10 },
    { id: "after", label: "Saliente", hours: 0, nightHours: 0 },
    { id: "off", label: "Libre", hours: 0, nightHours: 0 },
    { id: "vacation", label: "Vacaciones", hours: 0, nightHours: 0 },
  ],
  2: [
    { id: "day12", label: "Diurno", hours: 12, nightHours: 0 },
    { id: "night12", label: "Nocturno", hours: 12, nightHours: 12 },
    { id: "after", label: "Saliente", hours: 0, nightHours: 0 },
    { id: "off", label: "Libre", hours: 0, nightHours: 0 },
    { id: "vacation", label: "Vacaciones", hours: 0, nightHours: 0 },
  ],
};

const DEFAULT_SETTINGS = {
  shiftMode: 3,
  salaryBase: 0,
  hourHoliday: 0,
  hourHolidayNight: 0,
  hourSunday: 0,
  hourSundayNight: 0,
  hourNormalDay: 0,
  hourNormalNight: 0,
  mode2NightHours: 8,
  communityCode: "MD",
  municipalityCode: "madrid",
  animationMode: "on",
  themeMode: "light",
  customHolidays: "",
};

const state = {
  currentDate: new Date(),
  selectedDate: null,
  settings: { ...DEFAULT_SETTINGS },
  daysByDate: new Map(),
  exchangesByDate: new Map(),
  holidayCache: new Map(),
  communityHolidayCache: new Map(),
  municipalityHolidayCache: new Map(),
  customHolidaySet: new Set(),
  lastChangedDate: "",
};

const prefersReducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
const moneyFmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const refs = {
  monthLabel: document.getElementById("monthLabel"),
  weekdays: document.getElementById("weekdays"),
  calendarGrid: document.getElementById("calendarGrid"),
  monthSummary: document.getElementById("monthSummary"),
  payrollSummary: document.getElementById("payrollSummary"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  todayBtn: document.getElementById("todayBtn"),
  tabs: [...document.querySelectorAll(".tab-btn")],
  tabSections: [...document.querySelectorAll(".tab-content")],
  exchangesList: document.getElementById("exchangesList"),
  settingsForm: document.getElementById("settingsForm"),
  communityCodeInput: document.getElementById("communityCode"),
  municipalityCodeInput: document.getElementById("municipalityCode"),
  animationModeInput: document.getElementById("animationMode"),
  themeModeInput: document.getElementById("themeMode"),
  shiftModeInput: document.getElementById("shiftMode"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  clearBtn: document.getElementById("clearBtn"),
  dialog: document.getElementById("dayDialog"),
  dayForm: document.getElementById("dayForm"),
  dialogDateLabel: document.getElementById("dialogDateLabel"),
  dialogHolidayLabel: document.getElementById("dialogHolidayLabel"),
  dayShift: document.getElementById("dayShift"),
  dayNote: document.getElementById("dayNote"),
  deleteDayBtn: document.getElementById("deleteDayBtn"),
  cancelDialogBtn: document.getElementById("cancelDialogBtn"),
  exchangeEnabled: document.getElementById("exchangeEnabled"),
  exchangeFields: document.getElementById("exchangeFields"),
  exchangePeer: document.getElementById("exchangePeer"),
  exchangeNote: document.getElementById("exchangeNote"),
  exchangeStatus: document.getElementById("exchangeStatus"),
};

boot();

async function boot() {
  renderWeekdays();
  bindEvents();
  await hydrate();
  renderAll();
}

async function hydrate() {
  const [settingsSaved, dayRows, exchangeRows] = await Promise.all([
    getSettings(),
    getAllDays(),
    getAllExchanges(),
  ]);

  state.settings = { ...DEFAULT_SETTINGS, ...(settingsSaved || {}) };
  applyThemeMode(state.settings.themeMode);
  state.customHolidaySet = parseCustomHolidayList(state.settings.customHolidays);
  state.daysByDate = new Map(dayRows.map((x) => [x.date, x]));
  state.exchangesByDate = new Map(exchangeRows.map((x) => [x.date, x]));

  populateCommunitySelect();
  populateMunicipalitySelect(state.settings.communityCode, state.settings.municipalityCode);
  populateSettingsForm();
}

function bindEvents() {
  refs.prevMonthBtn.addEventListener("click", () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
    renderAll();
    animateMonthChange();
  });

  refs.nextMonthBtn.addEventListener("click", () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
    renderAll();
    animateMonthChange();
  });

  refs.todayBtn.addEventListener("click", () => {
    state.currentDate = new Date();
    renderAll();
    animateMonthChange();
  });

  refs.tabs.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  refs.exchangeEnabled.addEventListener("change", () => {
    refs.exchangeFields.classList.toggle("hidden", !refs.exchangeEnabled.checked);
  });

  refs.communityCodeInput.addEventListener("change", onCommunityChange);
  refs.exchangesList.addEventListener("click", onExchangeListClick);
  refs.dayForm.addEventListener("submit", onSaveDay);
  refs.deleteDayBtn.addEventListener("click", onDeleteDay);
  refs.cancelDialogBtn.addEventListener("click", closeDialogAnimated);
  refs.settingsForm.addEventListener("submit", onSaveSettings);
  refs.exportBtn.addEventListener("click", onExportData);
  refs.importFile.addEventListener("change", onImportData);
  refs.clearBtn.addEventListener("click", onClearAll);
}

function switchTab(tabId) {
  refs.tabSections.forEach((s) => s.classList.toggle("active", s.id === tabId));
  refs.tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  animateTab(tabId);
  if (tabId === "exchangesTab") renderExchanges();
}

function renderAll() {
  renderCalendar();
  renderExchanges();
  renderSummary();
}

function renderWeekdays() {
  const names = ["L", "M", "X", "J", "V", "S", "D"];
  refs.weekdays.innerHTML = "";
  for (const name of names) {
    const el = document.createElement("div");
    el.textContent = name;
    refs.weekdays.append(el);
  }
}

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  refs.monthLabel.textContent = state.currentDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7;
  const todayISO = toISO(new Date());

  refs.calendarGrid.innerHTML = "";
  for (let i = 0; i < totalCells; i += 1) {
    const date = new Date(year, month, i - offset + 1);
    const thisMonth = date.getMonth() === month;
    const dateISO = toISO(date);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    cell.dataset.date = dateISO;
    if (!thisMonth) cell.classList.add("outside");
    if (dateISO === todayISO) cell.classList.add("today");

    const dayData = state.daysByDate.get(dateISO);
    const holidayName = getHolidayName(dateISO);
    const shiftLabel = dayData ? getDisplayShiftLabel(dayData.shiftType) : "";
    const noteSnippet = dayData?.note ? dayData.note.slice(0, 24) : "";
    const sunday = isSunday(date);
    if (dayData?.shiftType) {
      cell.classList.add(`shift-${dayData.shiftType}`);
    }

    const compactBadge = isCompactCalendarView();
    const holidayText = compactBadge ? "F" : "Festivo";
    const sundayText = compactBadge ? "D" : "Dom";

    cell.innerHTML = `
      <div class="day-top">
        <span class="day-number">${date.getDate()}</span>
        ${holidayName ? `<span class="holiday-mark" title="${holidayName}">${holidayText}</span>` : sunday ? `<span class="sunday-mark">${sundayText}</span>` : ""}
      </div>
      ${shiftLabel ? `<div class="shift-pill">${shiftLabel}</div>` : ""}
      ${noteSnippet ? `<div class="note-snippet">${escapeHtml(noteSnippet)}</div>` : ""}
    `;

    cell.addEventListener("click", () => openDayDialog(dateISO));
    refs.calendarGrid.append(cell);
  }

  animateCalendarCells();
  if (state.lastChangedDate) {
    animateDayChanged(state.lastChangedDate);
    state.lastChangedDate = "";
  }
}

function renderSummary() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  let totalHours = 0;
  let nightHours = 0;
  let shifts = 0;

  for (const [date, record] of state.daysByDate) {
    const dt = new Date(`${date}T00:00:00`);
    if (dt.getFullYear() !== year || dt.getMonth() !== month) continue;
    const hours = getShiftHours(record.shiftType, state.settings.shiftMode);
    const shiftNightHours = getShiftNightHours(record.shiftType, state.settings.shiftMode);
    totalHours += hours;
    nightHours += shiftNightHours;
    if (hours > 0) shifts += 1;
  }

  refs.monthSummary.textContent = `Turnos trabajados: ${shifts} | Horas totales: ${totalHours} | Horas nocturnas estimadas: ${nightHours}`;

  const payroll = calculateMonthPayroll({
    year,
    month,
    dayRows: [...state.daysByDate.values()],
    settings: state.settings,
    getHolidayName,
  });
  renderPayrollSummary(payroll);
}

function renderPayrollSummary(payroll) {
  const b = payroll.breakdown;
  refs.payrollSummary.innerHTML = `
    <div class="payroll-main">
      <strong>Nomina estimada (beta)</strong>
      <span class="payroll-total">${moneyFmt.format(payroll.totalSalary)}</span>
    </div>
    <div class="payroll-sub">Base: ${moneyFmt.format(payroll.baseSalary)} | Variable turnos: ${moneyFmt.format(payroll.variableSalary)}</div>
    <div class="payroll-breakdown">
      ${payrollRowHtml("Normal", b.normal)}
      ${payrollRowHtml("Domingo", b.sunday)}
      ${payrollRowHtml("Festivo", b.holiday)}
    </div>
  `;
}

function payrollRowHtml(label, row) {
  return `<div class="payroll-row"><strong>${label}</strong><span>${row.dayHours}hD / ${row.nightHours}hN</span><span>${moneyFmt.format(row.amount)}</span></div>`;
}

function renderExchanges() {
  const rows = [...state.exchangesByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  refs.exchangesList.innerHTML = "";
  if (!rows.length) {
    refs.exchangesList.innerHTML = '<div class="exchange-card">No hay intercambios registrados.</div>';
    return;
  }

  for (const row of rows) {
    const item = document.createElement("article");
    item.className = "exchange-card";
    item.dataset.exchangeCardDate = row.date;
    item.innerHTML = `
      <div class="day-top">
        <strong>${formatDate(row.date)}</strong>
        <span class="exchange-status ${row.status}">${row.status}</span>
      </div>
      <div><strong>Compañero/a:</strong> ${escapeHtml(row.peer || "-")}</div>
      <div><strong>Turno:</strong> ${escapeHtml(getShiftLabel(row.shiftType) || "-")}</div>
      <div><strong>Detalle:</strong> ${escapeHtml(row.note || "-")}</div>
      <div class="exchange-actions">
        <button class="ghost-btn mini-btn ${row.status === "pendiente" ? "active" : ""}" data-exchange-date="${row.date}" data-exchange-status="pendiente" type="button">Pendiente</button>
        <button class="ghost-btn mini-btn ${row.status === "devuelto" ? "active" : ""}" data-exchange-date="${row.date}" data-exchange-status="devuelto" type="button">Devuelto</button>
      </div>
    `;
    refs.exchangesList.append(item);
  }
}

async function onExchangeListClick(event) {
  const button = event.target.closest("[data-exchange-date][data-exchange-status]");
  if (!button) return;
  const date = button.dataset.exchangeDate;
  const status = button.dataset.exchangeStatus;
  if (!date || !status) return;

  const row = state.exchangesByDate.get(date);
  if (!row || row.status === status) return;

  const updated = { ...row, status, updatedAt: new Date().toISOString() };
  await saveExchange(updated);
  state.exchangesByDate.set(date, updated);
  renderExchanges();
  animateExchangeUpdate(date);
}

async function openDayDialog(dateISO) {
  state.selectedDate = dateISO;
  const [dayData, exchangeData] = await Promise.all([getDay(dateISO), getExchange(dateISO)]);
  const holidayName = getHolidayName(dateISO);

  refs.dialogDateLabel.textContent = `${formatDate(dateISO)} (${dateISO})`;
  refs.dialogHolidayLabel.textContent = holidayName ? `Festivo: ${holidayName}` : "No festivo automatico";
  fillShiftSelect();
  refs.dayShift.value = dayData?.shiftType || "";
  refs.dayNote.value = dayData?.note || "";
  refs.exchangeEnabled.checked = Boolean(exchangeData);
  refs.exchangePeer.value = exchangeData?.peer || "";
  refs.exchangeNote.value = exchangeData?.note || "";
  refs.exchangeStatus.value = exchangeData?.status || "pendiente";
  refs.exchangeFields.classList.toggle("hidden", !refs.exchangeEnabled.checked);
  refs.dialog.showModal();
  animateDialogOpen();
}

function fillShiftSelect() {
  const mode = Number(state.settings.shiftMode || 3);
  const options = SHIFT_MAP[mode] || SHIFT_MAP[3];
  refs.dayShift.innerHTML = '<option value="">Sin asignar</option>';
  for (const item of options) {
    const op = document.createElement("option");
    op.value = item.id;
    op.textContent = `${item.label} (${item.hours}h)`;
    refs.dayShift.append(op);
  }
}

async function onSaveDay(event) {
  event.preventDefault();
  const date = state.selectedDate;
  if (!date) return;

  const shiftType = refs.dayShift.value;
  const note = refs.dayNote.value.trim();

  if (!shiftType && !note && !refs.exchangeEnabled.checked) {
    await deleteDay(date);
    await deleteExchange(date);
    state.daysByDate.delete(date);
    state.exchangesByDate.delete(date);
    refs.dialog.close();
    renderAll();
    return;
  }

  const dayRecord = { date, shiftType, note, updatedAt: new Date().toISOString() };
  await setDay(dayRecord);
  state.daysByDate.set(date, dayRecord);

  if (refs.exchangeEnabled.checked) {
    const exchange = {
      date,
      shiftType,
      peer: refs.exchangePeer.value.trim(),
      note: refs.exchangeNote.value.trim(),
      status: refs.exchangeStatus.value,
      updatedAt: new Date().toISOString(),
    };
    await saveExchange(exchange);
    state.exchangesByDate.set(date, exchange);
  } else {
    await deleteExchange(date);
    state.exchangesByDate.delete(date);
  }

  state.lastChangedDate = date;
  await closeDialogAnimated();
  renderAll();
}

async function onDeleteDay() {
  const date = state.selectedDate;
  if (!date) return;
  if (!window.confirm("Borrar turno, anotacion e intercambio de este dia?")) return;

  await deleteDay(date);
  await deleteExchange(date);
  state.daysByDate.delete(date);
  state.exchangesByDate.delete(date);
  state.lastChangedDate = date;
  await closeDialogAnimated();
  renderAll();
}

async function onSaveSettings(event) {
  event.preventDefault();
  const fd = new FormData(refs.settingsForm);

  const settings = {
    communityCode: String(fd.get("communityCode") || "MD"),
    municipalityCode: String(fd.get("municipalityCode") || ""),
    animationMode: String(fd.get("animationMode") || "on"),
    themeMode: String(fd.get("themeMode") || "light"),
    shiftMode: Number(fd.get("shiftMode") || 3),
    salaryBase: Number(fd.get("salaryBase") || 0),
    hourHoliday: Number(fd.get("hourHoliday") || 0),
    hourHolidayNight: Number(fd.get("hourHolidayNight") || 0),
    hourSunday: Number(fd.get("hourSunday") || 0),
    hourSundayNight: Number(fd.get("hourSundayNight") || 0),
    hourNormalDay: Number(fd.get("hourNormalDay") || 0),
    hourNormalNight: Number(fd.get("hourNormalNight") || 0),
    mode2NightHours: Number(fd.get("mode2NightHours") || 0),
    customHolidays: String(fd.get("customHolidays") || "").trim(),
  };

  state.settings = { ...DEFAULT_SETTINGS, ...settings };
  state.customHolidaySet = parseCustomHolidayList(state.settings.customHolidays);
  state.holidayCache.clear();
  state.communityHolidayCache.clear();
  state.municipalityHolidayCache.clear();
  await setSettings(state.settings);
  applyThemeMode(state.settings.themeMode);
  renderAll();
  animateSettingsSaved();
  alert("Configuracion guardada.");
}

function populateSettingsForm() {
  for (const [key, value] of Object.entries(state.settings)) {
    const field = refs.settingsForm.elements.namedItem(key);
    if (field) field.value = String(value ?? "");
  }
  refs.communityCodeInput.value = String(state.settings.communityCode || "MD");
  populateMunicipalitySelect(state.settings.communityCode, state.settings.municipalityCode);
  refs.shiftModeInput.value = String(state.settings.shiftMode || 3);
}

function populateCommunitySelect() {
  const communities = getAutonomousCommunities();
  refs.communityCodeInput.innerHTML = "";
  for (const community of communities) {
    const option = document.createElement("option");
    option.value = community.code;
    option.textContent = community.name;
    refs.communityCodeInput.append(option);
  }
}

function populateMunicipalitySelect(communityCode, selectedMunicipality = "") {
  const municipalities = getMunicipalitiesByCommunity(communityCode);
  refs.municipalityCodeInput.innerHTML = "";

  if (!municipalities.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin municipio";
    refs.municipalityCodeInput.append(option);
    refs.municipalityCodeInput.value = "";
    return;
  }

  for (const municipality of municipalities) {
    const option = document.createElement("option");
    option.value = municipality.id;
    option.textContent = municipality.name;
    refs.municipalityCodeInput.append(option);
  }

  const exists = municipalities.some((x) => x.id === selectedMunicipality);
  refs.municipalityCodeInput.value = exists ? selectedMunicipality : municipalities[0].id;
}

function onCommunityChange() {
  const selectedCommunity = refs.communityCodeInput.value;
  populateMunicipalitySelect(selectedCommunity, "");
}

async function onExportData() {
  const payload = await exportAllData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calendario-enfermeria-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function onImportData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    await importAllData(parsed);
    await hydrate();
    renderAll();
    alert("Importacion completada.");
  } catch (error) {
    console.error(error);
    alert("No se pudo importar el archivo JSON.");
  } finally {
    refs.importFile.value = "";
  }
}

async function onClearAll() {
  if (!window.confirm("Esto borrara todos los datos locales guardados. Continuar?")) return;
  await clearAllData();
  state.daysByDate.clear();
  state.exchangesByDate.clear();
  state.settings = { ...DEFAULT_SETTINGS };
  applyThemeMode(state.settings.themeMode);
  state.customHolidaySet = new Set();
  populateCommunitySelect();
  populateMunicipalitySelect(state.settings.communityCode, state.settings.municipalityCode);
  populateSettingsForm();
  state.holidayCache.clear();
  state.communityHolidayCache.clear();
  state.municipalityHolidayCache.clear();
  renderAll();
}

function getHolidayName(dateISO) {
  const year = Number(dateISO.slice(0, 4));
  const communityCode = state.settings.communityCode;
  const municipalityCode = state.settings.municipalityCode;

  if (state.customHolidaySet.has(dateISO)) return "Festivo personalizado";

  const municipalityKey = `${year}-${communityCode}-${municipalityCode}`;
  if (!state.municipalityHolidayCache.has(municipalityKey)) {
    state.municipalityHolidayCache.set(
      municipalityKey,
      getMunicipalityHolidays(year, communityCode, municipalityCode),
    );
  }
  const municipalityMap = state.municipalityHolidayCache.get(municipalityKey);
  const fromMunicipality = municipalityMap.get(dateISO);
  if (fromMunicipality) return fromMunicipality;

  const communityKey = `${year}-${communityCode}`;
  if (!state.communityHolidayCache.has(communityKey)) {
    state.communityHolidayCache.set(communityKey, getCommunityHolidays(year, communityCode));
  }
  const communityMap = state.communityHolidayCache.get(communityKey);
  const fromCommunity = communityMap.get(dateISO);
  if (fromCommunity) return fromCommunity;

  if (!state.holidayCache.has(year)) {
    state.holidayCache.set(year, getSpanishNationalHolidays(year));
  }
  const map = state.holidayCache.get(year);
  const fromNational = map.get(dateISO);
  if (fromNational) return fromNational;

  return "";
}

function getShiftLabel(shiftType) {
  const all = [...SHIFT_MAP[2], ...SHIFT_MAP[3]];
  return all.find((x) => x.id === shiftType)?.label || "";
}

function getDisplayShiftLabel(shiftType) {
  if (!shiftType) return "";
  if (!isCompactCalendarView()) return getShiftLabel(shiftType);

  const compactMap = {
    day12: "D",
    morning: "M",
    afternoon: "T",
    night12: "N",
    night: "N",
    after: "S",
    off: "L",
    vacation: "V",
  };
  return compactMap[shiftType] || getShiftLabel(shiftType);
}

function getShiftHours(shiftType, mode) {
  if (!shiftType) return 0;
  const list = SHIFT_MAP[Number(mode)] || SHIFT_MAP[3];
  return list.find((x) => x.id === shiftType)?.hours || 0;
}

function getShiftNightHours(shiftType, mode) {
  if (!shiftType) return 0;
  if (Number(mode) === 2 && shiftType === "night12") {
    return Number(state.settings.mode2NightHours || 0);
  }
  const list = SHIFT_MAP[Number(mode)] || SHIFT_MAP[3];
  return list.find((x) => x.id === shiftType)?.nightHours || 0;
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function animateCalendarCells() {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: ".day-cell",
    opacity: [0, 1],
    translateY: [14, 0],
    scale: [0.98, 1],
    delay: anime.stagger(12),
    duration: 300,
    easing: "easeOutCubic",
  });
}

function animateTab(tabId) {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: `#${tabId}`,
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 240,
    easing: "easeOutCubic",
  });
}

function animateDialogOpen() {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: "#dayForm",
    opacity: [0, 1],
    scale: [0.95, 1],
    translateY: [12, 0],
    duration: 220,
    easing: "easeOutCubic",
  });
}

function animateMonthChange() {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: "#monthLabel, #monthSummary",
    opacity: [0, 1],
    translateX: [8, 0],
    duration: 260,
    delay: anime.stagger(60),
    easing: "easeOutCubic",
  });
}

function animateDayChanged(dateISO) {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: `.day-cell[data-date="${dateISO}"]`,
    scale: [{ value: 1.04, duration: 120 }, { value: 1, duration: 180 }],
    boxShadow: [
      "0 0 0 rgba(16, 185, 129, 0)",
      "0 0 0 8px rgba(16, 185, 129, 0.18)",
      "0 0 0 rgba(16, 185, 129, 0)",
    ],
    easing: "easeOutCubic",
  });
}

function animateExchangeUpdate(dateISO) {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: `.exchange-card[data-exchange-card-date="${dateISO}"]`,
    translateX: [8, 0],
    opacity: [0.5, 1],
    duration: 220,
    easing: "easeOutCubic",
  });
}

function animateSettingsSaved() {
  const anime = getAnime();
  if (!anime || !isAnimationsEnabled()) return;
  anime({
    targets: ".settings-grid .primary-btn",
    scale: [{ value: 1.05, duration: 100 }, { value: 1, duration: 160 }],
    backgroundColor: ["#0f766e", "#14b8a6", "#0f766e"],
    easing: "easeOutCubic",
  });
}

async function closeDialogAnimated() {
  const anime = getAnime();
  if (!refs.dialog.open) return;
  if (!anime || !isAnimationsEnabled()) {
    refs.dialog.close();
    return;
  }

  await new Promise((resolve) => {
    anime({
      targets: "#dayForm",
      opacity: [1, 0],
      scale: [1, 0.97],
      translateY: [0, 10],
      duration: 150,
      easing: "easeInQuad",
      complete: resolve,
    });
  });
  refs.dialog.close();
  const dayForm = document.getElementById("dayForm");
  if (dayForm) {
    dayForm.style.opacity = "";
    dayForm.style.transform = "";
  }
}

function getAnime() {
  return globalThis.anime;
}

function isAnimationsEnabled() {
  const mode = state.settings.animationMode || "on";
  if (mode === "off") return false;
  if (mode === "auto") return !prefersReducedMotion;
  return true;
}

function isCompactCalendarView() {
  return globalThis.matchMedia?.("(max-width: 560px)")?.matches;
}

function applyThemeMode(themeMode) {
  const safeTheme = themeMode === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", safeTheme);
}
