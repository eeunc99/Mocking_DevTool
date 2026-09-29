import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "settings.json");

export type Settings = { host: string; port: number };

const defaults: Settings = { host: "localhost", port: 3000 };

function writeSettings(settings: Settings) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(settings, null, 2));
}

export function getSettings(): Settings {
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(FILE, "utf-8")) };
  } catch {
    writeSettings(defaults);
    return defaults;
  }
}

export function saveSettings(settings: Settings): Settings {
  writeSettings(settings);
  return settings;
}
