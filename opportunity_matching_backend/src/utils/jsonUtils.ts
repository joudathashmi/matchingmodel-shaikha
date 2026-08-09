// src/utils/jsonUtils.ts
export function safeParseJsonArray(input: unknown): unknown[] {
  // Null / undefined => empty array
  if (input == null) return [];

  // Already an array => return as-is
  if (Array.isArray(input)) return input;

  // Non-string (number/object/etc) => try to JSON.parse its string representation, else return []
  if (typeof input !== "string") {
    try {
      const parsed = JSON.parse(String(input));
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }

  const str = input.trim();
  if (!str) return [];

  // 1) Try direct JSON.parse (best case)
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    /* fallthrough */
  }

  // 2) Try to repair common issues:
  //    - single-quoted items: ['a','b'] -> ["a","b"]
  //    - trailing commas: [ "a", ] -> ["a"]
  try {
    let repaired = str;

    // Replace single-quoted items with valid JSON double-quoted strings
    // e.g. 'Their experience...' -> "Their experience..."
    // This regex replaces only single-quoted groups (not apostrophes inside double-quoted strings).
    repaired = repaired.replace(/'([^']*)'/g, (_m, p1) => JSON.stringify(p1));

    // Remove trailing commas before ] or }
    repaired = repaired.replace(/,(\s*[\]\}])/g, "$1");

    const parsed = JSON.parse(repaired);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    /* fallthrough */
  }

  // 3) Extract quoted substrings (double or single) as fallback
  const items: string[] = [];
  const quotedRe = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = quotedRe.exec(str)) !== null) {
    const value = m[1] ?? m[2] ?? "";
    items.push(value);
  }
  if (items.length > 0) return items;

  // 4) Last resort: strip surrounding brackets and split by comma
  const stripped = str.replace(/^\[|\]$/g, "");
  const parts = stripped
    .split(",")
    .map((p) => p.trim().replace(/^['"]|['"]$/g, ""))
    .filter((p) => p.length > 0);

  return parts;
}
