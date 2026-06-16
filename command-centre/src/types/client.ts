export interface Client {
  slug: string;
  name: string;
  path: string;
  color: string;
}

const PALETTE = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "var(--error)",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

/**
 * Deterministic color assignment based on slug hash.
 * Simple string hash (djb2) mod palette length.
 */
export function getClientColor(slug: string): string {
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 33) ^ slug.charCodeAt(i);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * Derive a display name from a slug: split on hyphens, capitalize each word.
 */
export function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
