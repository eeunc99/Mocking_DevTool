import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data", "resources");

type Rec = { id: number | string; [k: string]: unknown };

function file(resource: string) {
  return path.join(DATA_DIR, `${resource}.json`);
}

function readResource(resource: string): Rec[] {
  try {
    return JSON.parse(fs.readFileSync(file(resource), "utf-8"));
  } catch {
    return [];
  }
}

function writeResource(resource: string, records: Rec[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file(resource), JSON.stringify(records, null, 2));
}

export function listRecords(resource: string): Rec[] {
  return readResource(resource);
}

export function getRecord(resource: string, id: string): Rec | undefined {
  return readResource(resource).find((r) => String(r.id) === String(id));
}

export function createRecord(resource: string, data: Record<string, unknown>): Rec {
  const records = readResource(resource);
  const nextId = records.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
  const record: Rec = { id: nextId, ...data };
  records.push(record);
  writeResource(resource, records);
  return record;
}

export function updateRecord(resource: string, id: string, data: Record<string, unknown>): Rec | null {
  const records = readResource(resource);
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...data };
  writeResource(resource, records);
  return records[idx];
}

export function deleteRecord(resource: string, id: string): boolean {
  const records = readResource(resource);
  const next = records.filter((r) => String(r.id) !== String(id));
  writeResource(resource, next);
  return next.length !== records.length;
}

export function resetResource(resource: string, seed: Rec[]) {
  writeResource(resource, seed);
}
