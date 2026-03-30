const configManager = require('../config/manager');
const { mainMenu } = require('../utils/keyboards');

function registerAdminCommand(bot, adminOnly) {
  const handler = (ctx) => {
    const config = configManager.get();
    return ctx.reply('🔧 Панель управління BotLabs Notifier', mainMenu(config.globalEnabled));
  };

  bot.command('admin', adminOnly, handler);
  bot.command('start', adminOnly, handler);
}

module.exports = { registerAdminCommand };
