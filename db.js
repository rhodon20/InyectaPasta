const DB_NAME = "nurseCalendarDB";
const DB_VERSION = 1;
const DAY_STORE = "days";
const SETTINGS_STORE = "settings";
const EXCHANGE_STORE = "exchanges";

let dbPromise;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DAY_STORE)) {
        db.createObjectStore(DAY_STORE, { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(EXCHANGE_STORE)) {
        db.createObjectStore(EXCHANGE_STORE, { keyPath: "date" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

async function withStore(storeName, mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = action(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDay(date) {
  return withStore(DAY_STORE, "readonly", (store) => reqToPromise(store.get(date)));
}

export async function setDay(dayData) {
  return withStore(DAY_STORE, "readwrite", (store) => reqToPromise(store.put(dayData)));
}

export async function deleteDay(date) {
  return withStore(DAY_STORE, "readwrite", (store) => reqToPromise(store.delete(date)));
}

export async function getAllDays() {
  return withStore(DAY_STORE, "readonly", (store) => reqToPromise(store.getAll()));
}

export async function getSettings() {
  const row = await withStore(SETTINGS_STORE, "readonly", (store) => reqToPromise(store.get("app")));
  return row?.value ?? null;
}

export async function setSettings(settings) {
  return withStore(SETTINGS_STORE, "readwrite", (store) => reqToPromise(store.put({ key: "app", value: settings })));
}

export async function saveExchange(exchange) {
  return withStore(EXCHANGE_STORE, "readwrite", (store) => reqToPromise(store.put(exchange)));
}

export async function deleteExchange(date) {
  return withStore(EXCHANGE_STORE, "readwrite", (store) => reqToPromise(store.delete(date)));
}

export async function getExchange(date) {
  return withStore(EXCHANGE_STORE, "readonly", (store) => reqToPromise(store.get(date)));
}

export async function getAllExchanges() {
  return withStore(EXCHANGE_STORE, "readonly", (store) => reqToPromise(store.getAll()));
}

export async function exportAllData() {
  const [days, settings, exchanges] = await Promise.all([
    getAllDays(),
    getSettings(),
    getAllExchanges(),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    days,
    settings,
    exchanges,
  };
}

export async function importAllData(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Formato de importación inválido.");
  }

  const days = Array.isArray(payload.days) ? payload.days : [];
  const exchanges = Array.isArray(payload.exchanges) ? payload.exchanges : [];
  const settings = payload.settings && typeof payload.settings === "object" ? payload.settings : null;

  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction([DAY_STORE, EXCHANGE_STORE, SETTINGS_STORE], "readwrite");
    const dayStore = tx.objectStore(DAY_STORE);
    const exchangeStore = tx.objectStore(EXCHANGE_STORE);
    const settingsStore = tx.objectStore(SETTINGS_STORE);

    dayStore.clear();
    exchangeStore.clear();
    settingsStore.clear();

    for (const day of days) {
      dayStore.put(day);
    }

    for (const exchange of exchanges) {
      exchangeStore.put(exchange);
    }

    if (settings) {
      settingsStore.put({ key: "app", value: settings });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function clearAllData() {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction([DAY_STORE, EXCHANGE_STORE, SETTINGS_STORE], "readwrite");
    tx.objectStore(DAY_STORE).clear();
    tx.objectStore(EXCHANGE_STORE).clear();
    tx.objectStore(SETTINGS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
