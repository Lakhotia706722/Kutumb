/**
 * Alert Engine
 *
 * Responsible for scanning all documents with an expiryDate and
 * creating/updating Alert records according to the rules in alertRules.js.
 *
 * Design decisions:
 *  - Uses upsert (updateOne with upsert:true) so re-running the sweep is
 *    idempotent — safe to call multiple times without duplicating alerts.
 *  - Only creates alerts for documents whose expiryDate is in the future
 *    OR already passed (overdue alerts are still surfaced on the Feed with
 *    a special "Expired" message).
 *  - Does NOT touch alerts that are already resolved or dismissed.
 *  - When a document is deleted, its alerts are cascade-deleted via a
 *    separate cleanup call (deleteAlertsForDocument).
 *
 * 🚩 FOUNDER DECISION (answered in Phase 3 prompt):
 *   Documents with no expiryDate are skipped silently for now.
 *   A "please add expiry date" nudge alert is NOT generated automatically
 *   in this MVP — the Inheritance Readiness Score (Phase 5) will penalise
 *   missing dates instead, which is a lighter-weight signal.
 *   Revisit after first user cohort.
 */

const Document = require('../models/Document');
const Alert = require('../models/Alert');
const { getRule } = require('./alertRules');

/**
 * Builds the alert message shown on the Feed card.
 */
const buildMessage = (label, docTitle, daysBeforeExpiry, expiryDate) => {
  const expStr = expiryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (daysBeforeExpiry <= 0) {
    return `${docTitle} has expired (was due ${expStr})`;
  }
  if (daysBeforeExpiry <= 3) {
    return `${docTitle} expires in ${daysBeforeExpiry} day${daysBeforeExpiry === 1 ? '' : 's'} — renew now`;
  }
  if (daysBeforeExpiry <= 7) {
    return `${docTitle} expires on ${expStr} — renew this week`;
  }
  if (daysBeforeExpiry <= 30) {
    return `${docTitle} expires on ${expStr} — renewal due soon`;
  }
  return `${docTitle} expires on ${expStr} — plan ahead`;
};

/**
 * Main sweep function.
 * Scans all dated documents and upserts alert records.
 * Returns a summary { checked, created, skipped }.
 */
const runAlertSweep = async () => {
  const summary = { checked: 0, created: 0, skipped: 0, errors: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only fetch documents that have an expiryDate
  const docs = await Document.find({ expiryDate: { $ne: null } })
    .select('_id family category title expiryDate')
    .lean();

  for (const doc of docs) {
    summary.checked++;
    try {
      const { offsets } = getRule(doc.category, doc.title);

      for (const daysBefore of offsets) {
        const triggerDate = new Date(doc.expiryDate);
        triggerDate.setDate(triggerDate.getDate() - daysBefore);
        triggerDate.setHours(0, 0, 0, 0);

        const message = buildMessage(
          doc.category,
          doc.title,
          Math.ceil((doc.expiryDate - today) / (1000 * 60 * 60 * 24)),
          new Date(doc.expiryDate)
        );

        // Upsert: create if not exists, but NEVER overwrite status on existing alerts.
        // $setOnInsert: fields that only make sense at creation time.
        // $set: fields that should refresh if the document title/expiry changes.
        // IMPORTANT: a field cannot appear in both operators — MongoDB will reject it.
        const result = await Alert.updateOne(
          { document: doc._id, daysBeforeExpiry: daysBefore },
          {
            $setOnInsert: {
              family: doc.family,
              document: doc._id,
              daysBeforeExpiry: daysBefore,
              status: 'pending',
            },
            $set: {
              message,
              triggerDate,
            },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) summary.created++;
        else summary.skipped++;
      }
    } catch (err) {
      summary.errors++;
      console.error(`[AlertEngine] Error processing doc ${doc._id}:`, err.message);
    }
  }

  return summary;
};

/**
 * Cascade-delete all alerts for a document.
 * Called by documentController when a document is deleted.
 */
const deleteAlertsForDocument = async (documentId) => {
  await Alert.deleteMany({ document: documentId });
};

module.exports = { runAlertSweep, deleteAlertsForDocument };
