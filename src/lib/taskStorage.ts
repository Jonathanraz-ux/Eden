const STORAGE_KEY = 'ops_completed_tasks';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getCompletedTaskIds(): Set<string> {
  const map = readMap();
  return new Set(map[getTodayKey()] ?? []);
}

export function markTaskCompleted(taskId: string): void {
  const map = readMap();
  const key = getTodayKey();
  const ids = map[key] ?? [];
  if (!ids.includes(taskId)) {
    ids.push(taskId);
    map[key] = ids;
    writeMap(map);
  }
}

export function unmarkTaskCompleted(taskId: string): void {
  const map = readMap();
  const key = getTodayKey();
  map[key] = (map[key] ?? []).filter(id => id !== taskId);
  writeMap(map);
}

export function isTaskCompleted(taskId: string): boolean {
  return getCompletedTaskIds().has(taskId);
}
