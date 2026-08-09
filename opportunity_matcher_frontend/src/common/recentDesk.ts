export type RecentDeskItem = {
  kind: "match" | "pursuit";
  matchId: number;
  companyName: string;
  opportunityName: string;
  subtitle?: string;
  openedAt: number;
};

const STORAGE_KEY = "rhq.desk.recent";
const MAX_ITEMS = 8;

export function readRecentDesk(): RecentDeskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x) =>
          x &&
          (x.kind === "match" || x.kind === "pursuit") &&
          typeof x.matchId === "number"
      )
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function pushRecentDesk(
  item: Omit<RecentDeskItem, "openedAt"> & { openedAt?: number }
): void {
  try {
    const next: RecentDeskItem = {
      ...item,
      openedAt: item.openedAt ?? Date.now(),
    };
    const prev = readRecentDesk().filter(
      (x) => !(x.kind === next.kind && x.matchId === next.matchId)
    );
    const merged = [next, ...prev].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* ignore quota / private mode */
  }
}
