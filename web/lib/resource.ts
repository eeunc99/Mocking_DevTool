export function resourceOf(pathPattern: string): string {
  return pathPattern.split("/").filter(Boolean)[0] ?? "";
}
