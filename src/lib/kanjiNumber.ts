const DIGITS = [
  '',
  '壱',
  '弐',
  '参',
  '肆',
  '伍',
  '陸',
  '漆',
  '捌',
  '玖',
] as const;

const TEN = '拾';

/**
 * 大字 - the formal Japanese numerals, kept for contracts and banknotes
 * because strokes cannot be added to them to change the figure.
 *
 * The everyday forms would be 一二三. These are deliberately the ornate set:
 * on a clock face they are the whole point.
 *
 * Only 1 to 31 is ever asked for, so this stops at the tens.
 */
export function kanjiNumber(value: number): string {
  if (value < 1 || value > 99) {
    return String(value);
  }

  const tens = Math.floor(value / 10);
  const ones = value % 10;

  if (tens === 0) {
    return DIGITS[ones] ?? String(value);
  }

  // Eleven is 拾壱, not 壱拾壱
  const tensPart = tens === 1 ? TEN : `${DIGITS[tens] ?? ''}${TEN}`;

  return `${tensPart}${DIGITS[ones] ?? ''}`;
}
