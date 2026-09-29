"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Rec = { id: number | string; [k: string]: unknown };

export function ResourceViewer({ resource }: { resource: string }) {
  const [stateful, setStateful] = useState(false);
  const [records, setRecords] = useState<Rec[]>([]);
  const [schemaColumns, setSchemaColumns] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<Rec["id"] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  async function load() {
    const [statefulRes, configRes] = await Promise.all([
      fetch(`/api/stateful?resource=${encodeURIComponent(resource)}`).then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()) as Promise<Record<string, { body: string }>>,
    ]);
    setStateful(statefulRes.stateful);
    if (statefulRes.stateful) {
      const data = await fetch(`/api/resource?resource=${encodeURIComponent(resource)}`).then((r) => r.json());
      setRecords(data);
    }

    // 이 리소스에 속한 모든 엔드포인트(GET 목록/단건, POST, PUT 등)의 응답 템플릿 필드를 합쳐서 컬럼으로 사용
    const fields = new Set<string>();
    for (const [key, cfg] of Object.entries(configRes)) {
      const path = key.split(" ")[1];
      if (!path || !(path === `/${resource}` || path.startsWith(`/${resource}/`))) continue;
      try {
        const parsed = JSON.parse(cfg.body);
        if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === "object") {
          Object.keys(parsed[0]).forEach((k) => fields.add(k));
        } else if (parsed && typeof parsed === "object") {
          Object.keys(parsed).forEach((k) => fields.add(k));
        }
      } catch {
        // JSON으로 안 읽히는 템플릿은 건너뜀
      }
    }
    setSchemaColumns(Array.from(fields));
  }

  useEffect(() => {
    load();
    // ponytail: 1.5초 폴링. 진짜 실시간이 필요해지면 SSE/WebSocket으로
    const interval = setInterval(load, 1500);
    return () => clearInterval(interval);
  }, [resource]);

  if (!stateful) return null;

  const columns = Array.from(
    new Set(["id", ...schemaColumns, ...records.flatMap((r) => Object.keys(r))])
  );

  function startEdit(rec: Rec) {
    setEditingId(rec.id);
    const d: Record<string, string> = {};
    for (const c of columns) d[c] = String(rec[c] ?? "");
    setDraft(d);
  }

  async function saveEdit(id: Rec["id"]) {
    const data: Record<string, unknown> = { ...draft };
    delete data.id;
    await fetch("/api/resource", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, id, data }),
    });
    setEditingId(null);
    load();
  }

  async function remove(id: Rec["id"]) {
    await fetch("/api/resource", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, id }),
    });
    load();
  }

  async function addRow() {
    const data = Object.fromEntries(columns.filter((c) => c !== "id").map((c) => [c, ""]));
    await fetch("/api/resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, data }),
    });
    load();
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white dark:bg-zinc-900">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">라이브 상태</span>
          <code className="text-xs text-zinc-400">{resource}</code>
          <span className="text-xs text-zinc-400">{records.length}건</span>
        </div>
        <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={addRow}>
          + 레코드
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr className="text-left text-zinc-500">
              {columns.map((c) => (
                <th key={c} className="px-3 py-1.5 font-medium">
                  {c}
                </th>
              ))}
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id} className="border-t">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-1.5 font-mono">
                    {editingId === rec.id && c !== "id" ? (
                      <input
                        value={draft[c] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [c]: e.target.value }))}
                        className="w-full rounded border px-1 py-0.5"
                      />
                    ) : (
                      String(rec[c] ?? "")
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-1.5 text-right">
                  {editingId === rec.id ? (
                    <>
                      <button onClick={() => saveEdit(rec.id)} className="mr-2 text-emerald-600">
                        저장
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-zinc-400">
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(rec)}
                        className="mr-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        편집
                      </button>
                      <button onClick={() => remove(rec.id)} className="text-zinc-400 hover:text-red-600">
                        삭제
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-4 text-center text-zinc-400">
                  레코드가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
