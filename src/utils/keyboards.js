const { Markup } = require('telegraf');

function mainMenu(globalEnabled) {
  const pauseBtn = globalEnabled
    ? Markup.button.callback('⏸ Пауза всіх', 'toggle_all')
    : Markup.button.callback('▶️ Відновити всі', 'toggle_all');

  return Markup.inlineKeyboard([
    [Markup.button.callback('📋 Список слотів', 'slot_list'),
     Markup.button.callback('➕ Додати слот', 'slot_add')],
    [Markup.button.callback('🔗 Змінити посилання', 'set_link'),
     pauseBtn],
    [Markup.button.callback('📡 Прив\'язати групу', 'bind_group'),
     Markup.button.callback('ℹ️ Статус', 'status')],
  ]);
}

function slotListKeyboard(slots) {
  const buttons = slots.map((slot) => {
    const statusIcon = slot.enabled ? '✅' : '⏸';
    const label = `${slot.text.substring(0, 2)} ${slot.time} — ${slot.id} ${statusIcon}`;
    return [Markup.button.callback(label, `slot_view:${slot.id}`)];
  });
  buttons.push([Markup.button.callback('← Назад', 'main_menu')]);
  return Markup.inlineKeyboard(buttons);
}

function slotViewKeyboard(slot) {
  const toggleLabel = slot.enabled ? '⏸ Вимкнути' : '▶️ Увімкнути';
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Змінити текст', `slot_edit_text:${slot.id}`),
     Markup.button.callback('🕐 Змінити час', `slot_edit_time:${slot.id}`)],
    [Markup.button.callback('🔗 Змінити посилання', `slot_edit_link:${slot.id}`),
     Markup.button.callback('👁 Прев\'ю', `slot_preview:${slot.id}`)],
    [Markup.button.callback(toggleLabel, `slot_toggle:${slot.id}`),
     Markup.button.callback('🗑 Видалити', `slot_remove:${slot.id}`)],
    [Markup.button.callback('← Назад до списку', 'slot_list')],
  ]);
}

function timePickerKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('09:30', 'pick_time:09:30'),
     Markup.button.callback('09:45', 'pick_time:09:45'),
     Markup.button.callback('10:00', 'pick_time:10:00'),
     Markup.button.callback('10:15', 'pick_time:10:15')],
    [Markup.button.callback('10:30', 'pick_time:10:30'),
     Markup.button.callback('10:45', 'pick_time:10:45'),
     Markup.button.callback('11:00', 'pick_time:11:00'),
     Markup.button.callback('← Назад', 'slot_list')],
  ]);
}

function confirmKeyboard(confirmAction, cancelAction) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Зберегти', confirmAction),
     Markup.button.callback('❌ Скасувати', cancelAction)],
  ]);
}

function yesNoKeyboard(yesAction, noAction) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Так', yesAction),
     Markup.button.callback('Ні', noAction)],
  ]);
}

function linkScopeKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🌐 Всіх слотів', 'set_link_all')],
    [Markup.button.callback('📌 Конкретного слота', 'set_link_pick')],
    [Markup.button.callback('← Назад', 'main_menu')],
  ]);
}

function backKeyboard(action) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('← Назад', action)],
  ]);
}

module.exports = {
  mainMenu,
  slotListKeyboard,
  slotViewKeyboard,
  timePickerKeyboard,
  confirmKeyboard,
  yesNoKeyboard,
  linkScopeKeyboard,
  backKeyboard,
};
