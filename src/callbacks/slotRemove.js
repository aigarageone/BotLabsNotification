const configManager = require('../config/manager');
const scheduler = require('../scheduler');
const logger = require('../utils/logger');

function registerSlotRemove(bot) {
  bot.action(/^slot_remove:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) return ctx.answerCbQuery('Слот не знайдено');

    return ctx.editMessageText(
      `⚠️ Видалити слот "${slotId}" (${slot.time})?\nЦю дію неможливо скасувати.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🗑 Так, видалити', callback_data: `confirm_remove:${slotId}` },
              { text: '← Скасувати', callback_data: `slot_view:${slotId}` },
            ],
          ],
        },
      }
    );
  });

  bot.action(/^confirm_remove:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const removed = configManager.removeSlot(slotId);

    if (!removed) return ctx.answerCbQuery('Слот не знайдено');

    // Stop the cron job
    const job = scheduler.jobs.get(slotId);
    if (job) {
      job.stop();
      scheduler.jobs.delete(slotId);
    }

    logger.info('Slot removed', { slotId });

    return ctx.editMessageText(`✅ Слот "${slotId}" видалено.`, {
      reply_markup: { inline_keyboard: [[{ text: '← До списку', callback_data: 'slot_list' }]] },
    });
  });
}

module.exports = { registerSlotRemove };
