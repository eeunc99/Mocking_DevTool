import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".data", "stateful.json");

function read(): string[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return [];
  }
}

function write(list: string[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export function isStateful(resource: string): boolean {
  return read().includes(resource);
}

export function setStateful(resource: string, on: boolean) {
  const list = read();
  const next = on ? Array.from(new Set([...list, resource])) : list.filter((r) => r !== resource);
  write(next);
}
