const configManager = require('../config/manager');
const scheduler = require('../scheduler');
const { mainMenu } = require('../utils/keyboards');
const logger = require('../utils/logger');

function registerToggleAll(bot) {
  bot.action('toggle_all', (ctx) => {
    const config = configManager.get();

    if (config.globalEnabled) {
      // Show confirmation before pausing
      return ctx.editMessageText(
        '⚠️ Вимкнути ВСІ сповіщення?\nБот перестане відправляти повідомлення в групу.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⏸ Так, поставити на паузу', callback_data: 'confirm_pause_all' },
                { text: '← Скасувати', callback_data: 'main_menu' },
              ],
            ],
          },
        }
      );
    }

    // Resume all
    configManager.setGlobalEnabled(true);
    scheduler.scheduleAll();
    logger.info('All notifications resumed');

    return ctx.editMessageText(
      '▶️ Всі сповіщення відновлено!',
      mainMenu(true)
    );
  });

  bot.action('confirm_pause_all', (ctx) => {
    configManager.setGlobalEnabled(false);
    scheduler.stopAll();
    logger.info('All notifications paused');

    return ctx.editMessageText(
      '⏸ Всі сповіщення поставлено на паузу.',
      mainMenu(false)
    );
  });
}

module.exports = { registerToggleAll };
