const { Telegraf } = require('telegraf');
const logger = require('./utils/logger');
const { adminOnly } = require('./middleware/auth');
const { isAdmin } = require('./middleware/auth');
const { getSession, clearSession, setSession } = require('./utils/session');
const { registerAdminCommand } = require('./commands/admin');
const { registerStatusCommand } = require('./commands/status');
const { registerSetchatCommand } = require('./commands/setchat');
const { registerNextCommand } = require('./commands/next');
const { registerCallbacks } = require('./callbacks/router');
const configManager = require('./config/manager');
const { confirmKeyboard } = require('./utils/keyboards');

function createBot(token) {
  const bot = new Telegraf(token);

  // Error handling
  bot.catch((err, ctx) => {
    logger.error('Bot error', { error: err.message, update: ctx.update });
  });

  // Register commands
  registerAdminCommand(bot, adminOnly);
  registerStatusCommand(bot, adminOnly);
  registerSetchatCommand(bot, adminOnly);
  registerNextCommand(bot);

  // Register callback handlers
  registerCallbacks(bot);

  // Handle text input for wizard sessions
  bot.on('text', (ctx) => {
    if (!isAdmin(ctx)) return;

    const session = getSession(ctx.from.id);
    if (!session) return;

    const text = ctx.message.text;

    switch (session.action) {
      case 'edit_text': {
        session.newText = text;
        setSession(ctx.from.id, session);
        return ctx.reply(
          `Новий текст: "${text}"`,
          confirmKeyboard(`confirm_edit_text:${session.slotId}`, `slot_view:${session.slotId}`)
        );
      }

      case 'edit_link': {
        if (!isValidUrl(text)) {
          return ctx.reply('⚠️ Введіть коректне посилання (https://...)');
        }
        session.newLink = text;
        setSession(ctx.from.id, session);
        return ctx.reply(
          `Нове посилання: ${text}`,
          confirmKeyboard(`confirm_edit_link:${session.slotId}`, `slot_view:${session.slotId}`)
        );
      }

      case 'edit_time': {
        if (!isValidTime(text)) {
          return ctx.reply('⚠️ Введіть час у форматі HH:MM (наприклад, 10:30)');
        }
        const slot = configManager.updateSlot(session.slotId, { time: text });
        const scheduler = require('./scheduler');
        scheduler.reschedule(session.slotId);
        clearSession(ctx.from.id);
        return ctx.reply(`✅ Час слота "${session.slotId}" змінено на ${text}`);
      }

      case 'set_link_all': {
        if (!isValidUrl(text)) {
          return ctx.reply('⚠️ Введіть коректне посилання (https://...)');
        }
        session.newLink = text;
        setSession(ctx.from.id, session);
        return ctx.reply(
          `Нове посилання для всіх: ${text}`,
          confirmKeyboard('confirm_set_link_all', 'set_link')
        );
      }

      case 'add_slot': {
        if (session.step === 'time') {
          if (!isValidTime(text)) {
            return ctx.reply('⚠️ Введіть час у форматі HH:MM (наприклад, 13:00)');
          }
          session.time = text;
          session.step = 'text';
          setSession(ctx.from.id, session);
          return ctx.reply('Введіть текст повідомлення:');
        }

        if (session.step === 'text') {
          session.text = text;
          session.step = 'button';
          setSession(ctx.from.id, session);
          const { yesNoKeyboard } = require('./utils/keyboards');
          return ctx.reply('Додати кнопку з посиланням?', yesNoKeyboard('add_slot_btn_yes', 'add_slot_btn_no'));
        }
        break;
      }
    }
  });

  return bot;
}

function isValidTime(str) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

module.exports = { createBot, isValidTime, isValidUrl };
