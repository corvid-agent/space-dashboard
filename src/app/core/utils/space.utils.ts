/** Format large numbers with abbreviations */
export function formatDistance(km: number): string {
  if (km >= 1_000_000) return (km / 1_000_000).toFixed(1) + 'M km';
  if (km >= 1_000) return (km / 1_000).toFixed(0) + 'K km';
  return km.toFixed(0) + ' km';
}

/** Format distance in lunar distances */
export function formatLunarDistance(ld: number): string {
  return ld.toFixed(1) + ' LD';
}

/** Classify NEO threat based on size and distance */
export function threatLevel(diameterKm: number, distanceKm: number, hazardous: boolean): 'safe' | 'watch' | 'danger' {
  if (hazardous && distanceKm < 7_500_000) return 'danger';
  if (hazardous || distanceKm < 15_000_000) return 'watch';
  return 'safe';
}

/** Solar flare class to severity */
export function flareClassSeverity(classType: string): 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme' {
  if (!classType) return 'minor';
  const letter = classType.charAt(0).toUpperCase();
  switch (letter) {
    case 'X': return 'extreme';
    case 'M': return 'severe';
    case 'C': return 'moderate';
    case 'B': return 'minor';
    default: return 'minor';
  }
}

/** Kp index to geomagnetic storm level */
export function kpToLevel(kp: number | null): string {
  if (kp == null) return 'Unknown';
  if (kp <= 3) return 'Quiet';
  if (kp <= 4) return 'Unsettled';
  if (kp <= 5) return 'Minor Storm';
  if (kp <= 6) return 'Moderate Storm';
  if (kp <= 7) return 'Strong Storm';
  if (kp <= 8) return 'Severe Storm';
  return 'Extreme Storm';
}

/** Format date for display */
export function formatSpaceDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Relative time (e.g., "2 hours ago") */
export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
