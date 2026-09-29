import { NextRequest, NextResponse } from "next/server";
import { getMockConfig } from "@/lib/mock-store";
import { renderTemplate } from "@/lib/template";
import { addLog } from "@/lib/log-store";

export async function serveMock(req: NextRequest, key: string, context: Record<string, unknown>) {
  const path = new URL(req.url).pathname;
  const config = await getMockConfig(key);

  if (!config) {
    await addLog({ method: req.method, path, status: 404 });
    return NextResponse.json(
      { error: "설정된 응답이 없습니다 — 대시보드에서 먼저 저장하세요" },
      { status: 404 }
    );
  }

  if (config.delay) await new Promise((r) => setTimeout(r, config.delay));

  const status = config.status ?? 200;
  const rendered = renderTemplate(JSON.parse(config.body), context);
  await addLog({ method: req.method, path, status });
  return NextResponse.json(rendered, { status });
}
