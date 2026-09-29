import { readJson, writeJson } from "./kv";

const MAX_LOGS = 50;

export type RequestLog = {
  id: number;
  method: string;
  path: string;
  status: number;
  timestamp: string;
};

export async function addLog(entry: Omit<RequestLog, "id" | "timestamp">) {
  const logs = await readJson<RequestLog[]>("logs", []);
  const nextId = (logs[0]?.id ?? 0) + 1;
  logs.unshift({ id: nextId, timestamp: new Date().toISOString(), ...entry });
  await writeJson("logs", logs.slice(0, MAX_LOGS));
}

export function getLogs(): Promise<RequestLog[]> {
  return readJson<RequestLog[]>("logs", []);
}
