import { readJson, writeJson } from "./kv";

export type Settings = { host: string; port: number };

const defaults: Settings = { host: "localhost", port: 3000 };

export async function getSettings(): Promise<Settings> {
  return { ...defaults, ...(await readJson<Partial<Settings>>("settings", {})) };
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  await writeJson("settings", settings);
  return settings;
}
