const COMPLETED_PREFIX = "rhq.tour.completed.";
const PENDING_KEY = "rhq.tour.pending";

export function tourStorageKey(userId: string) {
  return `${COMPLETED_PREFIX}${userId}`;
}

export function hasCompletedTour(userId: string): boolean {
  try {
    return localStorage.getItem(tourStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markTourCompleted(userId: string) {
  try {
    localStorage.setItem(tourStorageKey(userId), "1");
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function clearTourCompleted(userId: string) {
  try {
    localStorage.removeItem(tourStorageKey(userId));
  } catch {
    /* ignore */
  }
}

/** Set on login so the tour can start after redirect into the app. */
export function markTourPending() {
  try {
    localStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeTourPending(): boolean {
  try {
    const pending = localStorage.getItem(PENDING_KEY) === "1";
    if (pending) localStorage.removeItem(PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
}
