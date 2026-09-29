"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildTestCommand, hasSampleValue } from "@/lib/test-command";
import type { Endpoint } from "@/lib/store";

export function TestCommand({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const command = buildTestCommand(endpoint, baseUrl);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          테스트 명령어 (PowerShell)
        </span>
        <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={handleCopy}>
          {copied ? "복사됨" : "복사"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
        <code>{command}</code>
      </pre>
      {hasSampleValue(endpoint) && (
        <p className="mt-1 text-xs text-zinc-400">
          * 예시입니다. 42로 치환된 값을 실제 데이터에 맞게 바꿔서 사용하세요.
        </p>
      )}
    </div>
  );
}
