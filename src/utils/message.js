const { Markup } = require('telegraf');

function buildNotificationMessage(slot, defaultMeetingLink) {
  const text = slot.text;
  const link = slot.meetingLink || defaultMeetingLink;

  const extra = {};
  if (slot.showButton && link) {
    extra.reply_markup = Markup.inlineKeyboard([
      [Markup.button.url(slot.buttonText || 'Підключитися', link)],
    ]).reply_markup;
  }

  return { text, extra };
}

function formatSlotInfo(slot, defaultMeetingLink) {
  const statusIcon = slot.enabled ? '✅ Увімкнено' : '⏸ Вимкнено';
  const link = slot.meetingLink || defaultMeetingLink || 'не встановлено';
  const buttonInfo = slot.showButton
    ? `Кнопка: ${slot.buttonText || 'Підключитися'} → ${link}`
    : 'Кнопка: вимкнена';

  return [
    `⏰ Слот: ${slot.id} (${slot.time})`,
    `Текст: ${slot.text}`,
    buttonInfo,
    `Статус: ${statusIcon}`,
  ].join('\n');
}

function formatNextMeeting(slot, defaultMeetingLink, minutesUntil) {
  const link = slot.meetingLink || defaultMeetingLink;
  const lines = [
    `📅 Наступна зустріч: ${slot.text.substring(0, 2)} ${slot.id} о ${slot.time}`,
  ];
  if (link) {
    lines.push(`🔗 Підключитися: ${link}`);
  }
  lines.push(`⏱ Через ${minutesUntil} хвилин`);
  return lines.join('\n');
}

module.exports = { buildNotificationMessage, formatSlotInfo, formatNextMeeting };
