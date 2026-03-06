const STORAGE_KEY = "blumira-finding-annotations";

export interface NoteEntry {
  text: string;
  author: string;
  timestamp: string;
}

export interface FindingAnnotation {
  assignee: string;
  notes: NoteEntry[];
  localStatus: "none" | "closed" | "in_progress";
  updatedAt: string;
}

function readAll(): Record<string, FindingAnnotation> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    for (const key of Object.keys(parsed)) {
      const a = parsed[key];
      if (typeof a.notes === "string") {
        a.notes = a.notes ? [{ text: a.notes, author: "You", timestamp: a.updatedAt || new Date().toISOString() }] : [];
      }
      if (!a.localStatus) a.localStatus = "none";
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, FindingAnnotation>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAnnotation(findingId: string): FindingAnnotation | null {
  const all = readAll();
  return all[findingId] || null;
}

export function saveAnnotation(findingId: string, data: FindingAnnotation) {
  const all = readAll();
  all[findingId] = { ...data, updatedAt: new Date().toISOString() };
  writeAll(all);
}

export function deleteAnnotation(findingId: string) {
  const all = readAll();
  delete all[findingId];
  writeAll(all);
}

export function addNote(findingId: string, text: string, author: string) {
  const all = readAll();
  const existing = all[findingId] || { assignee: "", notes: [], localStatus: "none" as const, updatedAt: "" };
  existing.notes.push({ text, author, timestamp: new Date().toISOString() });
  existing.updatedAt = new Date().toISOString();
  all[findingId] = existing;
  writeAll(all);
  return existing;
}

export function setAssignee(findingId: string, assignee: string) {
  const all = readAll();
  const existing = all[findingId] || { assignee: "", notes: [], localStatus: "none" as const, updatedAt: "" };
  existing.assignee = assignee;
  existing.updatedAt = new Date().toISOString();
  all[findingId] = existing;
  writeAll(all);
  return existing;
}

export function setLocalStatus(findingId: string, status: FindingAnnotation["localStatus"]) {
  const all = readAll();
  const existing = all[findingId] || { assignee: "", notes: [], localStatus: "none" as const, updatedAt: "" };
  existing.localStatus = status;
  existing.updatedAt = new Date().toISOString();
  all[findingId] = existing;
  writeAll(all);
  return existing;
}

export function bulkSetAssignee(findingIds: string[], assignee: string) {
  const all = readAll();
  for (const id of findingIds) {
    const existing = all[id] || { assignee: "", notes: [], localStatus: "none" as const, updatedAt: "" };
    existing.assignee = assignee;
    existing.updatedAt = new Date().toISOString();
    all[id] = existing;
  }
  writeAll(all);
}

export function bulkAddNote(findingIds: string[], text: string, author: string) {
  const all = readAll();
  const ts = new Date().toISOString();
  for (const id of findingIds) {
    const existing = all[id] || { assignee: "", notes: [], localStatus: "none" as const, updatedAt: "" };
    existing.notes.push({ text, author, timestamp: ts });
    existing.updatedAt = ts;
    all[id] = existing;
  }
  writeAll(all);
}

export function bulkSetLocalStatus(findingIds: string[], status: FindingAnnotation["localStatus"]) {
  const all = readAll();
  const ts = new Date().toISOString();
  for (const id of findingIds) {
    const existing = all[id] || { assignee: "", notes: [], localStatus: "none" as const, updatedAt: "" };
    existing.localStatus = status;
    existing.updatedAt = ts;
    all[id] = existing;
  }
  writeAll(all);
}
