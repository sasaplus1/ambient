import type { AnalogNumerals, SecondHand } from '../../types';

export type ClockColors = {
  fg: string;
  fgSecondary: string;
  fgTertiary: string;
  accent: string;
};

const ROMAN_NUMERALS = [
  'XII',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
] as const;

const TAU = Math.PI * 2;

/** Angle with 12 o'clock as zero. Canvas puts 0rad at 3 o'clock, so rotate back a quarter turn. */
function angleOf(value: number, total: number): number {
  return (value / total) * TAU - Math.PI / 2;
}

/**
 * How the hour ticks are drawn.
 * Long ticks collide with the numerals, so when numerals are shown the hour
 * ticks keep the minute length and differ only in weight.
 */
type HourTickStyle = 'long' | 'thick';

function drawTicks(
  ctx: CanvasRenderingContext2D,
  center: number,
  radius: number,
  colors: ClockColors,
  hourStyle: HourTickStyle,
): void {
  ctx.lineCap = 'round';

  for (let index = 0; index < 60; index += 1) {
    const isHour = index % 5 === 0;
    const isLong = isHour && hourStyle === 'long';

    const angle = angleOf(index, 60);
    const inner = radius - radius * (isLong ? 0.1 : 0.045);

    ctx.beginPath();
    ctx.lineWidth = isHour
      ? Math.max(radius * (hourStyle === 'long' ? 0.022 : 0.018), 1.5)
      : Math.max(radius * 0.008, 0.75);
    ctx.strokeStyle = isHour ? colors.fgSecondary : colors.fgTertiary;
    ctx.moveTo(center + Math.cos(angle) * inner, center + Math.sin(angle) * inner);
    ctx.lineTo(
      center + Math.cos(angle) * radius,
      center + Math.sin(angle) * radius,
    );
    ctx.stroke();
  }
}

function drawNumerals(
  ctx: CanvasRenderingContext2D,
  center: number,
  radius: number,
  colors: ClockColors,
  roman: boolean,
): void {
  ctx.fillStyle = colors.fgSecondary;
  ctx.font = `500 ${radius * 0.16}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let hour = 0; hour < 12; hour += 1) {
    const angle = angleOf(hour, 12);
    const distance = radius * 0.8;
    const label = roman
      ? (ROMAN_NUMERALS[hour] ?? '')
      : String(hour === 0 ? 12 : hour);

    ctx.fillText(
      label,
      center + Math.cos(angle) * distance,
      center + Math.sin(angle) * distance,
    );
  }
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  center: number,
  angle: number,
  length: number,
  width: number,
  color: string,
  tail: number,
): void {
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.moveTo(-tail, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the dial in CSS pixel coordinates.
 * The caller must have already applied the devicePixelRatio setTransform.
 */
export function drawAnalogClock(
  ctx: CanvasRenderingContext2D,
  size: number,
  colors: ClockColors,
  numerals: AnalogNumerals,
  secondHand: SecondHand,
  now: Date,
): void {
  const center = size / 2;
  const radius = center * 0.94;

  ctx.clearRect(0, 0, size, size);

  if (numerals === 'ticks') {
    drawTicks(ctx, center, radius, colors, 'long');
  } else if (numerals === 'arabic' || numerals === 'roman') {
    drawTicks(ctx, center, radius, colors, 'thick');
    drawNumerals(ctx, center, radius, colors, numerals === 'roman');
  }

  // Only a sweeping second hand needs sub-second precision
  const seconds =
    now.getSeconds() +
    (secondHand === 'sweep' ? now.getMilliseconds() / 1000 : 0);
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  drawHand(
    ctx,
    center,
    angleOf(hours, 12),
    radius * 0.5,
    Math.max(radius * 0.055, 3),
    colors.fg,
    radius * 0.08,
  );
  drawHand(
    ctx,
    center,
    angleOf(minutes, 60),
    radius * 0.75,
    Math.max(radius * 0.038, 2),
    colors.fg,
    radius * 0.1,
  );

  if (secondHand !== 'none') {
    drawHand(
      ctx,
      center,
      angleOf(seconds, 60),
      radius * 0.82,
      Math.max(radius * 0.014, 1),
      colors.accent,
      radius * 0.16,
    );
  }

  ctx.beginPath();
  ctx.arc(center, center, Math.max(radius * 0.028, 2), 0, TAU);
  ctx.fillStyle = secondHand === 'none' ? colors.fg : colors.accent;
  ctx.fill();
}
