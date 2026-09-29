import type { Endpoint } from "./store";

export const PROJECT_KEY = "a1x9k2";
const SAMPLE_VALUE = "42";

export function buildBaseUrl(host: string, port: number): string {
  return `http://${host}:${port}/p/${PROJECT_KEY}`;
}

export function hasPathParam(path: string): boolean {
  return /:[A-Za-z_][\w]*/.test(path);
}

export function hasSampleValue(ep: Endpoint): boolean {
  return hasPathParam(ep.path) || (ep.query ?? []).length > 0;
}

export function buildTestCommand(ep: Endpoint, baseUrl: string): string {
  const path = ep.path.replace(/:[A-Za-z_][\w]*/g, SAMPLE_VALUE);
  const qs = (ep.query ?? []).map((k) => `${k}=${SAMPLE_VALUE}`).join("&");
  const url = `${baseUrl}${path}${qs ? `?${qs}` : ""}`;

  switch (ep.method) {
    case "GET":
      return `Invoke-RestMethod -Uri ${url}`;
    case "POST":
      return `Invoke-RestMethod -Uri ${url} -Method Post -ContentType "application/json" -Body '{"name":"choi"}'`;
    case "PUT":
      return `Invoke-RestMethod -Uri ${url} -Method Put -ContentType "application/json" -Body '{"name":"updated"}'`;
    case "DELETE":
      return `Invoke-RestMethod -Uri ${url} -Method Delete`;
    default:
      return `Invoke-RestMethod -Uri ${url}`;
  }
}
