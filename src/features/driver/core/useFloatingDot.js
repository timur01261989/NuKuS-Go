
export async function startDot() {
  try {
    const plugin = window?.Capacitor?.Plugins?.FloatingDot;
    if (plugin?.start) await plugin.start();
  } catch {
    // ignore
  }
}

export async function stopDot() {
  try {
    const plugin = window?.Capacitor?.Plugins?.FloatingDot;
    if (plugin?.stop) await plugin.stop();
  } catch {
    // ignore
  }
}
