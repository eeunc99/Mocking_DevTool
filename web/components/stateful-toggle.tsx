"use client";

import { useEffect, useState } from "react";

export function StatefulToggle({ resource }: { resource: string }) {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stateful?resource=${encodeURIComponent(resource)}`)
      .then((r) => r.json())
      .then((d) => setOn(d.stateful))
      .finally(() => setLoading(false));
  }, [resource]);

  async function toggle() {
    const next = !on;
    setOn(next); // 낙관적 반영
    await fetch("/api/stateful", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, on: next }),
    });
  }

  return (
    <div className="mt-4 flex items-start gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full ${
          on ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${
            on ? "left-4" : "left-0.5"
          }`}
        />
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
          <span>상태 유지</span> · <code className="font-mono text-zinc-500">{resource}</code>
        </span>
        <span className="text-xs text-zinc-500">
          {on ? "켜짐 — POST/PUT/DELETE가 실제로 데이터를 바꿉니다" : "꺼짐 — 저장된 템플릿만 그대로 응답"}
        </span>
      </div>
    </div>
  );
}
