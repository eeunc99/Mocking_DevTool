import { NextRequest, NextResponse } from "next/server";
import { getEndpoints, type Endpoint } from "@/lib/endpoints-store";
import { serveMock } from "@/lib/serve-mock";
import { resourceOf } from "@/lib/resource";
import { isStateful } from "@/lib/stateful-store";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "@/lib/resource-store";
import { addLog } from "@/lib/log-store";
import { endpointKey } from "@/lib/endpoint-key";
import { getResponseOverrides } from "@/lib/mock-store";

// stateful(레코드 CRUD) 응답에도 delay/status 시뮬레이션을 적용 — 실패(4xx/5xx) 응답은 그대로 두고 성공 응답만 덮어씀
async function applyOverrides(key: string, res: NextResponse): Promise<NextResponse> {
  const { status, delay } = getResponseOverrides(key);
  if (delay) await new Promise((r) => setTimeout(r, delay));
  if (status && res.status >= 200 && res.status < 300) {
    const body = await res.json().catch(() => null);
    return NextResponse.json(body, { status });
  }
  return res;
}

// 등록된 쿼리 키 조합과 실제 요청의 쿼리 키 조합이 정확히 같아야 매칭 — 다른 조합은 전부 no-match(404)
function queryKeysMatch(expected: string[] | undefined, url: URL): boolean {
  const expectedSet = new Set(expected ?? []);
  const actualKeys = Array.from(new Set(url.searchParams.keys()));
  if (actualKeys.length !== expectedSet.size) return false;
  return actualKeys.every((k) => expectedSet.has(k));
}

// 정적 세그먼트가 많을수록(동적 ':' 이 적을수록) 먼저 매칭되도록 정렬
function sortByStaticPriority(list: Endpoint[]): Endpoint[] {
  const score = (p: string) => p.split("/").filter((s) => s.startsWith(":")).length;
  return [...list].sort((a, b) => score(a.path) - score(b.path));
}

function matchPath(pattern: string, actual: string[]): Record<string, string> | null {
  const patternSegs = pattern.split("/").filter(Boolean);
  if (patternSegs.length !== actual.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegs.length; i++) {
    const p = patternSegs[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(actual[i]);
    } else if (p !== actual[i]) {
      return null;
    }
  }
  return params;
}

// id 쿼리가 있으면 그대로, name 쿼리면 매칭되는 레코드의 id로 변환. 대상 지정을 항상 id로 통일.
function resolveTargetId(url: URL, resource: string): string | null {
  const queryId = url.searchParams.get("id");
  if (queryId) return queryId;

  const name = url.searchParams.get("name");
  if (name) {
    const record = listRecords(resource).find((r) => String(r.name) === name);
    return record ? String(record.id) : null;
  }

  return null;
}

function serveStateful(req: NextRequest, method: string, resource: string) {
  const url = new URL(req.url);
  const path = url.pathname;

  return (async () => {
    if (method === "GET") {
      if (!url.searchParams.has("id") && !url.searchParams.has("name")) {
        addLog({ method, path, status: 200 });
        return NextResponse.json(listRecords(resource));
      }

      const targetId = resolveTargetId(url, resource);
      const result = targetId ? getRecord(resource, targetId) : undefined;
      if (!result) {
        addLog({ method, path, status: 404 });
        return NextResponse.json({ error: "record not found" }, { status: 404 });
      }
      addLog({ method, path, status: 200 });
      return NextResponse.json(result);
    }

    if (method === "POST") {
      const body = await req.json().catch(() => ({}));
      const record = createRecord(resource, body);
      addLog({ method, path, status: 201 });
      return NextResponse.json(record, { status: 201 });
    }

    // PUT/DELETE는 대상을 반드시 ?id= 또는 ?name=으로 지정해야 함 — 없으면 전체 대상 취급하지 않고 400
    if (method === "PUT") {
      const targetId = resolveTargetId(url, resource);
      if (!targetId) {
        addLog({ method, path, status: 400 });
        return NextResponse.json({ error: "id 또는 name 쿼리로 대상을 지정하세요" }, { status: 400 });
      }
      const body = await req.json().catch(() => ({}));
      const record = updateRecord(resource, targetId, body);
      if (!record) {
        addLog({ method, path, status: 404 });
        return NextResponse.json({ error: "record not found" }, { status: 404 });
      }
      addLog({ method, path, status: 200 });
      return NextResponse.json(record);
    }

    if (method === "DELETE") {
      const targetId = resolveTargetId(url, resource);
      if (!targetId) {
        addLog({ method, path, status: 400 });
        return NextResponse.json({ error: "id 또는 name 쿼리로 대상을 지정하세요" }, { status: 400 });
      }
      const ok = deleteRecord(resource, targetId);
      if (!ok) {
        addLog({ method, path, status: 404 });
        return NextResponse.json({ error: "record not found" }, { status: 404 });
      }
      addLog({ method, path, status: 200 });
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: "unsupported method" }, { status: 405 });
  })();
}

type Ctx = { params: Promise<{ projectKey: string; slug?: string[] }> };

async function handle(req: NextRequest, method: string, ctx: Ctx) {
  const { slug } = await ctx.params;
  const segs = slug ?? [];
  const url = new URL(req.url);
  const candidates = sortByStaticPriority(getEndpoints()).filter((e) => e.method === method);

  for (const ep of candidates) {
    const params = matchPath(ep.path, segs);
    if (!params) continue;
    if (!queryKeysMatch(ep.query, url)) continue;

    if (ep.active === false) {
      addLog({ method, path: url.pathname, status: 503 });
      return NextResponse.json({ error: "이 엔드포인트는 비활성화 상태입니다" }, { status: 503 });
    }

    const resource = resourceOf(ep.path);
    if (isStateful(resource)) {
      const res = await serveStateful(req, method, resource);
      return applyOverrides(endpointKey(ep), res);
    }

    const context: Record<string, unknown> = { params, query: Object.fromEntries(url.searchParams) };
    if (method === "POST" || method === "PUT") {
      context.body = await req.json().catch(() => ({}));
    }
    return serveMock(req, endpointKey(ep), context);
  }

  addLog({ method, path: url.pathname, status: 404 });
  return NextResponse.json({ error: "등록된 엔드포인트가 없습니다 (경로/쿼리 조합을 확인하세요)" }, { status: 404 });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, "GET", ctx);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, "POST", ctx);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(req, "PUT", ctx);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, "DELETE", ctx);
}
