import {
  getCommunityHolidays,
  getMunicipalityHolidays,
  getSpanishNationalHolidays,
} from "./holidays.js";
import { calculateMonthPayroll } from "./salary.js";

const resultsEl = document.getElementById("results");
const summaryEl = document.getElementById("summary");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function almostEqual(a, b, eps = 0.0001) {
  return Math.abs(a - b) <= eps;
}

test("Festivos 2026 contiene Año Nuevo y Viernes Santo", () => {
  const holidays = getSpanishNationalHolidays(2026);
  assert(holidays.get("2026-01-01") === "Año Nuevo", "No detecta Año Nuevo 2026.");
  assert(holidays.get("2026-04-03") === "Viernes Santo", "No detecta Viernes Santo 2026.");
});

test("Festivos CA y municipio se pueden resolver", () => {
  const madridCA = getCommunityHolidays(2026, "MD");
  const madridCity = getMunicipalityHolidays(2026, "MD", "madrid");
  assert(madridCA.get("2026-05-02"), "No detecta festivo de Comunidad de Madrid.");
  assert(madridCity.get("2026-05-15"), "No detecta festivo local de Madrid.");
});

test("Nomina normal: turno mañana 7h con tarifa diurna normal", () => {
  const res = calculateMonthPayroll({
    year: 2026,
    month: 2,
    dayRows: [{ date: "2026-03-10", shiftType: "morning" }],
    settings: {
      shiftMode: 3,
      mode2NightHours: 8,
      salaryBase: 1000,
      hourHoliday: 20,
      hourHolidayNight: 30,
      hourSunday: 18,
      hourSundayNight: 28,
      hourNormalDay: 10,
      hourNormalNight: 15,
    },
    getHolidayName: () => "",
  });

  assert(almostEqual(res.variableSalary, 70), "Variable incorrecta en turno mañana.");
  assert(almostEqual(res.totalSalary, 1070), "Total incorrecto con salario base.");
});

test("Nomina modo 2 nocturno con horas nocturnas configurables", () => {
  const res = calculateMonthPayroll({
    year: 2026,
    month: 2,
    dayRows: [{ date: "2026-03-11", shiftType: "night12" }],
    settings: {
      shiftMode: 2,
      mode2NightHours: 8,
      salaryBase: 0,
      hourHoliday: 20,
      hourHolidayNight: 30,
      hourSunday: 18,
      hourSundayNight: 28,
      hourNormalDay: 10,
      hourNormalNight: 20,
    },
    getHolidayName: () => "",
  });

  assert(almostEqual(res.totalHours, 12), "Total horas modo 2 incorrecto.");
  assert(almostEqual(res.totalNightHours, 8), "Horas nocturnas modo 2 incorrectas.");
  assert(almostEqual(res.variableSalary, 200), "Importe nocturno modo 2 incorrecto.");
});

test("Festivo tiene prioridad sobre domingo", () => {
  const res = calculateMonthPayroll({
    year: 2022,
    month: 11,
    dayRows: [{ date: "2022-12-25", shiftType: "morning" }],
    settings: {
      shiftMode: 3,
      mode2NightHours: 8,
      salaryBase: 0,
      hourHoliday: 15,
      hourHolidayNight: 25,
      hourSunday: 5,
      hourSundayNight: 9,
      hourNormalDay: 3,
      hourNormalNight: 6,
    },
    getHolidayName: (dateISO) => (dateISO === "2022-12-25" ? "Navidad" : ""),
  });

  assert(almostEqual(res.breakdown.holiday.amount, 105), "No aplica tarifa festivo en domingo-festivo.");
  assert(almostEqual(res.breakdown.sunday.amount, 0), "No debe imputar domingo si ya es festivo.");
});

function renderResult(name, ok, errorMessage = "") {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<strong class="${ok ? "ok" : "ko"}">${ok ? "PASS" : "FAIL"}</strong> - ${name}${ok ? "" : `<div class="ko">${errorMessage}</div>`}`;
  resultsEl.append(card);
}

async function run() {
  let pass = 0;
  for (const t of tests) {
    try {
      await t.fn();
      pass += 1;
      renderResult(t.name, true);
    } catch (error) {
      renderResult(t.name, false, error.message || String(error));
    }
  }

  const fail = tests.length - pass;
  summaryEl.innerHTML = `<strong>${pass}/${tests.length}</strong> pruebas OK${fail ? ` <span class="ko">(${fail} con error)</span>` : ' <span class="ok">(sin errores)</span>'}`;
}

run();
