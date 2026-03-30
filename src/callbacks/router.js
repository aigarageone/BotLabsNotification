const { adminCallbackOnly } = require('../middleware/auth');
const { registerSlotList } = require('./slotList');
const { registerSlotEdit } = require('./slotEdit');
const { registerSlotToggle } = require('./slotToggle');
const { registerSlotAdd } = require('./slotAdd');
const { registerSlotRemove } = require('./slotRemove');
const { registerSetLink } = require('./setLink');
const { registerToggleAll } = require('./toggleAll');
const { registerPreview } = require('./preview');
const configManager = require('../config/manager');
const { mainMenu } = require('../utils/keyboards');

function registerCallbacks(bot) {
  // All admin callbacks go through auth check
  bot.on('callback_query', adminCallbackOnly, () => {});

  // Main menu
  bot.action('main_menu', (ctx) => {
    const config = configManager.get();
    return ctx.editMessageText(
      '🔧 Панель управління BotLabs Notifier',
      mainMenu(config.globalEnabled)
    );
  });

  // Status from button
  bot.action('status', (ctx) => {
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

    return ctx.editMessageText(text, {
      reply_markup: { inline_keyboard: [[{ text: '← Назад', callback_data: 'main_menu' }]] },
    });
  });

  // Bind group reminder
  bot.action('bind_group', (ctx) => {
    return ctx.editMessageText(
      '📡 Щоб прив\'язати групу, напишіть /setchat у потрібній групі.',
      { reply_markup: { inline_keyboard: [[{ text: '← Назад', callback_data: 'main_menu' }]] } }
    );
  });

  registerSlotList(bot);
  registerSlotEdit(bot);
  registerSlotToggle(bot);
  registerSlotAdd(bot);
  registerSlotRemove(bot);
  registerSetLink(bot);
  registerToggleAll(bot);
  registerPreview(bot);
}

module.exports = { registerCallbacks };
