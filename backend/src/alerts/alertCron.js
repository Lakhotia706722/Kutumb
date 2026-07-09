/**
 * Alert cron job.
 *
 * Runs the alert sweep once per day at 07:00 AM IST (01:30 UTC).
 * The cron expression "30 1 * * *" means: minute=30, hour=1, every day.
 *
 * We also run the sweep once at startup (after a 5-second delay to let
 * the DB connection settle), so that alerts exist immediately on first boot
 * without waiting until the next morning.
 */

const cron = require('node-cron');
const { runAlertSweep } = require('./alertEngine');

const CRON_SCHEDULE = process.env.ALERT_CRON_SCHEDULE || '30 1 * * *'; // 07:00 IST daily

const runSweep = async (reason) => {
  console.log(`[AlertCron] Running alert sweep (${reason})…`);
  try {
    const summary = await runAlertSweep();
    console.log(
      `[AlertCron] Done. Checked: ${summary.checked}, Created: ${summary.created}, ` +
      `Skipped (existing): ${summary.skipped}, Errors: ${summary.errors}`
    );
  } catch (err) {
    console.error('[AlertCron] Sweep failed:', err);
  }
};

const startAlertCron = () => {
  // Daily scheduled sweep
  cron.schedule(CRON_SCHEDULE, () => runSweep('scheduled'), {
    timezone: 'UTC',
  });

  // Run once on startup after DB is ready
  setTimeout(() => runSweep('startup'), 5000);

  console.log(`[AlertCron] Scheduled daily alert sweep: "${CRON_SCHEDULE}" UTC`);
};

module.exports = { startAlertCron };
