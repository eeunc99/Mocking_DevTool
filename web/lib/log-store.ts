import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "logs.json");
const MAX_LOGS = 50;

export type RequestLog = {
  id: number;
  method: string;
  path: string;
  status: number;
  timestamp: string;
};

function readLogs(): RequestLog[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeLogs(logs: RequestLog[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(logs, null, 2));
}

export function addLog(entry: Omit<RequestLog, "id" | "timestamp">) {
  const logs = readLogs();
  const nextId = (logs[0]?.id ?? 0) + 1;
  logs.unshift({ id: nextId, timestamp: new Date().toISOString(), ...entry });
  writeLogs(logs.slice(0, MAX_LOGS));
}

export function getLogs(): RequestLog[] {
  return readLogs();
}
