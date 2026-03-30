const configManager = require('../config/manager');
const logger = require('../utils/logger');
const scheduler = require('../scheduler');

function registerSetchatCommand(bot, adminOnly) {
  bot.command('setchat', adminOnly, (ctx) => {
    const chatType = ctx.chat.type;
    if (chatType === 'private') {
      return ctx.reply('⚠️ Цю команду потрібно виконати в групі.');
    }

    const chatId = ctx.chat.id;
    configManager.setChatId(chatId);
    logger.info('Chat ID set', { chatId });

    scheduler.scheduleAll();

    return ctx.reply(`✅ Групу прив'язано! Chat ID: ${chatId}`);
  });
}

module.exports = { registerSetchatCommand };
