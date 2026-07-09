/**
 * Inheritance Readiness Score Engine
 *
 * Produces a 0–100 score from the family's vault state.
 * The score is computed live on each request (no caching for MVP — see note below).
 *
 * 🚩 FOUNDER DECISION (Phase 5 prompt):
 *   Storing/caching vs live computation.
 *   Decision: LIVE computation for MVP.
 *   Reason: At MVP scale (< 1000 families), each score call reads at most
 *   a few dozen documents and a membership count — negligible DB load.
 *   Caching adds a staleness problem (score lags behind vault changes) and
 *   cache-invalidation complexity that isn't worth it yet.
 *   Revisit when p99 latency on /api/score exceeds 200ms.
 *
 * SCORING RUBRIC (v1 — weights are intentionally visible and tunable):
 *
 *   PILLAR 1 — Vault Coverage (40 pts total)
 *     Property docs present           +10
 *     Insurance docs present          +10
 *     Government ID docs present      +10
 *     Legal docs present              +10
 *
 *   PILLAR 2 — Document Health (30 pts total)
 *     No expired documents            +15   (lose 3 pts per expired doc, min 0)
 *     No critical expiries (≤7 days)  +15   (lose 5 pts per critical doc, min 0)
 *
 *   PILLAR 3 — Family Access (20 pts total)
 *     More than one member in vault   +20
 *
 *   PILLAR 4 — Critical Documents (10 pts total)
 *     Will / POA document present     +5
 *     Investment records present      +5
 *
 * Total possible: 100
 *
 * The "what's missing" hints tell the user exactly which pillar to improve.
 */

const Document = require('../models/Document');
const FamilyMembership = require('../models/FamilyMembership');

const computeScore = async (familyId) => {
  const [docs, memberCount] = await Promise.all([
    Document.find({ family: familyId })
      .select('category title expiryDate renewalRequired')
      .lean(),
    FamilyMembership.countDocuments({ family: familyId }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Categorise docs ────────────────────────────────────────────────────────
  const byCategory = {};
  for (const doc of docs) {
    if (!byCategory[doc.category]) byCategory[doc.category] = [];
    byCategory[doc.category].push(doc);
  }

  const hasCategory = (cat) => (byCategory[cat]?.length ?? 0) > 0;

  // Expiry helpers
  const daysUntil = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const expiredDocs   = docs.filter(d => { const n = daysUntil(d.expiryDate); return n !== null && n < 0; });
  const criticalDocs  = docs.filter(d => { const n = daysUntil(d.expiryDate); return n !== null && n >= 0 && n <= 7; });

  // ── Score components ───────────────────────────────────────────────────────
  const breakdown = [];
  let score = 0;

  // PILLAR 1 — Vault Coverage
  const coverageItems = [
    { label: 'Property documents', category: 'Property',       points: 10,
      hintLabel: 'property document (sale deed, agreement)' },
    { label: 'Insurance policies', category: 'Insurance',      points: 10,
      hintLabel: 'insurance policy (health, life, or motor)' },
    { label: 'Government IDs',     category: 'Government IDs', points: 10,
      hintLabel: 'government ID (passport, Aadhaar, PAN, driving licence)' },
    { label: 'Legal documents',    category: 'Legal',          points: 10,
      hintLabel: 'legal documents (Will, POA)' },
  ];
  for (const item of coverageItems) {
    const earned = hasCategory(item.category) ? item.points : 0;
    score += earned;
    breakdown.push({
      pillar: 'Vault Coverage',
      label: item.label,
      earned,
      max: item.points,
      done: earned === item.points,
      hint: earned === 0 ? `Add at least one ${(item.hintLabel || item.label.toLowerCase())}` : null,
    });
  }

  // PILLAR 2 — Document Health
  const expiredPenalty  = Math.min(15, expiredDocs.length * 3);
  const criticalPenalty = Math.min(15, criticalDocs.length * 5);

  const healthExpired  = Math.max(0, 15 - expiredPenalty);
  const healthCritical = Math.max(0, 15 - criticalPenalty);
  score += healthExpired + healthCritical;

  breakdown.push({
    pillar: 'Document Health',
    label: 'No expired documents',
    earned: healthExpired,
    max: 15,
    done: expiredDocs.length === 0,
    hint: expiredDocs.length > 0
      ? `${expiredDocs.length} document${expiredDocs.length > 1 ? 's have' : ' has'} expired — renew or remove ${expiredDocs.length > 1 ? 'them' : 'it'}`
      : null,
  });
  breakdown.push({
    pillar: 'Document Health',
    label: 'No critical expiries',
    earned: healthCritical,
    max: 15,
    done: criticalDocs.length === 0,
    hint: criticalDocs.length > 0
      ? `${criticalDocs.length} document${criticalDocs.length > 1 ? 's expire' : ' expires'} within 7 days`
      : null,
  });

  // PILLAR 3 — Family Access
  const familyAccessPoints = memberCount > 1 ? 20 : 0;
  score += familyAccessPoints;
  breakdown.push({
    pillar: 'Family Access',
    label: 'Second family member has access',
    earned: familyAccessPoints,
    max: 20,
    done: memberCount > 1,
    hint: memberCount <= 1 ? 'Invite your spouse or another family member to the vault' : null,
  });

  // PILLAR 4 — Critical Documents
  const hasLegal       = hasCategory('Legal');
  const hasInvestments = hasCategory('Investments');

  score += hasLegal       ? 5 : 0;
  score += hasInvestments ? 5 : 0;

  breakdown.push({
    pillar: 'Critical Documents',
    label: 'Will or Power of Attorney present',
    earned: hasLegal ? 5 : 0,
    max: 5,
    done: hasLegal,
    hint: !hasLegal ? 'Upload your Will or Power of Attorney document' : null,
  });
  breakdown.push({
    pillar: 'Critical Documents',
    label: 'Investment records present',
    earned: hasInvestments ? 5 : 0,
    max: 5,
    done: hasInvestments,
    hint: !hasInvestments ? 'Add FD, SIP, or other investment documents' : null,
  });

  // ── Single top hint ────────────────────────────────────────────────────────
  // Surface the single most impactful missing item — the one with the highest
  // unrealised points — so the UI can show a concise call to action.
  const gaps = breakdown
    .filter(b => !b.done)
    .sort((a, b) => (b.max - b.earned) - (a.max - a.earned));

  const topHint = gaps.length > 0 ? gaps[0].hint : null;
  const topHintPoints = gaps.length > 0 ? gaps[0].max - gaps[0].earned : 0;

  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    breakdown,
    topHint,
    topHintPoints,
    meta: {
      totalDocuments: docs.length,
      memberCount,
      expiredCount: expiredDocs.length,
      criticalCount: criticalDocs.length,
    },
  };
};

module.exports = { computeScore };
