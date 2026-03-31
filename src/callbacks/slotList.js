const configManager = require('../config/manager');
const { slotListKeyboard, slotViewKeyboard } = require('../utils/keyboards');
const { formatSlotInfo } = require('../utils/message');

function registerSlotList(bot) {
  bot.action('slot_list', (ctx) => {
    const slots = configManager.getSlots();
    if (slots.length === 0) {
      return ctx.editMessageText('Немає слотів. Додайте через ➕ Додати слот.', {
        reply_markup: { inline_keyboard: [[{ text: '← Назад', callback_data: 'main_menu' }]] },
      });
    }
    return ctx.editMessageText('Оберіть слот для редагування:', slotListKeyboard(slots));
  });

  bot.action(/^slot_view:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) {
      return ctx.answerCbQuery('Слот не знайдено');
    }

    const defaultLink = configManager.getDefaultLink();
    const text = formatSlotInfo(slot, defaultLink);
    return ctx.editMessageText(text, slotViewKeyboard(slot));
  });
}

module.exports = { registerSlotList };
