const configManager = require('../config/manager');
const { getSession, setSession, clearSession } = require('../utils/session');
const { linkScopeKeyboard, slotListKeyboard } = require('../utils/keyboards');
const logger = require('../utils/logger');

function registerSetLink(bot) {
  bot.action('set_link', (ctx) => {
    const currentLink = configManager.getDefaultLink();
    return ctx.editMessageText(
      `Поточне посилання: ${currentLink || 'не встановлено'}\n\nЗмінити для:`,
      linkScopeKeyboard()
    );
  });

  bot.action('set_link_all', (ctx) => {
    setSession(ctx.from.id, { action: 'set_link_all' });
    return ctx.editMessageText(
      'Введіть нове посилання для всіх слотів:',
      { reply_markup: { inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'set_link' }]] } }
    );
  });

  bot.action('set_link_pick', (ctx) => {
    const slots = configManager.getSlots();
    return ctx.editMessageText('Оберіть слот:', slotListKeyboard(slots));
  });

  bot.action('confirm_set_link_all', (ctx) => {
    const session = getSession(ctx.from.id);
    if (!session || !session.newLink) return ctx.answerCbQuery('Сесія закінчилася');

    configManager.setDefaultLink(session.newLink);
    clearSession(ctx.from.id);
    logger.info('Default meeting link updated', { link: session.newLink });

    return ctx.editMessageText(
      `✅ Посилання для всіх слотів змінено на:\n${session.newLink}`,
      { reply_markup: { inline_keyboard: [[{ text: '← Назад', callback_data: 'main_menu' }]] } }
    );
  });
}

module.exports = { registerSetLink };
