/**
 * Alert rule configuration.
 *
 * Each rule defines the trigger offsets (days before expiry) for a specific
 * document category + title-keyword combination.
 *
 * Matching logic (in order):
 *  1. Check titleKeywords — if any keyword matches the document title (case-insensitive), use that rule.
 *  2. Fall back to the category rule.
 *  3. Fall back to the generic rule.
 *
 * Adding a new rule in the future: just add an entry here. The cron engine
 * picks it up on next run without any code changes elsewhere.
 *
 * 🚩 FOUNDER NOTE: These offsets come directly from the business plan.
 *    Adjust weights/offsets here once you have real user feedback — the
 *    cron engine will re-apply on the next daily sweep.
 */

const rules = [
  // ── Insurance ──────────────────────────────────────────────────────────────
  {
    category: 'Insurance',
    titleKeywords: ['motor', 'car', 'bike', 'vehicle', 'two-wheeler', 'four-wheeler'],
    offsets: [45, 15, 3],
    label: 'Motor insurance',
  },
  {
    category: 'Insurance',
    titleKeywords: ['health', 'mediclaim', 'medical', 'family floater'],
    offsets: [60, 30, 7],
    label: 'Health insurance',
  },
  {
    category: 'Insurance',
    titleKeywords: ['life', 'term', 'ulip', 'endowment'],
    offsets: [60, 30, 7],
    label: 'Life insurance',
  },
  // Generic insurance fallback
  {
    category: 'Insurance',
    titleKeywords: [],
    offsets: [45, 15, 3],
    label: 'Insurance policy',
  },

  // ── Vehicles ───────────────────────────────────────────────────────────────
  {
    category: 'Vehicles',
    titleKeywords: ['puc', 'pollution', 'emission'],
    offsets: [20, 7],
    label: 'PUC certificate',
  },
  {
    category: 'Vehicles',
    titleKeywords: ['rc', 'registration', 'fitness'],
    offsets: [60, 30, 7],
    label: 'Vehicle registration',
  },
  // Generic vehicles fallback
  {
    category: 'Vehicles',
    titleKeywords: [],
    offsets: [30, 7],
    label: 'Vehicle document',
  },

  // ── Investments ────────────────────────────────────────────────────────────
  {
    category: 'Investments',
    titleKeywords: ['fd', 'fixed deposit', 'recurring deposit', 'rd', 'maturity'],
    offsets: [30],
    label: 'FD / RD maturity',
  },
  // Generic investments fallback
  {
    category: 'Investments',
    titleKeywords: [],
    offsets: [30, 7],
    label: 'Investment document',
  },

  // ── Government IDs ─────────────────────────────────────────────────────────
  {
    category: 'Government IDs',
    titleKeywords: ['passport'],
    offsets: [180, 90, 30],
    label: 'Passport',
  },
  {
    category: 'Government IDs',
    titleKeywords: ['driving licence', 'driving license', 'dl', "driver's licence"],
    offsets: [90, 30],
    label: 'Driving licence',
  },
  // Generic govt ID fallback
  {
    category: 'Government IDs',
    titleKeywords: [],
    offsets: [60, 30],
    label: 'Government ID',
  },

  // ── Property / Legal / Education ───────────────────────────────────────────
  {
    category: 'Property',
    titleKeywords: [],
    offsets: [30, 7],
    label: 'Property document',
  },
  {
    category: 'Legal',
    titleKeywords: [],
    offsets: [30, 7],
    label: 'Legal document',
  },
  {
    category: 'Education',
    titleKeywords: [],
    offsets: [30, 7],
    label: 'Education document',
  },
];

/**
 * Returns the alert offsets (days-before-expiry array) for a given document.
 * Also returns the matched rule label for use in alert messages.
 */
const getRule = (category, title) => {
  const titleLower = (title || '').toLowerCase();

  // Try category+keyword match first
  for (const rule of rules) {
    if (rule.category !== category) continue;
    if (rule.titleKeywords.length === 0) continue; // skip generic fallbacks in this pass
    if (rule.titleKeywords.some((kw) => titleLower.includes(kw))) {
      return { offsets: rule.offsets, label: rule.label };
    }
  }

  // Category fallback (empty titleKeywords = catch-all for that category)
  for (const rule of rules) {
    if (rule.category === category && rule.titleKeywords.length === 0) {
      return { offsets: rule.offsets, label: rule.label };
    }
  }

  // Final generic fallback
  return { offsets: [30, 7], label: 'Document' };
};

module.exports = { getRule, rules };
