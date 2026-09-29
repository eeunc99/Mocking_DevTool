"use client";

import { useEditorStore } from "@/lib/store";
import type { Endpoint } from "@/lib/store";

export function ActiveToggle({ endpoint }: { endpoint: Endpoint }) {
  const setActive = useEditorStore((s) => s.setActive);
  const active = endpoint.active !== false;

  return (
    <div className="mt-4 flex items-start gap-2">
      <button
        onClick={() => setActive(endpoint, !active)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full ${
          active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${active ? "left-4" : "left-0.5"}`}
        />
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
          <span>URL 활성화</span>
        </span>
        <span className="text-xs text-zinc-500">
          {active ? "활성 — 호출하면 정상 응답" : "비활성 — 호출 시 503 반환"}
        </span>
      </div>
    </div>
  );
}
