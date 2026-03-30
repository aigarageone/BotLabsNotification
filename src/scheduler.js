const cron = require('node-cron');
const { DateTime } = require('luxon');
const logger = require('./utils/logger');
const configManager = require('./config/manager');
const { buildNotificationMessage } = require('./utils/message');
const { withRetry } = require('./utils/retry');

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.bot = null;
  }

  init(bot) {
    this.bot = bot;
  }

  scheduleAll() {
    this.stopAll();
    const config = configManager.get();
    if (!config.globalEnabled) {
      logger.info('Global notifications disabled, skipping schedule');
      return;
    }

    for (const slot of config.slots) {
      if (slot.enabled) {
        this.scheduleSlot(slot);
      }
    }
    logger.info(`Scheduled ${this.jobs.size} notification slots`);
  }

  scheduleSlot(slot) {
    const [hours, minutes] = slot.time.split(':').map(Number);
    const cronExpr = `${minutes} ${hours} * * 1-5`;
    const timezone = configManager.getTimezone();

    const job = cron.schedule(cronExpr, () => this.sendNotification(slot.id), {
      timezone,
    });

    this.jobs.set(slot.id, job);
    logger.info(`Scheduled slot ${slot.id} at ${slot.time} (${timezone})`);
  }

  reschedule(slotId) {
    const existingJob = this.jobs.get(slotId);
    if (existingJob) {
      existingJob.stop();
      this.jobs.delete(slotId);
    }

    const config = configManager.get();
    if (!config.globalEnabled) return;

    const slot = configManager.getSlot(slotId);
    if (slot && slot.enabled) {
      this.scheduleSlot(slot);
    }
  }

  stopAll() {
    for (const [id, job] of this.jobs) {
      job.stop();
      logger.info(`Stopped job for slot ${id}`);
    }
    this.jobs.clear();
  }

  async sendNotification(slotId) {
    const chatId = configManager.getChatId();
    if (!chatId) {
      logger.warn('No chat ID configured, skipping notification');
      return;
    }

    const config = configManager.get();
    if (!config.globalEnabled) return;

    const slot = configManager.getSlot(slotId);
    if (!slot || !slot.enabled) return;

    const { text, extra } = buildNotificationMessage(slot, config.defaultMeetingLink);

    try {
      await withRetry(
        () => this.bot.telegram.sendMessage(chatId, text, extra),
        `send notification ${slotId}`
      );
      logger.info('Notification sent', { slotId, chatId });
    } catch (err) {
      logger.error('Failed to send notification after retries', {
        slotId,
        chatId,
        error: err.message,
      });
      await this.notifyAdminOnError(slotId, err);
    }
  }

  async notifyAdminOnError(slotId, err) {
    const adminId = configManager.getAdminId();
    if (!adminId || !this.bot) return;

    try {
      await this.bot.telegram.sendMessage(
        adminId,
        `⚠️ Помилка відправки сповіщення "${slotId}": ${err.message}`
      );
    } catch (notifyErr) {
      logger.error('Failed to notify admin about error', { error: notifyErr.message });
    }
  }

  getNextSlot() {
    const config = configManager.get();
    if (!config.globalEnabled) return null;

    const now = DateTime.now().setZone(config.timezone);
    const dayOfWeek = now.weekday; // 1=Mon, 7=Sun

    const enabledSlots = config.slots
      .filter((s) => s.enabled)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (enabledSlots.length === 0) return null;

    // Check if today is a weekday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const currentTime = now.toFormat('HH:mm');
      const todaySlot = enabledSlots.find((s) => s.time > currentTime);
      if (todaySlot) {
        const [h, m] = todaySlot.time.split(':').map(Number);
        const slotTime = now.set({ hour: h, minute: m, second: 0 });
        const minutesUntil = Math.round(slotTime.diff(now, 'minutes').minutes);
        return { slot: todaySlot, minutesUntil };
      }
    }

    // Next weekday's first slot
    let daysToAdd = 1;
    let nextDay = now.plus({ days: daysToAdd });
    while (nextDay.weekday > 5) {
      daysToAdd++;
      nextDay = now.plus({ days: daysToAdd });
    }

    const firstSlot = enabledSlots[0];
    const [h, m] = firstSlot.time.split(':').map(Number);
    const slotTime = nextDay.set({ hour: h, minute: m, second: 0 });
    const minutesUntil = Math.round(slotTime.diff(now, 'minutes').minutes);
    return { slot: firstSlot, minutesUntil };
  }
}

module.exports = new Scheduler();
