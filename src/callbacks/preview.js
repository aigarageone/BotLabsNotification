const configManager = require('../config/manager');
const { buildNotificationMessage } = require('../utils/message');

function registerPreview(bot) {
  bot.action(/^slot_preview:(.+)$/, async (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) return ctx.answerCbQuery('Слот не знайдено');

    const defaultLink = configManager.getDefaultLink();
    const { text, extra } = buildNotificationMessage(slot, defaultLink);

    // Send preview as a new message
    await ctx.reply(`👁 Прев'ю слота "${slotId}":`);
    await ctx.reply(text, extra);
    return ctx.answerCbQuery('Прев\'ю відправлено');
  });
}

module.exports = { registerPreview };
