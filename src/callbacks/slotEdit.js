const configManager = require('../config/manager');
const scheduler = require('../scheduler');
const { getSession, setSession, clearSession } = require('../utils/session');
const { slotViewKeyboard, timePickerKeyboard, confirmKeyboard } = require('../utils/keyboards');
const { formatSlotInfo } = require('../utils/message');
const logger = require('../utils/logger');

function registerSlotEdit(bot) {
  // Edit text - start wizard
  bot.action(/^slot_edit_text:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) return ctx.answerCbQuery('Слот не знайдено');

    setSession(ctx.from.id, { action: 'edit_text', slotId });
    return ctx.editMessageText(
      `Введіть новий текст для слота ${slotId}:`,
      { reply_markup: { inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `slot_view:${slotId}` }]] } }
    );
  });

  // Edit time - show picker
  bot.action(/^slot_edit_time:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) return ctx.answerCbQuery('Слот не знайдено');

    setSession(ctx.from.id, { action: 'edit_time', slotId });
    return ctx.editMessageText(
      `Оберіть новий час або введіть вручну (HH:MM):`,
      timePickerKeyboard()
    );
  });

  // Time picker callback
  bot.action(/^pick_time:(.+)$/, (ctx) => {
    const time = ctx.match[1];
    const session = getSession(ctx.from.id);

    if (!session) return ctx.answerCbQuery('Сесія закінчилася');

    if (session.action === 'edit_time') {
      const slot = configManager.updateSlot(session.slotId, { time });
      scheduler.reschedule(session.slotId);
      clearSession(ctx.from.id);
      logger.info('Slot time updated', { slotId: session.slotId, time });

      const defaultLink = configManager.getDefaultLink();
      const text = `✅ Час змінено!\n\n${formatSlotInfo(slot, defaultLink)}`;
      return ctx.editMessageText(text, slotViewKeyboard(slot));
    }

    if (session.action === 'add_slot') {
      session.time = time;
      session.step = 'text';
      setSession(ctx.from.id, session);
      return ctx.editMessageText(
        `Час: ${time}\nВведіть текст повідомлення:`,
        { reply_markup: { inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'cancel_add' }]] } }
      );
    }
  });

  // Edit link - start wizard
  bot.action(/^slot_edit_link:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const slot = configManager.getSlot(slotId);
    if (!slot) return ctx.answerCbQuery('Слот не знайдено');

    setSession(ctx.from.id, { action: 'edit_link', slotId });
    return ctx.editMessageText(
      `Введіть нове посилання для слота ${slotId}:`,
      { reply_markup: { inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `slot_view:${slotId}` }]] } }
    );
  });

  // Confirm edit text
  bot.action(/^confirm_edit_text:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const session = getSession(ctx.from.id);
    if (!session || !session.newText) return ctx.answerCbQuery('Сесія закінчилася');

    const slot = configManager.updateSlot(slotId, { text: session.newText });
    clearSession(ctx.from.id);
    logger.info('Slot text updated', { slotId, text: session.newText });

    const defaultLink = configManager.getDefaultLink();
    const text = `✅ Текст змінено!\n\n${formatSlotInfo(slot, defaultLink)}`;
    return ctx.editMessageText(text, slotViewKeyboard(slot));
  });

  // Confirm edit link
  bot.action(/^confirm_edit_link:(.+)$/, (ctx) => {
    const slotId = ctx.match[1];
    const session = getSession(ctx.from.id);
    if (!session || !session.newLink) return ctx.answerCbQuery('Сесія закінчилася');

    const slot = configManager.updateSlot(slotId, { meetingLink: session.newLink });
    clearSession(ctx.from.id);
    logger.info('Slot link updated', { slotId, link: session.newLink });

    const defaultLink = configManager.getDefaultLink();
    const text = `✅ Посилання змінено!\n\n${formatSlotInfo(slot, defaultLink)}`;
    return ctx.editMessageText(text, slotViewKeyboard(slot));
  });
}

module.exports = { registerSlotEdit };
