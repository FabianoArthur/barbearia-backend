export interface TimePeriod {
  startTime: string;
  endTime: string;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * @deprecated Use dateToLocalTimeString instead — this returns UTC time
 * which mismatches with working hours stored in local time.
 */
export function dateToTimeString(date: Date): string {
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Returns the application timezone from the APP_TIMEZONE env var,
 * defaulting to America/Sao_Paulo.
 */
export function getAppTimezone(): string {
  return process.env.APP_TIMEZONE ?? DEFAULT_TIMEZONE;
}

/**
 * Converts a UTC Date to an HH:mm string in the given IANA timezone.
 * This must be used instead of dateToTimeString when comparing
 * appointment DateTimes against working hour time strings.
 */
export function dateToLocalTimeString(date: Date, timeZone?: string): string {
  const tz = timeZone ?? getAppTimezone();
  return date.toLocaleTimeString('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Converts a UTC Date to total minutes since midnight in the given timezone.
 */
export function dateToLocalMinutes(date: Date, timeZone?: string): number {
  return timeToMinutes(dateToLocalTimeString(date, timeZone));
}

export function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

/**
 * Subtracts a time range from a list of periods.
 * Handles splitting periods when the range falls in the middle.
 */
export function subtractTimeRange(
  periods: TimePeriod[],
  removeStart: string,
  removeEnd: string,
): TimePeriod[] {
  const result: TimePeriod[] = [];
  const rStart = timeToMinutes(removeStart);
  const rEnd = timeToMinutes(removeEnd);

  for (const period of periods) {
    const pStart = timeToMinutes(period.startTime);
    const pEnd = timeToMinutes(period.endTime);

    if (rStart >= pEnd || rEnd <= pStart) {
      result.push(period);
      continue;
    }

    if (pStart < rStart) {
      result.push({ startTime: period.startTime, endTime: minutesToTime(rStart) });
    }
    if (pEnd > rEnd) {
      result.push({ startTime: minutesToTime(rEnd), endTime: period.endTime });
    }
  }

  return result;
}

/**
 * Clips periods to only include time after the given cutoff.
 * Periods entirely before cutoff are removed; partially before are trimmed.
 */
export function clipPeriodsAfter(periods: TimePeriod[], afterTime: string): TimePeriod[] {
  const afterMinutes = timeToMinutes(afterTime);
  const result: TimePeriod[] = [];

  for (const period of periods) {
    const pEnd = timeToMinutes(period.endTime);

    if (pEnd <= afterMinutes) {
      continue;
    }

    const pStart = timeToMinutes(period.startTime);

    if (pStart >= afterMinutes) {
      result.push(period);
    } else {
      result.push({ startTime: minutesToTime(afterMinutes), endTime: period.endTime });
    }
  }

  return result;
}

export function isSameUTCDay(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

/**
 * Checks if two Dates fall on the same calendar day in the given timezone.
 */
export function isSameLocalDay(d1: Date, d2: Date, timeZone?: string): boolean {
  const tz = timeZone ?? getAppTimezone();
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD
  return fmt(d1) === fmt(d2);
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for a Date in the given timezone.
 */
export function formatLocalDate(date: Date, timeZone?: string): string {
  const tz = timeZone ?? getAppTimezone();
  return date.toLocaleDateString('en-CA', { timeZone: tz });
}

export function toUTCDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDaysUTC(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function* eachDayUTC(start: Date, end: Date): Generator<Date> {
  const current = new Date(start);
  while (current <= end) {
    yield new Date(current);
    current.setUTCDate(current.getUTCDate() + 1);
  }
}
