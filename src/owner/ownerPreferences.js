const STORAGE_KEY = "owner:dashboardPreferences";
const DEFAULT_PREFERENCES = {
  defaultRange: "30d",
  refreshMinutes: 1,
  sidebarCollapsed: false,
};
const VALID_RANGES = new Set(["7d", "30d", "6m", "12m"]);
const VALID_REFRESH_MINUTES = new Set([0, 1, 5, 15]);

export const getOwnerPreferences = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      defaultRange: VALID_RANGES.has(stored.defaultRange) ? stored.defaultRange : DEFAULT_PREFERENCES.defaultRange,
      refreshMinutes: VALID_REFRESH_MINUTES.has(Number(stored.refreshMinutes))
        ? Number(stored.refreshMinutes)
        : DEFAULT_PREFERENCES.refreshMinutes,
      sidebarCollapsed: typeof stored.sidebarCollapsed === "boolean"
        ? stored.sidebarCollapsed
        : DEFAULT_PREFERENCES.sidebarCollapsed,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

export const saveOwnerPreferences = (updates) => {
  const next = { ...getOwnerPreferences(), ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep the dashboard usable in private browsing or when storage is disabled.
  }
  return next;
};
