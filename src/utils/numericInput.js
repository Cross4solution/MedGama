/**
 * Blocks non-numeric key presses on number inputs.
 * Browsers allow e, E, +, - on type="number" — this handler prevents them.
 *
 * Usage:  <input type="number" onKeyDown={blockNonNumeric} />
 *         <input type="number" onKeyDown={blockNonNumericInt} />  (no decimals)
 */

const BLOCKED = new Set(['e', 'E', '+']);

/** Allow digits, one dot/comma, minus at start, and navigation keys */
export function blockNonNumeric(e) {
  if (BLOCKED.has(e.key)) {
    e.preventDefault();
  }
}

/** Allow only integer digits (no dot, no minus, no e) */
export function blockNonNumericInt(e) {
  if (BLOCKED.has(e.key) || e.key === '.' || e.key === ',' || e.key === '-') {
    e.preventDefault();
  }
}

/** onInput sanitizer — strips anything that isn't digit/dot/minus */
export function sanitizeNumeric(e) {
  e.target.value = e.target.value.replace(/[^0-9.\-]/g, '');
}

export function sanitizeInt(e) {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
}
