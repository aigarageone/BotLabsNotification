const configManager = require('../config/manager');
const scheduler = require('../scheduler');
const { getSession, setSession, clearSession } = require('../utils/session');
const { timePickerKeyboard, confirmKeyboard, yesNoKeyboard } = require('../utils/keyboards');
const logger = require('../utils/logger');

function registerSlotAdd(bot) {
  // Start add wizard
  bot.action('slot_add', (ctx) => {
    setSession(ctx.from.id, { action: 'add_slot', step: 'time' });
    return ctx.editMessageText(
      'Оберіть час або введіть вручну (HH:MM):',
      timePickerKeyboard()
    );
  });

  // Ask about button
  bot.action('add_slot_btn_yes', (ctx) => {
    const session = getSession(ctx.from.id);
    if (!session || session.action !== 'add_slot') return ctx.answerCbQuery('Сесія закінчилася');

    session.showButton = true;
    session.step = 'confirm';
    setSession(ctx.from.id, session);

    const summary = buildSummary(session);
    return ctx.editMessageText(summary, confirmKeyboard('confirm_add_slot', 'cancel_add'));
  });

  bot.action('add_slot_btn_no', (ctx) => {
    const session = getSession(ctx.from.id);
    if (!session || session.action !== 'add_slot') return ctx.answerCbQuery('Сесія закінчилася');

    session.showButton = false;
    session.step = 'confirm';
    setSession(ctx.from.id, session);

    const summary = buildSummary(session);
    return ctx.editMessageText(summary, confirmKeyboard('confirm_add_slot', 'cancel_add'));
  });

  // Confirm add
  bot.action('confirm_add_slot', (ctx) => {
    const session = getSession(ctx.from.id);
    if (!session || session.action !== 'add_slot') return ctx.answerCbQuery('Сесія закінчилася');

    const slotId = `slot_${session.time.replace(':', '')}`;
    const newSlot = {
      id: slotId,
      time: session.time,
      text: session.text,
      showButton: session.showButton,
      buttonText: session.showButton ? 'Підключитися' : null,
      meetingLink: null,
      enabled: true,
    };

    configManager.addSlot(newSlot);
    scheduler.reschedule(slotId);
    clearSession(ctx.from.id);

    logger.info('Slot added', { slotId, time: session.time });

    return ctx.editMessageText(
      `✅ Слот створено!\n\n⏰ ${session.time} | ${session.text}`,
      { reply_markup: { inline_keyboard: [[{ text: '← До списку', callback_data: 'slot_list' }]] } }
    );
  });

  // Cancel
  bot.action('cancel_add', (ctx) => {
    clearSession(ctx.from.id);
    return ctx.editMessageText('❌ Скасовано.', {
      reply_markup: { inline_keyboard: [[{ text: '← Назад', callback_data: 'main_menu' }]] },
    });
  });
}

function buildSummary(session) {
  return [
    'Новий слот:',
    `🕐 ${session.time} | ${session.text}`,
    `Кнопка: ${session.showButton ? 'Так' : 'Ні'}`,
  ].join('\n');
}

module.exports = { registerSlotAdd };
