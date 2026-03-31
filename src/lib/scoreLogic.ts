export interface GolfScore {
  id: string;
  score: number;
  scoreDate: string; // ISO 8601 String
}

/**
 * PRD Requirement: Core Utility function handling the "Rolling 5-Score" logic.
 * Enforces the Stableford format limitations natively in logic and strictly trims array memory
 * allowing only the 5 most recent chronological evaluations to persist inside the state.
 * 
 * @param existingScores The current array of valid user GolfScore interfaces.
 * @param newScore A fresh recording being entered into the system.
 * @returns An updated Array strictly enforcing length bounds (5 max) properly ordered.
 */
export function calculateRollingScores(existingScores: GolfScore[], newScore: GolfScore): GolfScore[] {
  // Enforce Stableford constraints (1-45 range)
  if (newScore.score < 1 || newScore.score > 45) {
    throw new Error('Score must fall within the strictly bounded Stableford format metrics (1-45 range).');
  }

  // 1. Combine new score with the historical persistence
  const combined = [...existingScores, newScore];

  // 2. Sort explicitly by chronological order (Most Recent -> Oldest)
  const sorted = combined.sort((a, b) => new Date(b.scoreDate).getTime() - new Date(a.scoreDate).getTime());

  // 3. Implement PRD "Rolling Logic": Replace oldest score automatically via retention slicing
  return sorted.slice(0, 5);
}
