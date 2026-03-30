const scheduler = require('../scheduler');
const configManager = require('../config/manager');
const { formatNextMeeting } = require('../utils/message');

function registerNextCommand(bot) {
  bot.command('next', (ctx) => {
    const result = scheduler.getNextSlot();
    if (!result) {
      return ctx.reply('📅 Наразі немає запланованих зустрічей.');
    }

    const { slot, minutesUntil } = result;
    const defaultLink = configManager.getDefaultLink();
    const text = formatNextMeeting(slot, defaultLink, minutesUntil);
    return ctx.reply(text);
  });
}

module.exports = { registerNextCommand };
