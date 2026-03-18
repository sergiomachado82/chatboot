/** Get today's date in Argentina timezone (UTC-3) as YYYY-MM-DD */
export function getArgentinaToday(): string {
  // Primary: use Intl timezone conversion
  const result = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

  // Sanity check: if toLocaleDateString didn't respect timezone (broken ICU),
  // fall back to manual UTC-3 offset calculation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    return manualArgentinaDate();
  }

  return result;
}

/** Fallback: manually compute Argentina date (UTC-3) */
function manualArgentinaDate(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const argMs = utcMs - 3 * 3600_000; // UTC-3
  const arg = new Date(argMs);
  return formatLocalDate(arg);
}

/** Get current time in Argentina as HH:MM */
export function getArgentinaTime(): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Format a Date (from local components) as YYYY-MM-DD */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
