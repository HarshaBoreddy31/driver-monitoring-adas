import { SimulationSettings, WarningEvent } from '../types';

const API_BASE = '/api';

export const api = {
  async fetchHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async fetchStatus() {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  },

  async fetchVehicles() {
    const res = await fetch(`${API_BASE}/vehicles`);
    return res.json();
  },

  async fetchEvents(limit = 50, offset = 0): Promise<{ success: boolean; events: WarningEvent[] }> {
    const res = await fetch(`${API_BASE}/events?limit=${limit}&offset=${offset}`);
    return res.json();
  },

  async clearEvents() {
    const res = await fetch(`${API_BASE}/events`, { method: 'DELETE' });
    return res.json();
  },

  async fetchSettings(): Promise<{ success: boolean; settings: SimulationSettings }> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSettings(settings: Partial<SimulationSettings>) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async start() {
    return (await fetch(`${API_BASE}/simulation/start`, { method: 'POST' })).json();
  },

  async pause() {
    return (await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' })).json();
  },

  async resume() {
    return (await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' })).json();
  },

  async reset() {
    return (await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' })).json();
  },

  async triggerScenario(scenario: string) {
    return (
      await fetch(`${API_BASE}/simulation/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
    ).json();
  },

  async setSpeed(speedMs: number) {
    return (
      await fetch(`${API_BASE}/simulation/speed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speedMs }),
      })
    ).json();
  },

  async setLane(lane: number) {
    return (
      await fetch(`${API_BASE}/simulation/lane`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane }),
      })
    ).json();
  },

  async applyBrake(active: boolean, emergency = false) {
    return (
      await fetch(`${API_BASE}/simulation/brake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, emergency }),
      })
    ).json();
  },

  async fetchOsMetrics() {
    return (await fetch(`${API_BASE}/os/metrics`)).json();
  },
};
