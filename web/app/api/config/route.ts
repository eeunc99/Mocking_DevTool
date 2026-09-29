import { NextRequest, NextResponse } from "next/server";
import { saveMockConfig, getAllMockConfig } from "@/lib/mock-store";

export async function GET() {
  return NextResponse.json(await getAllMockConfig());
}

export async function POST(req: NextRequest) {
  const { key, body, status, delay } = await req.json();
  await saveMockConfig(key, { body, status, delay });
  return NextResponse.json({ ok: true });
}
