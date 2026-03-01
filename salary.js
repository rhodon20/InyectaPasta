const SHIFT_HOURS = {
  3: {
    morning: { total: 7, night: 0 },
    afternoon: { total: 7, night: 0 },
    night: { total: 10, night: 10 },
    after: { total: 0, night: 0 },
    off: { total: 0, night: 0 },
    vacation: { total: 0, night: 0 },
  },
  2: {
    day12: { total: 12, night: 0 },
    night12: { total: 12, night: null },
    after: { total: 0, night: 0 },
    off: { total: 0, night: 0 },
    vacation: { total: 0, night: 0 },
  },
};

function dayKindFromDate(dateISO, getHolidayName) {
  const holidayName = getHolidayName(dateISO);
  if (holidayName) return "holiday";
  const dt = new Date(`${dateISO}T00:00:00`);
  return dt.getDay() === 0 ? "sunday" : "normal";
}

function getShiftHours(shiftMode, shiftType, mode2NightHours) {
  const modeData = SHIFT_HOURS[Number(shiftMode)] || SHIFT_HOURS[3];
  const entry = modeData[shiftType];
  if (!entry) return { total: 0, night: 0, day: 0 };

  const total = Number(entry.total) || 0;
  let night = Number(entry.night) || 0;
  if (Number(shiftMode) === 2 && shiftType === "night12") {
    night = Number(mode2NightHours) || 0;
  }

  if (night < 0) night = 0;
  if (night > total) night = total;
  return { total, night, day: total - night };
}

function getRatesByKind(settings, kind) {
  if (kind === "holiday") {
    return {
      day: Number(settings.hourHoliday) || 0,
      night: Number(settings.hourHolidayNight) || 0,
    };
  }
  if (kind === "sunday") {
    return {
      day: Number(settings.hourSunday) || 0,
      night: Number(settings.hourSundayNight) || 0,
    };
  }
  return {
    day: Number(settings.hourNormalDay) || 0,
    night: Number(settings.hourNormalNight) || 0,
  };
}

function createBucket() {
  return { dayHours: 0, nightHours: 0, amount: 0 };
}

export function calculateMonthPayroll({ year, month, dayRows, settings, getHolidayName }) {
  const bucket = {
    normal: createBucket(),
    sunday: createBucket(),
    holiday: createBucket(),
  };

  let workedShifts = 0;
  let totalHours = 0;
  let totalNightHours = 0;

  for (const row of dayRows || []) {
    if (!row?.date) continue;
    const dt = new Date(`${row.date}T00:00:00`);
    if (dt.getFullYear() !== year || dt.getMonth() !== month) continue;

    const hours = getShiftHours(settings.shiftMode, row.shiftType, settings.mode2NightHours);
    if (hours.total <= 0) continue;

    const kind = dayKindFromDate(row.date, getHolidayName);
    const rates = getRatesByKind(settings, kind);
    const amount = hours.day * rates.day + hours.night * rates.night;

    bucket[kind].dayHours += hours.day;
    bucket[kind].nightHours += hours.night;
    bucket[kind].amount += amount;

    workedShifts += 1;
    totalHours += hours.total;
    totalNightHours += hours.night;
  }

  const variableSalary = bucket.normal.amount + bucket.sunday.amount + bucket.holiday.amount;
  const baseSalary = Number(settings.salaryBase) || 0;
  const totalSalary = baseSalary + variableSalary;

  return {
    workedShifts,
    totalHours,
    totalNightHours,
    baseSalary,
    variableSalary,
    totalSalary,
    breakdown: bucket,
  };
}
