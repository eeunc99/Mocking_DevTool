import { NextRequest, NextResponse } from "next/server";
import { listRecords, createRecord, updateRecord, deleteRecord } from "@/lib/resource-store";

export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource") ?? "";
  return NextResponse.json(await listRecords(resource));
}

export async function POST(req: NextRequest) {
  const { resource, data } = await req.json();
  return NextResponse.json(await createRecord(resource, data ?? {}), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { resource, id, data } = await req.json();
  const record = await updateRecord(resource, id, data);
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const { resource, id } = await req.json();
  const ok = await deleteRecord(resource, id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
