const API_BASE = "/api/v1";
const TOKEN = "3541031f-baf2-4737-a7e8-c66396e5a5e3";
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

export const THRESHOLDS = {
  activityWarningDays:  14,
  activityCriticalDays: 30,
  inactiveDays:         90,
  participationGoodPct:  70,
  participationLowPct:   50,
  participationIssuePct: 30,
  suspiciousHours:       24,
};

export async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function extract(obj, keys) {
  if (Array.isArray(obj)) return obj;
  for (const k of keys) if (obj && Array.isArray(obj[k])) return obj[k];
  return [];
}
