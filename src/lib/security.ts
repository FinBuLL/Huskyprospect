/**
 * Returns the URL only if it uses http(s); otherwise undefined.
 * Prevents `javascript:` / `data:` URLs from reaching href attributes or prompts.
 */
export function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
