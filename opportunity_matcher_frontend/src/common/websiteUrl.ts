/** Normalize company website strings into a safe absolute http(s) URL. */
export function normalizeWebsiteUrl(
  raw?: string | null
): string | null {
  const value = String(raw || "").trim();
  if (!value || value.toLowerCase() === "n/a" || value === "-") return null;

  let url = value;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Short display host for tables (e.g. acino.swiss). */
export function websiteDisplayHost(raw?: string | null): string {
  const href = normalizeWebsiteUrl(raw);
  if (!href) return "";
  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return String(raw || "").trim();
  }
}
