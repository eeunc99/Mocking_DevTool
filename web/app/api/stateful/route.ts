import { NextRequest, NextResponse } from "next/server";
import { isStateful, setStateful } from "@/lib/stateful-store";
import { listRecords, resetResource } from "@/lib/resource-store";
import { getMockConfig } from "@/lib/mock-store";

export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") ?? "";
  return NextResponse.json({ stateful: await isStateful(resource) });
}

export async function POST(req: NextRequest) {
  const { resource, on } = await req.json();
  await setStateful(resource, on);

  // 처음 켤 때 비어있으면, 저장된 목록 응답 템플릿이 배열이면 그걸 초기 시드로 사용
  if (on && (await listRecords(resource)).length === 0) {
    const seedConfig = await getMockConfig(`GET /${resource}`);
    let seed: Array<{ id: number | string; [k: string]: unknown }> = [];
    if (seedConfig) {
      try {
        const parsed = JSON.parse(seedConfig.body);
        if (Array.isArray(parsed)) {
          seed = parsed.map((r, i) => ({ id: r.id ?? i + 1, ...r }));
        }
      } catch {
        // 시드로 못 쓰는 형식이면 빈 배열로 시작
      }
    }
    await resetResource(resource, seed);
  }

  return NextResponse.json({ stateful: await isStateful(resource) });
}
