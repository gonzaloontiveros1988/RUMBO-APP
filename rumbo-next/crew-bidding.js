export const DEFAULT_CREW_BIDDING_PROFILE = Object.freeze({
  primaryDestinations: ["MLE", "VIE", "BUD", "ZAG"],
  secondaryDestinations: ["ALA", "BEG", "OTP"],
  minLayoverHours: 24,
  maxLayoverHours: 48,
  minBlockHours: 50,
  maxBlockHours: 55,
  avoidTurnarounds: true,
  maximizeConsecutiveDaysOff: true,
  maxBids: 15
});

function destinationList(value, fallback) {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  const normalized = [...new Set(items.map(x => String(x || "").trim().toUpperCase()).filter(x => /^[A-Z0-9]{3,4}$/.test(x)))];
  return normalized.length ? normalized.slice(0, 20) : [...fallback];
}

export function normalizeCrewBiddingProfile(raw = {}) {
  const p = raw && typeof raw === "object" ? raw : {};
  const minLayoverHours = Math.max(0, Math.min(168, Number(p.minLayoverHours ?? DEFAULT_CREW_BIDDING_PROFILE.minLayoverHours) || 0));
  const maxLayoverHours = Math.max(minLayoverHours, Math.min(168, Number(p.maxLayoverHours ?? DEFAULT_CREW_BIDDING_PROFILE.maxLayoverHours) || minLayoverHours));
  const minBlockHours = Math.max(0, Math.min(100, Number(p.minBlockHours ?? DEFAULT_CREW_BIDDING_PROFILE.minBlockHours) || 0));
  const maxBlockHours = Math.max(minBlockHours, Math.min(100, Number(p.maxBlockHours ?? DEFAULT_CREW_BIDDING_PROFILE.maxBlockHours) || minBlockHours));
  return {
    primaryDestinations: destinationList(p.primaryDestinations, DEFAULT_CREW_BIDDING_PROFILE.primaryDestinations),
    secondaryDestinations: destinationList(p.secondaryDestinations, DEFAULT_CREW_BIDDING_PROFILE.secondaryDestinations),
    minLayoverHours,
    maxLayoverHours,
    minBlockHours,
    maxBlockHours,
    avoidTurnarounds: p.avoidTurnarounds !== false,
    maximizeConsecutiveDaysOff: p.maximizeConsecutiveDaysOff !== false,
    maxBids: 15
  };
}

export function scoreCrewBid(bid, rawProfile = DEFAULT_CREW_BIDDING_PROFILE) {
  const profile = normalizeCrewBiddingProfile(rawProfile);
  const destination = String(bid?.destination || "").trim().toUpperCase();
  const reasons = [];
  let score = 0;
  if (profile.primaryDestinations.includes(destination)) {
    score += 40;
    reasons.push("Top destination");
  } else if (profile.secondaryDestinations.includes(destination)) {
    score += 28;
    reasons.push("Alternative destination");
  } else if (destination) {
    score += 8;
    reasons.push("Other destination");
  }
  const layover = Number(bid?.layoverHours);
  if (Number.isFinite(layover) && layover > 0) {
    if (layover >= profile.minLayoverHours && layover <= profile.maxLayoverHours) {
      score += 20;
      reasons.push("Layover in preferred range");
    } else {
      score -= 10;
      reasons.push("Layover outside preferred range");
    }
  }
  const block = Number(bid?.blockHours);
  if (Number.isFinite(block) && block > 0) {
    if (block >= profile.minBlockHours && block <= profile.maxBlockHours) {
      score += 20;
      reasons.push("Monthly block target");
    } else {
      score -= 8;
      reasons.push("Outside block target");
    }
  }
  const off = Math.max(0, Math.min(7, Number(bid?.consecutiveDaysOff) || 0));
  if (profile.maximizeConsecutiveDaysOff && off) {
    score += Math.min(12, off * 3);
    reasons.push(off + " consecutive days off");
  }
  if (profile.avoidTurnarounds && bid?.turnaround === true) {
    score -= 30;
    reasons.push("Turnaround avoided");
  }
  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

export function rankCrewBids(bids = [], profile = DEFAULT_CREW_BIDDING_PROFILE) {
  return (Array.isArray(bids) ? bids : [])
    .map((bid, index) => ({ ...bid, ...scoreCrewBid(bid, profile), _index: index }))
    .sort((a, b) => b.score - a.score || a._index - b._index)
    .map((bid, index) => {
      const { _index, ...item } = bid;
      return { ...item, rank: index + 1 };
    });
}

export function summarizeCrewBidHistory(history = []) {
  const records = Array.isArray(history) ? history : [];
  const decided = records.filter(x => x.outcome === "awarded" || x.outcome === "not-awarded");
  const awards = decided.filter(x => x.outcome === "awarded");
  const preferred = awards.filter(x => x.destinationTier === "primary" || x.destinationTier === "secondary");
  return {
    total: records.length,
    decided: decided.length,
    pending: records.length - decided.length,
    awarded: awards.length,
    preferenceAwards: preferred.length,
    satisfactionPct: decided.length ? Math.round(awards.length / decided.length * 100) : null,
    preferredAwardPct: awards.length ? Math.round(preferred.length / awards.length * 100) : null
  };
}
