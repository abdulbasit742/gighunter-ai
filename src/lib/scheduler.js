// Zero-dependency daily scheduler. Runs a job once per day at a target hour (local time).
// Designed to live inside the always-on server process (PC #1, where Ollama runs).
import { logger } from './logger.js';

function msUntilNext(hour, minute = 0) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

// startDailyJob({ hour, minute, job }) -> returns a stop() function.
export function startDailyJob({ hour = 6, minute = 0, job, name = 'job' }) {
  let timer = null;
  let stopped = false;

  const schedule = () => {
    if (stopped) return;
    const wait = msUntilNext(hour, minute);
    logger.info(`scheduler: "${name}" next run in ${(wait / 3600000).toFixed(1)}h (at ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')})`);
    timer = setTimeout(async () => {
      try { await job(); } catch (e) { logger.error(`scheduler "${name}" failed: ${e.message}`); }
      schedule(); // reschedule for the next day
    }, wait);
    if (timer.unref) timer.unref();
  };

  schedule();
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}
