export type EndpointLike = { method: string; path: string; query?: string[] };

// 같은 method+path라도 등록된 쿼리 키 조합(id만/이드+name/...)이 다르면 별개 엔드포인트로 취급.
export function endpointKey(ep: EndpointLike): string {
  const query = ep.query && ep.query.length > 0 ? `?${[...ep.query].sort().join("&")}` : "";
  return `${ep.method} ${ep.path}${query}`;
}
