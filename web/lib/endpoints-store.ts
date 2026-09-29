import { readJson, writeJson } from "./kv";
import { endpointKey } from "./endpoint-key";

export type Endpoint = { method: string; path: string; query?: string[]; active?: boolean };

const seed: Endpoint[] = [
  { method: "GET", path: "/users" },
  { method: "POST", path: "/users" },
  { method: "PUT", path: "/users", query: ["id"] },
  { method: "DELETE", path: "/users", query: ["id"] },
];

const writeList = (list: Endpoint[]) => writeJson("endpoints", list);

async function readList(): Promise<Endpoint[]> {
  const list = await readJson<Endpoint[] | null>("endpoints", null);
  if (list) return list;
  await writeList(seed);
  return seed;
}

export function getEndpoints(): Promise<Endpoint[]> {
  return readList();
}

export async function addEndpoint(ep: Endpoint): Promise<Endpoint[]> {
  const list = await readList();
  if (!list.some((e) => endpointKey(e) === endpointKey(ep))) {
    list.push({ ...ep, active: true });
    await writeList(list);
  }
  return list;
}

export async function removeEndpoint(ep: Endpoint): Promise<Endpoint[]> {
  const list = (await readList()).filter((e) => endpointKey(e) !== endpointKey(ep));
  await writeList(list);
  return list;
}

export async function setEndpointActive(ep: Endpoint, active: boolean): Promise<Endpoint[]> {
  const list = (await readList()).map((e) => (endpointKey(e) === endpointKey(ep) ? { ...e, active } : e));
  await writeList(list);
  return list;
}
