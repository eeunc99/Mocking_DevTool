// "{{params.id}}" / "{{body.name}}" 처럼 점(.)으로 이어진 경로의 문자열 값만 치환한다.
// 문자열 중간 삽입은 지원하지 않음 — 필요해지면 그때 확장.
export function renderTemplate(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    const m = value.match(/^\{\{(\w+(?:\.\w+)*)\}\}$/);
    if (!m) return value;
    const resolved = m[1].split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
      return undefined;
    }, context);
    return resolved ?? value;
  }
  if (Array.isArray(value)) return value.map((v) => renderTemplate(v, context));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, renderTemplate(v, context)])
    );
  }
  return value;
}
