import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

// Upstash(Vercel Marketplace) 환경변수가 있으면 Redis, 없으면 로컬 .data/*.json (개발용).
// ponytail: read-modify-write 비원자적 — 동시 요청이 많아지면 Redis 트랜잭션/Lua로.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const DATA_DIR = path.join(process.cwd(), ".data");
const file = (key: string) => path.join(DATA_DIR, `${encodeURIComponent(key)}.json`);

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (redis) return (await redis.get<T>(`mock:${key}`)) ?? fallback;
  try {
    return JSON.parse(fs.readFileSync(file(key), "utf-8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  if (redis) {
    await redis.set(`mock:${key}`, value);
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file(key), JSON.stringify(value, null, 2));
}
