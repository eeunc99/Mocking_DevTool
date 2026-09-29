import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-store";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  const { host, port } = await req.json();
  if (typeof host !== "string" || !host.trim() || !Number.isInteger(port) || port <= 0 || port > 65535) {
    return NextResponse.json({ error: "host/port가 올바르지 않습니다" }, { status: 400 });
  }
  return NextResponse.json(await saveSettings({ host: host.trim(), port }));
}
