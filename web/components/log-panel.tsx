"use client";

import { useEffect, useState } from "react";

type RequestLog = {
  id: number;
  method: string;
  path: string;
  status: number;
  timestamp: string;
};

export function LogPanel() {
  const [logs, setLogs] = useState<RequestLog[]>([]);

  useEffect(() => {
    const fetchLogs = () =>
      fetch("/api/logs")
        .then((r) => r.json())
        .then(setLogs);

    fetchLogs();
    // ponytail: 1.5초 폴링. 지연 없는 진짜 실시간이 필요해지면 SSE/WebSocket으로 교체
    const interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white dark:bg-zinc-900">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          실시간 요청 로그
        </span>
        <span className="text-xs text-zinc-400">{logs.length}건</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
            <tr className="text-left text-zinc-500">
              <th className="px-4 py-1.5 font-medium">시간</th>
              <th className="px-4 py-1.5 font-medium">메서드</th>
              <th className="px-4 py-1.5 font-medium">경로</th>
              <th className="px-4 py-1.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-1.5 font-mono text-zinc-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-1.5 font-mono">{log.method}</td>
                <td className="px-4 py-1.5 font-mono">{log.path}</td>
                <td
                  className={`px-4 py-1.5 font-mono ${
                    log.status >= 400 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {log.status}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  아직 호출된 요청이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
