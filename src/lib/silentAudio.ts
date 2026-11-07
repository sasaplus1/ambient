const SAMPLE_RATE = 8000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const HEADER_BYTES = 44;

/* Flips the sign every half period, giving a 100 Hz square wave at +/-1 LSB */
const TONE_HZ = 100;
const AMPLITUDE = 1;

function writeTag(view: DataView, offset: number, tag: string): void {
  for (let index = 0; index < tag.length; index += 1) {
    view.setUint8(offset + index, tag.charCodeAt(index));
  }
}

export function createNearSilentWav(seconds: number): ArrayBuffer {
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;
  const byteRate = SAMPLE_RATE * blockAlign;
  const frames = SAMPLE_RATE * seconds;
  const dataBytes = frames * blockAlign;

  const buffer = new ArrayBuffer(HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  writeTag(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeTag(view, 8, 'WAVE');
  writeTag(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // 1 = uncompressed PCM
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeTag(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  const halfPeriod = Math.round(SAMPLE_RATE / (TONE_HZ * 2));

  for (let frame = 0; frame < frames; frame += 1) {
    const high = Math.floor(frame / halfPeriod) % 2 === 0;

    view.setInt16(
      HEADER_BYTES + frame * blockAlign,
      high ? AMPLITUDE : -AMPLITUDE,
      true,
    );
  }

  return buffer;
}
