/**
 * Stable Latin-digit formatting for compact chart notation (degrees, houses, padas).
 * Locale-aware Intl.NumberFormat can differ between Node SSR and the browser.
 */
export function formatChartNumber(value: number) {
  return String(Math.trunc(value));
}

export function formatChartDegrees(value: number, degreeUnit: string) {
  const totalMinutes = Math.round(value * 60);
  const degrees = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const degreeText = formatChartNumber(degrees).padStart(2, "0");
  const minuteText = formatChartNumber(minutes).padStart(2, "0");
  return `${degreeText}${degreeUnit} ${minuteText}'`;
}
