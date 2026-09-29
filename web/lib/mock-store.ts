import fs from "node:fs";
import path from "node:path";

// ponytail: 로컬 JSON 파일 하나로 영속화. 여러 인스턴스로 늘어나면 그때 SQLite/Redis로.
const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "mock-config.json");

export type MockConfig = { body: string; status?: number; delay?: number };
type Store = Record<string, MockConfig>;

function readStore(): Store {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function saveMockConfig(key: string, config: MockConfig) {
  const store = readStore();
  store[key] = config;
  writeStore(store);
}

export function getMockConfig(key: string): MockConfig | undefined {
  return readStore()[key];
}

export function getAllMockConfig(): Store {
  return readStore();
}

// status/delay는 stateful 엔드포인트(레코드 CRUD)에도 공통으로 적용되는 응답 시뮬레이션 설정.
export function getResponseOverrides(key: string): { status?: number; delay?: number } {
  const cfg = getMockConfig(key);
  return { status: cfg?.status, delay: cfg?.delay };
}
