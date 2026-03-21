import { useState, useEffect } from 'react';

export interface HealthData {
  status: 'ok' | 'degraded';
  services: Record<string, { status: 'ok' | 'error' | 'not_configured'; latencyMs?: number }>;
}

let sharedHealth: HealthData | null = null;
let listeners: Array<(h: HealthData | null) => void> = [];
let intervalId: ReturnType<typeof setInterval> | null = null;

async function fetchHealth() {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch('/api/health');
      const data = await r.json();
      sharedHealth = data;
      listeners.forEach((fn) => fn(sharedHealth));
      return;
    } catch {
      if (i < 2) await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** i, 5000)));
    }
  }
  sharedHealth = null;
  listeners.forEach((fn) => fn(null));
}

function startPolling() {
  if (intervalId) return;
  fetchHealth();
  intervalId = setInterval(fetchHealth, 30_000);
}

function stopPolling() {
  if (listeners.length > 0) return;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function useHealth() {
  const [health, setHealth] = useState<HealthData | null>(sharedHealth);

  useEffect(() => {
    listeners.push(setHealth);
    startPolling();
    return () => {
      listeners = listeners.filter((fn) => fn !== setHealth);
      stopPolling();
    };
  }, []);

  return health;
}

export function getCriticalFailures(health: HealthData | null): string[] {
  if (!health) return [];
  const critical = ['database', 'redis', 'claude', 'whatsapp'];
  const labels: Record<string, string> = {
    database: 'Base de datos',
    redis: 'Redis',
    claude: 'Claude IA',
    whatsapp: 'WhatsApp',
  };
  return critical.filter((key) => health.services[key]?.status === 'error').map((key) => labels[key] ?? key);
}
