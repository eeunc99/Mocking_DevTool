import { NextRequest, NextResponse } from "next/server";
import { getEndpoints, addEndpoint, removeEndpoint, setEndpointActive } from "@/lib/endpoints-store";

export async function GET() {
  return NextResponse.json(getEndpoints());
}

export async function POST(req: NextRequest) {
  const ep = await req.json();
  return NextResponse.json(addEndpoint(ep));
}

export async function DELETE(req: NextRequest) {
  const ep = await req.json();
  return NextResponse.json(removeEndpoint(ep));
}

export async function PATCH(req: NextRequest) {
  const { active, ...ep } = await req.json();
  return NextResponse.json(setEndpointActive(ep, active));
}
