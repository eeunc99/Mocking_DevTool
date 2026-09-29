import fs from "node:fs";
import path from "node:path";
import Redis from "ioredis";

// REDIS_URL(Vercel Redis 연동)이 있으면 Redis, 없으면 로컬 .data/*.json (개발용).
// ponytail: read-modify-write 비원자적 — 동시 요청이 많아지면 Redis 트랜잭션/Lua로.
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const DATA_DIR = path.join(process.cwd(), ".data");
const file = (key: string) => path.join(DATA_DIR, `${encodeURIComponent(key)}.json`);

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (redis) {
    const raw = await redis.get(`mock:${key}`);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  }
  try {
    return JSON.parse(fs.readFileSync(file(key), "utf-8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  if (redis) {
    await redis.set(`mock:${key}`, JSON.stringify(value));
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file(key), JSON.stringify(value, null, 2));
}
