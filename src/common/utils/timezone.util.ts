/**
 * Timezone Utility Module
 *
 * Enforces America/Toronto (IANA) as the single source of truth for all
 * user-facing inputs and outputs. This remains consistent regardless of
 * database, application servers, background jobs, or cloud infrastructure
 * time zones.
 *
 * @module timezone.util
 */

/**
 * The canonical timezone for all business operations
 */
export const RESTAURANT_TIMEZONE = "America/Toronto";

/**
 * Days of the week in order (Sunday = 0)
 */
export const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type DayName = (typeof DAYS_OF_WEEK)[number];

/**
 * Get the current date/time in Toronto timezone
 */
export function getNowInToronto(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: RESTAURANT_TIMEZONE }),
  );
}

/**
 * Get the current day of week name in Toronto timezone
 */
export function getCurrentDayInToronto(): DayName {
  const now = getNowInToronto();
  return DAYS_OF_WEEK[now.getDay()];
}

/**
 * Get current time as HH:MM:SS string in Toronto timezone
 */
export function getCurrentTimeStringInToronto(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-CA", {
    timeZone: RESTAURANT_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get current time as HH:MM string in Toronto timezone
 */
export function getCurrentTimeHHMMInToronto(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-CA", {
    timeZone: RESTAURANT_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a Date to Toronto timezone ISO string
 */
export function toTorontoISOString(date: Date): string {
  return date.toLocaleString("sv-SE", { timeZone: RESTAURANT_TIMEZONE });
}

/**
 * Get the start of today in Toronto timezone (midnight)
 */
export function getStartOfTodayInToronto(): Date {
  const now = getNowInToronto();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Get the end of today in Toronto timezone (23:59:59.999)
 */
export function getEndOfTodayInToronto(): Date {
  const now = getNowInToronto();
  now.setHours(23, 59, 59, 999);
  return now;
}

/**
 * Check if a given time string (HH:MM or HH:MM:SS) is before another
 */
export function isTimeBefore(time1: string, time2: string): boolean {
  const normalize = (t: string) => (t.length === 5 ? `${t}:00` : t);
  return normalize(time1) < normalize(time2);
}

/**
 * Check if a given time string is between two times (handles midnight crossover)
 */
export function isTimeBetween(
  current: string,
  start: string,
  end: string,
): boolean {
  const normalize = (t: string) => (t.length === 5 ? `${t}:00` : t);
  const currentNorm = normalize(current);
  const startNorm = normalize(start);
  const endNorm = normalize(end);

  // Handle overnight span (e.g., 22:00 to 02:00)
  if (endNorm < startNorm) {
    return currentNorm >= startNorm || currentNorm < endNorm;
  }

  return currentNorm >= startNorm && currentNorm < endNorm;
}

/**
 * Get a Date object representing a specific time today in Toronto
 */
export function getTimeToday(timeString: string): Date {
  const [hours, minutes, seconds = 0] = timeString.split(":").map(Number);
  const today = getNowInToronto();
  today.setHours(hours, minutes, seconds, 0);
  return today;
}

/**
 * Check if the current Toronto time falls within business hours
 */
export function isWithinHours(openTime: string, closeTime: string): boolean {
  const currentTime = getCurrentTimeHHMMInToronto();
  return isTimeBetween(currentTime, openTime, closeTime);
}

/**
 * Format time for display (12-hour format)
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get day index (0-6) from day name
 */
export function getDayIndex(day: DayName): number {
  return DAYS_OF_WEEK.indexOf(day);
}

/**
 * Get day name from day index
 */
export function getDayName(index: number): DayName {
  return DAYS_OF_WEEK[index % 7];
}
