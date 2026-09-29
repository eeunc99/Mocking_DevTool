import { readJson, writeJson } from "./kv";

type Rec = { id: number | string; [k: string]: unknown };

const readResource = (resource: string) => readJson<Rec[]>(`resources/${resource}`, []);
const writeResource = (resource: string, records: Rec[]) => writeJson(`resources/${resource}`, records);

export function listRecords(resource: string): Promise<Rec[]> {
  return readResource(resource);
}

export async function getRecord(resource: string, id: string): Promise<Rec | undefined> {
  return (await readResource(resource)).find((r) => String(r.id) === String(id));
}

export async function createRecord(resource: string, data: Record<string, unknown>): Promise<Rec> {
  const records = await readResource(resource);
  const nextId = records.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
  const record: Rec = { id: nextId, ...data };
  records.push(record);
  await writeResource(resource, records);
  return record;
}

export async function updateRecord(resource: string, id: string, data: Record<string, unknown>): Promise<Rec | null> {
  const records = await readResource(resource);
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...data };
  await writeResource(resource, records);
  return records[idx];
}

export async function deleteRecord(resource: string, id: string): Promise<boolean> {
  const records = await readResource(resource);
  const next = records.filter((r) => String(r.id) !== String(id));
  await writeResource(resource, next);
  return next.length !== records.length;
}

export function resetResource(resource: string, seed: Rec[]) {
  return writeResource(resource, seed);
}
