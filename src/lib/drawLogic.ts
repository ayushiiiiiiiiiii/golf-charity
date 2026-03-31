export interface DrawResult {
  totalPrizePool: number;
  tier5Allocation: number; // Represents the 40% payout bracket
  tier4Allocation: number; // Represents the 35% payout bracket
  tier3Allocation: number; // Represents the 25% payout bracket
  carriedForwardJackpot: number;
  activeSubscriberCount: number;
}

/**
 * PRD Requirement: Core Utility function executing Monthly Draw allocations.
 * Calculates exactly how mathematical splits enforce the 40/35/25 percentages 
 * dynamically against variable active subscriber metrics.
 * 
 * @param activeSubscribers Total tally of securely active memberships
 * @param allocationPerSub The defined minimum dollar contribution dedicated to PRIZE POOLS per user billing
 * @param previousJackpotCarryover Value of unclaimed jackpots carried over from the prior month (Feature requested in PRD)
 */
export function executeMonthlyDraw(
  activeSubscribers: number,
  allocationPerSub: number,
  previousJackpotCarryover: number = 0
): DrawResult {
  
  if (activeSubscribers < 0) throw new Error("Active subscriber counts cannot dip below zero structurally.");
  
  // Base Pool execution from generated network values
  const internalGeneratedPool = activeSubscribers * allocationPerSub;
  const totalPrizePool = internalGeneratedPool + previousJackpotCarryover;

  // Enforce defined Tier Splitting Rules
  const tier5Allocation = totalPrizePool * 0.40; // 5-Number Match rules
  const tier4Allocation = totalPrizePool * 0.35; // 4-Number Match rules
  const tier3Allocation = totalPrizePool * 0.25; // 3-Number Match rules

  return {
    totalPrizePool,
    tier5Allocation,
    tier4Allocation,
    tier3Allocation,
    carriedForwardJackpot: previousJackpotCarryover,
    activeSubscriberCount: activeSubscribers
  };
}
