"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store";

export function ResponseEditor() {
  const { selectedKey, bodies, overrides, setResponseBody, setResponseOverrides } = useEditorStore();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => setStatus("idle"), [selectedKey]);

  const current = overrides[selectedKey] ?? {};

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedKey,
          body: bodies[selectedKey],
          status: current.status,
          delay: current.delay,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <span className="text-zinc-500">상태 코드</span>
          <input
            type="number"
            value={current.status ?? ""}
            onChange={(e) =>
              setResponseOverrides({ status: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="기본값"
            className="w-20 rounded border bg-white px-1.5 py-1 font-mono dark:bg-zinc-900"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-zinc-500">지연(ms)</span>
          <input
            type="number"
            min={0}
            value={current.delay ?? ""}
            onChange={(e) =>
              setResponseOverrides({ delay: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="0"
            className="w-20 rounded border bg-white px-1.5 py-1 font-mono dark:bg-zinc-900"
          />
        </label>
        <span className="text-zinc-400">
          * 상태 코드는 정상 응답에만 적용됩니다(404/400 등 에러 응답은 그대로 유지).
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <Editor
          key={selectedKey /* 엔드포인트 전환 시 모델을 새로 마운트 */}
          height="100%"
          defaultLanguage="json"
          value={bodies[selectedKey]}
          onChange={(v) => setResponseBody(v ?? "")}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={status === "saving"}>
          저장 & 배포
        </Button>
        {status === "saved" && (
          <span className="text-xs text-emerald-600">저장됨 — URL이 즉시 반영됩니다</span>
        )}
        {status === "error" && <span className="text-xs text-red-600">저장 실패</span>}
      </div>
    </div>
  );
}
