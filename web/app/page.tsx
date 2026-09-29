"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ResponseEditor } from "@/components/response-editor";
import { LogPanel } from "@/components/log-panel";
import { TestCommand } from "@/components/test-command";
import { StatefulToggle } from "@/components/stateful-toggle";
import { ActiveToggle } from "@/components/active-toggle";
import { ResourceViewer } from "@/components/resource-viewer";
import { useEditorStore, endpointKey } from "@/lib/store";
import { resourceOf } from "@/lib/resource";
import { buildBaseUrl } from "@/lib/test-command";

const methodColor: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  POST: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  PUT: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  DELETE: "bg-red-100 text-red-700 hover:bg-red-100",
};

const hintLabel: Record<string, string> = {
  GET: "조회 대상 쿼리 조합 — 클릭하면 그대로 등록:",
  PUT: "수정 대상 쿼리 조합 — 클릭하면 그대로 등록:",
  DELETE: "삭제 대상 쿼리 조합 — 클릭하면 그대로 등록:",
};

// id부터 시작해서 리소스 필드를 하나씩 누적한 쿼리 키 조합 예시. name=@ 처럼 값 자리는 @로 표시.
function buildQueryCombos(fields: string[]): string[][] {
  const combos = [["id"]];
  const acc = ["id"];
  for (const f of fields) {
    acc.push(f);
    combos.push([...acc]);
  }
  return combos;
}

// 경로 입력칸에 "/users?id=1&name=" 처럼 직접 쳐도 등록 시엔 경로/쿼리 키로 분리.
function parsePathInput(raw: string): { path: string; query?: string[] } {
  const [base, qs] = raw.replace(/\/+$/, "").split("?");
  if (!qs) return { path: base };
  const query = qs
    .split("&")
    .map((kv) => kv.split("=")[0])
    .filter(Boolean);
  return { path: base, query: query.length ? query : undefined };
}

function AddEndpointForm({ onClose }: { onClose: () => void }) {
  const addEndpoint = useEditorStore((s) => s.addEndpoint);
  const endpoints = useEditorStore((s) => s.endpoints);
  const knownResources = useMemo(
    () => Array.from(new Set(endpoints.map((ep) => resourceOf(ep.path)))).sort(),
    [endpoints]
  );
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/");
  const [fields, setFields] = useState<string[]>([]);
  const [registered, setRegistered] = useState<string | null>(null);

  async function handleAdd() {
    if (!path.startsWith("/")) return;
    await addEndpoint({ method, ...parsePathInput(path) });
    onClose();
  }

  const trimmed = path.replace(/\/+$/, "");
  const bare = trimmed.length > 1 && !trimmed.includes("?") && !trimmed.includes(":");
  const showQueryHint = bare && !!hintLabel[method];

  useEffect(() => {
    if (!showQueryHint) return;
    let cancelled = false;
    fetch(`/api/resource?resource=${encodeURIComponent(resourceOf(trimmed))}`)
      .then((r) => r.json())
      .then((records: Array<Record<string, unknown>>) => {
        if (cancelled) return;
        const sample = records[0];
        setFields(sample ? Object.keys(sample).filter((k) => k !== "id") : ["name"]);
      })
      .catch(() => !cancelled && setFields(["name"]));
    return () => {
      cancelled = true;
    };
  }, [trimmed, showQueryHint]);

  const querySuggestions = showQueryHint ? buildQueryCombos(fields) : [];

  async function registerSuggestion(query: string[]) {
    await addEndpoint({ method, path: trimmed, query });
    const label = `${trimmed}?${query.map((k) => `${k}=@`).join("&")}`;
    setRegistered(label);
    setTimeout(() => setRegistered(null), 1200);
  }

  return (
    <div className="mb-2 flex flex-col gap-1.5 rounded-md border bg-zinc-50 p-2 dark:bg-zinc-800/50">
      <div className="flex gap-1.5">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded border bg-white px-1.5 py-1 text-xs dark:bg-zinc-900"
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/orders/:id"
          list="known-resources"
          className="w-full rounded border bg-white px-2 py-1 font-mono text-xs dark:bg-zinc-900"
        />
        <datalist id="known-resources">
          {knownResources.map((r) => (
            <option key={r} value={`/${r}`} />
          ))}
        </datalist>
      </div>
      {querySuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <span>{hintLabel[method]}</span>
          {querySuggestions.map((query) => {
            const label = `${trimmed}?${query.map((k) => `${k}=@`).join("&")}`;
            return (
              <button
                key={label}
                type="button"
                onClick={() => registerSuggestion(query)}
                className="rounded border bg-white px-1.5 py-0.5 font-mono text-xs hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                {registered === label ? "등록됨" : label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex justify-end gap-1.5">
        <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={onClose}>
          취소
        </Button>
        <Button size="sm" className="h-6 px-2 text-xs" onClick={handleAdd}>
          추가
        </Button>
      </div>
    </div>
  );
}

function HostPortSettings() {
  const settings = useEditorStore((s) => s.settings);
  const saveSettings = useEditorStore((s) => s.saveSettings);
  const [editing, setEditing] = useState(false);
  const [host, setHost] = useState(settings.host);
  const [port, setPort] = useState(String(settings.port));

  useEffect(() => {
    setHost(settings.host);
    setPort(String(settings.port));
  }, [settings.host, settings.port]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        title="host/port 설정"
      >
        ⚙ 설정
      </button>
    );
  }

  async function handleSave() {
    const p = Number(port);
    if (!host.trim() || !Number.isInteger(p) || p <= 0 || p > 65535) return;
    await saveSettings({ host: host.trim(), port: p });
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={host}
        onChange={(e) => setHost(e.target.value)}
        placeholder="host"
        className="w-24 rounded border bg-white px-1.5 py-1 font-mono text-xs dark:bg-zinc-900"
      />
      <span className="text-xs text-zinc-400">:</span>
      <input
        value={port}
        onChange={(e) => setPort(e.target.value)}
        placeholder="port"
        className="w-16 rounded border bg-white px-1.5 py-1 font-mono text-xs dark:bg-zinc-900"
      />
      <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>
        저장
      </Button>
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>
        취소
      </Button>
    </div>
  );
}

export default function Home() {
  const { endpoints, selectedKey, loaded, load, select, removeEndpoint, settings } = useEditorStore();
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const splitRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
    }
    function onUp() {
      draggingRef.current = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const selected = endpoints.find((ep) => endpointKey(ep) === selectedKey);
  const baseUrl = buildBaseUrl(settings.host, settings.port);

  if (!loaded || !selected) {
    return <div className="flex h-screen items-center justify-center text-sm text-zinc-400">불러오는 중...</div>;
  }

  const selectedFullPath = `${selected.path}${
    selected.query?.length ? `?${selected.query.map((k) => `${k}=`).join("&")}` : ""
  }`;

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Mockwire</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-zinc-500">storefront</span>
        </div>
        <div className="flex items-center gap-2">
          <HostPortSettings />
          <code className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {baseUrl}
            {selectedFullPath}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${baseUrl}${selectedFullPath}`);
              } catch {
                // 클립보드 권한 없어도 URL은 화면에 이미 보이므로 무시
              }
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "복사됨" : "URL 복사"}
          </Button>
        </div>
      </header>

      {/* 2단 분할 워크스페이스 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바: 엔드포인트 목록 */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r bg-white p-2 dark:bg-zinc-900">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">엔드포인트</span>
            <button
              onClick={() => setAdding((v) => !v)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
            >
              + 추가
            </button>
          </div>

          {adding && <AddEndpointForm onClose={() => setAdding(false)} />}

          {endpoints.map((ep) => {
            const key = endpointKey(ep);
            const isActive = key === selectedKey;
            const displayPath = `${ep.path}${ep.query?.length ? `?${ep.query.join("&")}` : ""}`;
            return (
              <div
                key={key}
                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                  isActive ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <button
                  onClick={() => select(key)}
                  className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
                    ep.active === false ? "opacity-40" : ""
                  }`}
                >
                  <Badge className={`${methodColor[ep.method]} shrink-0 font-mono text-[10px]`}>
                    {ep.method}
                  </Badge>
                  <span className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-300">
                    {displayPath}
                  </span>
                </button>
                <button
                  onClick={() => removeEndpoint(ep)}
                  className="shrink-0 text-xs text-zinc-300 opacity-0 hover:text-red-600 group-hover:opacity-100"
                  title="삭제"
                >
                  ×
                </button>
              </div>
            );
          })}
        </aside>

        {/* 메인: 좌(경로/설정) / 우(응답 에디터) 분할 */}
        <main className="grid flex-1 grid-cols-2 divide-x overflow-hidden">
          <section className="overflow-y-auto p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">경로 설정</h2>
            <div className="flex items-center gap-2">
              <Badge className={`${methodColor[selected.method]} font-mono text-[10px]`}>
                {selected.method}
              </Badge>
              <code className="font-mono text-sm text-zinc-600 dark:text-zinc-300">{selectedFullPath}</code>
            </div>
            <TestCommand endpoint={selected} baseUrl={baseUrl} />
            <ActiveToggle endpoint={selected} />
            <StatefulToggle resource={resourceOf(selected.path)} />
          </section>
          <section className="flex h-full flex-col overflow-hidden p-4">
            <h2 className="mb-3 shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              응답 편집
            </h2>
            <div className="min-h-0 flex-1">
              <ResponseEditor />
            </div>
          </section>
        </main>
      </div>

      <div ref={splitRef} className="flex h-56 shrink-0 border-t">
        <div style={{ flexBasis: `${splitPct}%` }} className="min-w-0 flex-none overflow-hidden">
          <ResourceViewer resource={resourceOf(selected.path)} />
        </div>
        <div
          onMouseDown={() => {
            draggingRef.current = true;
          }}
          className="w-1 shrink-0 cursor-col-resize bg-zinc-200 hover:bg-orange-400 dark:bg-zinc-700"
        />
        <div style={{ flexBasis: `${100 - splitPct}%` }} className="min-w-0 flex-1 overflow-hidden">
          <LogPanel />
        </div>
      </div>
    </div>
  );
}
