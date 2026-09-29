import { readJson, writeJson } from "./kv";

const read = () => readJson<string[]>("stateful", []);

export async function isStateful(resource: string): Promise<boolean> {
  return (await read()).includes(resource);
}

export async function setStateful(resource: string, on: boolean) {
  const list = await read();
  const next = on ? Array.from(new Set([...list, resource])) : list.filter((r) => r !== resource);
  await writeJson("stateful", next);
}
