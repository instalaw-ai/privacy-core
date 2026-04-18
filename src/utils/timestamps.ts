/**
 * Coarsen a timestamp to the specified precision.
 * Used to minimize metadata exposure — the server stores coarsened timestamps only.
 */
export function coarsenTimestamp(
  date: Date,
  precision: "hour" | "day" = "hour"
): Date {
  const result = new Date(date);

  if (precision === "day") {
    result.setUTCHours(0, 0, 0, 0);
  } else {
    result.setUTCMinutes(0, 0, 0);
  }

  return result;
}

/**
 * Get a coarsened "now" timestamp.
 */
export function coarsenedNow(precision: "hour" | "day" = "hour"): Date {
  return coarsenTimestamp(new Date(), precision);
}

/**
 * Format a coarsened timestamp for display.
 * Intentionally vague — shows "Today", "Yesterday", or date only.
 */
export function formatCoarsenedTimestamp(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
