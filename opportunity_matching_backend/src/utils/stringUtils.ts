// utils/stringUtils.ts
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseAiExplanation(explanation?: string | null): string[] {
  if (!explanation) return [];

  const lines = explanation
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Case 1: numbered list like "1. text"
  const numbered = lines
    .map((line) => {
      const match = line.match(/^\d+\.\s*(.*)$/);
      return match ? match[1].trim() : null;
    })
    .filter((l): l is string => !!l);

  if (numbered.length > 0) {
    return numbered;
  }

  // Case 2: fallback → split into sentences
  return explanation
    .split(/\. (?=[A-Z])/g) // split on ". " followed by capital letter
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.endsWith(".") ? s : s + "."));
}

export function parseAiExplanationNew(explanation?: string | null): string[] {
  if (!explanation) return [];

  try {
    let normalized = explanation;

    // Step 1: Quote top-level keys (handles spaces too)
    normalized = normalized.replace(/([A-Za-z ]+):\s*{/g, (_, key) => {
      return `"${key.trim()}": {`;
    });

    // Step 2: Replace 'analysis' with "analysis"
    normalized = normalized.replace(/'analysis'/g, `"analysis"`);

    // Step 3: Convert outer single quotes around values into double quotes
    // This safely handles blocks like: {'analysis': "some text"}
    normalized = normalized.replace(/'\s*:\s*'/g, `": "`); // handles key: 'value'
    normalized = normalized.replace(/':\s*"/g, `": "`); // handles 'analysis': "

    // Step 4: Replace opening {'
    normalized = normalized.replace(/{'/g, `{"`);

    // Step 5: Replace '} with "}
    normalized = normalized.replace(/'}/g, `"}`);

    // Step 6: Ensure outer braces
    if (!normalized.trim().startsWith("{")) {
      normalized = `{${normalized}}`;
    }

    // Step 7: Fix missing commas between sections
    normalized = normalized.replace(/}\s*"/g, `}, "`);
    const parsed = JSON.parse(normalized);

    const justifications: string[] = [];
    for (const key of Object.keys(parsed)) {
      if (parsed[key]?.analysis) {
        justifications.push(parsed[key].analysis);
      }
    }

    return justifications;
  } catch (err) {
    console.error("Failed to parse AI explanation:", err);
    return [];
  }
}


export function parseProductServices(raw: string | null | undefined) {
  if (!raw) return [];

  // // Replace weird characters with normal dash
  // const cleaned = raw.replace(/‚Äö√Ñ√¨/g, "-").replace(/‚Äö√Ñ√¥/g, "'");

  const cleaned = raw

  // Split by | to separate categories
  return cleaned.split("|").map((part) => {
    const [title, ...descParts] = part.split(":");
    return {
      title: title?.trim(),
      description: descParts.join(":").replace(/\s+/g, " ").trim(),
    };
  });
}

export function parseDescription(insightType: string, desc: string) {
  if (!desc) {
    return { title: toTitleCase(insightType), description: "" };
  }

  const colonIndex = desc.indexOf(":");
  if (colonIndex > -1) {
    const beforeColon = desc.slice(0, colonIndex).trim();
    const afterColon = desc.slice(colonIndex + 1).trim();

    const lastPeriod = beforeColon.lastIndexOf(".");
    let extractedTitle =
      lastPeriod > -1
        ? beforeColon.slice(0, lastPeriod).trim()
        : beforeColon;

    let extractedDesc =
      lastPeriod > -1
        ? beforeColon.slice(lastPeriod + 1).trim() + ": " + afterColon
        : afterColon;

    if (extractedTitle.length > 60) {
      return { title: toTitleCase(insightType), description: desc.trim() };
    }

    return {
      title: toTitleCase(extractedTitle),
      description: extractedDesc,
    };
  }

  return { title: toTitleCase(insightType), description: desc.trim() };
}

export function normalizeArrayString(input?: string | null): string | null {
  if (!input) return null;

  let str = input.trim();

  // Try parsing as JSON array first
  try {
    // Replace single quotes with double quotes so JSON.parse works
    const jsonReady = str.replace(/'/g, '"');
    const parsed = JSON.parse(jsonReady);

    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }
  } catch {
    /* ignore and fallback */
  }

  // Remove surrounding brackets if present
  str = str.replace(/^\[|\]$/g, "");

  // Remove leading/trailing quotes
  str = str.replace(/^['"]|['"]$/g, "");

  return str;
}
