import {
  addDaysUTC,
  clipPeriodsAfter,
  dateToLocalMinutes,
  dateToLocalTimeString,
  eachDayUTC,
  formatISODate,
  isSameLocalDay,
  minutesToTime,
  subtractTimeRange,
  timesOverlap,
  timeToMinutes,
} from './time.utils';

const SAO_PAULO = 'America/Sao_Paulo';

describe('time.utils', () => {
  describe('timeToMinutes / minutesToTime', () => {
    it.each([
      ['00:00', 0],
      ['08:30', 510],
      ['23:59', 1439],
    ])('%s <-> %i minutes', (time, minutes) => {
      expect(timeToMinutes(time)).toBe(minutes);
      expect(minutesToTime(minutes)).toBe(time);
    });
  });

  describe('timesOverlap', () => {
    it('detects overlapping ranges', () => {
      expect(timesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
      expect(timesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
    });

    it('treats touching ranges as free (end is exclusive)', () => {
      expect(timesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    });
  });

  describe('subtractTimeRange', () => {
    const workday = [{ startTime: '08:00', endTime: '18:00' }];

    it('splits a period when the range falls in the middle (e.g. lunch break)', () => {
      expect(subtractTimeRange(workday, '12:00', '13:00')).toEqual([
        { startTime: '08:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '18:00' },
      ]);
    });

    it('trims the start or the end', () => {
      expect(subtractTimeRange(workday, '07:00', '09:00')).toEqual([
        { startTime: '09:00', endTime: '18:00' },
      ]);
      expect(subtractTimeRange(workday, '17:30', '19:00')).toEqual([
        { startTime: '08:00', endTime: '17:30' },
      ]);
    });

    it('removes a fully covered period and keeps untouched ones', () => {
      const periods = [
        { startTime: '08:00', endTime: '10:00' },
        { startTime: '14:00', endTime: '16:00' },
      ];
      expect(subtractTimeRange(periods, '07:00', '11:00')).toEqual([
        { startTime: '14:00', endTime: '16:00' },
      ]);
    });
  });

  describe('clipPeriodsAfter', () => {
    it('drops past periods and trims the current one (hides past slots for today)', () => {
      const periods = [
        { startTime: '08:00', endTime: '10:00' },
        { startTime: '11:00', endTime: '13:00' },
        { startTime: '14:00', endTime: '18:00' },
      ];
      expect(clipPeriodsAfter(periods, '12:15')).toEqual([
        { startTime: '12:15', endTime: '13:00' },
        { startTime: '14:00', endTime: '18:00' },
      ]);
    });
  });

  describe('timezone-aware conversions', () => {
    it('converts a UTC instant to local wall-clock time', () => {
      const utc = new Date('2026-03-16T13:00:00.000Z');
      expect(dateToLocalTimeString(utc, SAO_PAULO)).toBe('10:00');
      expect(dateToLocalMinutes(utc, SAO_PAULO)).toBe(600);
    });

    it('compares calendar days in the local timezone, not in UTC', () => {
      const lateNightLocal = new Date('2026-03-17T01:30:00.000Z'); // 22:30 on the 16th in SP
      const morningLocal = new Date('2026-03-16T12:00:00.000Z');
      expect(isSameLocalDay(lateNightLocal, morningLocal, SAO_PAULO)).toBe(true);
    });
  });

  describe('UTC date helpers', () => {
    it('adds days and iterates an inclusive range', () => {
      const start = new Date('2026-03-30T00:00:00.000Z');
      expect(formatISODate(addDaysUTC(start, 3))).toBe('2026-04-02');
      expect([...eachDayUTC(start, addDaysUTC(start, 2))].map(formatISODate)).toEqual([
        '2026-03-30',
        '2026-03-31',
        '2026-04-01',
      ]);
    });
  });
});
