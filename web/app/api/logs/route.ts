import { NextResponse } from "next/server";
import { getLogs } from "@/lib/log-store";

export async function GET() {
  return NextResponse.json(getLogs());
}
