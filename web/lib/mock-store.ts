import { readJson, writeJson } from "./kv";

export type MockConfig = { body: string; status?: number; delay?: number };
type Store = Record<string, MockConfig>;

export async function saveMockConfig(key: string, config: MockConfig) {
  const store = await readJson<Store>("mock-config", {});
  store[key] = config;
  await writeJson("mock-config", store);
}

export async function getMockConfig(key: string): Promise<MockConfig | undefined> {
  return (await readJson<Store>("mock-config", {}))[key];
}

export function getAllMockConfig(): Promise<Store> {
  return readJson<Store>("mock-config", {});
}

// status/delay는 stateful 엔드포인트(레코드 CRUD)에도 공통으로 적용되는 응답 시뮬레이션 설정.
export async function getResponseOverrides(key: string): Promise<{ status?: number; delay?: number }> {
  const cfg = await getMockConfig(key);
  return { status: cfg?.status, delay: cfg?.delay };
}
