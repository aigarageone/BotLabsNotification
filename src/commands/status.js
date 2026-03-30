const configManager = require('../config/manager');

function registerStatusCommand(bot, adminOnly) {
  bot.command('status', adminOnly, (ctx) => {
    const config = configManager.get();
    const globalStatus = config.globalEnabled ? '▶️ Активний' : '⏸ На паузі';
    const chatStatus = config.chatId ? `✅ ${config.chatId}` : '❌ Не встановлено';

    const slotLines = config.slots.map((s) => {
      const icon = s.enabled ? '✅' : '⏸';
      return `  ${icon} ${s.time} — ${s.id}`;
    });

    const text = [
      `📊 Статус BotLabs Notifier`,
      ``,
      `Бот: ${globalStatus}`,
      `Група: ${chatStatus}`,
      `Посилання: ${config.defaultMeetingLink || 'не встановлено'}`,
      `Таймзона: ${config.timezone}`,
      ``,
      `Слоти (${config.slots.length}):`,
      ...slotLines,
    ].join('\n');

    return ctx.reply(text);
  });
}

module.exports = { registerStatusCommand };
