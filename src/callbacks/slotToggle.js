const configManager = require('../config/manager');
const scheduler = require('../scheduler');
const { slotViewKeyboard } = require('../utils/keyboards');
const { formatSlotInfo } = require('../utils/message');
const logger = require('../utils/logger');

function registerSlotToggle(bot) {
  bot.action(/^slot_toggle:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) return ctx.answerCbQuery('Слот не знайдено');

    const newEnabled = !slot.enabled;
    configManager.updateSlot(slotId, { enabled: newEnabled });
    scheduler.reschedule(slotId);

    logger.info('Slot toggled', { slotId, enabled: newEnabled });

    const updatedSlot = configManager.getSlot(slotId);
    const defaultLink = configManager.getDefaultLink();
    const statusText = newEnabled ? '▶️ Увімкнено' : '⏸ Вимкнено';
    const text = `${statusText}!\n\n${formatSlotInfo(updatedSlot, defaultLink)}`;
    return ctx.editMessageText(text, slotViewKeyboard(updatedSlot));
  });
}

module.exports = { registerSlotToggle };
