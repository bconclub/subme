/**
 * Indian-system number formatting: 1,00,000 not 100,000.
 * Implemented by hand so unit tests don't depend on device ICU data.
 */
export function formatIndianNumber(n: number): string {
  const negative = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const fraction = abs - whole;

  let s = String(whole);
  if (s.length > 3) {
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const groups: string[] = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest.length) groups.unshift(rest);
    s = `${groups.join(',')},${last3}`;
  }

  if (fraction > 0) {
    s += `.${Math.round(fraction * 100).toString().padStart(2, '0')}`;
  }
  return negative ? `-${s}` : s;
}

export function formatINR(n: number): string {
  return `₹${formatIndianNumber(n)}`;
}

/** Compact: ₹1.2L, ₹45.5k - for chart axes and tight chips. */
export function formatINRCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${trimZero((abs / 10000000).toFixed(1))}Cr`;
  if (abs >= 100000) return `${sign}₹${trimZero((abs / 100000).toFixed(1))}L`;
  if (abs >= 1000) return `${sign}₹${trimZero((abs / 1000).toFixed(1))}k`;
  return `${sign}₹${abs}`;
}

function trimZero(s: string): string {
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}
