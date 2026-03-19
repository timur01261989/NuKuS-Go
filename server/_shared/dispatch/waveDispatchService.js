export function buildDispatchWaves(drivers, sizes = [3, 3, 5]) {
  const waves = [];
  let cursor = 0;

  for (const size of sizes) {
    const slice = drivers.slice(cursor, cursor + size);
    if (slice.length) {
      waves.push(slice);
    }
    cursor += size;
  }

  const rest = drivers.slice(cursor);
  if (rest.length) {
    waves.push(rest);
  }

  return waves;
}

export function shouldOpenNextWave({
  accepted = false,
  activeOffers = 0,
  elapsedSeconds = 0,
  timeoutSeconds = 6,
}) {
  if (accepted) return false;
  if (activeOffers > 0 && elapsedSeconds < timeoutSeconds) return false;
  return true;
}
