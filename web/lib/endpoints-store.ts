import fs from "node:fs";
import path from "node:path";
import { endpointKey } from "./endpoint-key";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "endpoints.json");

export type Endpoint = { method: string; path: string; query?: string[]; active?: boolean };

const seed: Endpoint[] = [
  { method: "GET", path: "/users" },
  { method: "POST", path: "/users" },
  { method: "PUT", path: "/users", query: ["id"] },
  { method: "DELETE", path: "/users", query: ["id"] },
];

function writeList(list: Endpoint[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

function readList(): Endpoint[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    writeList(seed);
    return seed;
  }
}

export function getEndpoints(): Endpoint[] {
  return readList();
}

export function addEndpoint(ep: Endpoint): Endpoint[] {
  const list = readList();
  if (!list.some((e) => endpointKey(e) === endpointKey(ep))) {
    list.push({ ...ep, active: true });
    writeList(list);
  }
  return list;
}

export function removeEndpoint(ep: Endpoint): Endpoint[] {
  const list = readList().filter((e) => endpointKey(e) !== endpointKey(ep));
  writeList(list);
  return list;
}

export function setEndpointActive(ep: Endpoint, active: boolean): Endpoint[] {
  const list = readList().map((e) => (endpointKey(e) === endpointKey(ep) ? { ...e, active } : e));
  writeList(list);
  return list;
}
