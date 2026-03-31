const {
  mainMenu,
  slotListKeyboard,
  slotViewKeyboard,
  timePickerKeyboard,
  confirmKeyboard,
  yesNoKeyboard,
  linkScopeKeyboard,
  backKeyboard,
} = require('../../src/utils/keyboards');

describe('Keyboards', () => {
  test('mainMenu shows pause when enabled', () => {
    const kb = mainMenu(true);
    const markup = kb.reply_markup;
    const allButtons = markup.inline_keyboard.flat();
    const pauseBtn = allButtons.find((b) => b.callback_data === 'toggle_all');
    expect(pauseBtn.text).toContain('Пауза');
  });

  test('mainMenu shows resume when disabled', () => {
    const kb = mainMenu(false);
    const markup = kb.reply_markup;
    const allButtons = markup.inline_keyboard.flat();
    const resumeBtn = allButtons.find((b) => b.callback_data === 'toggle_all');
    expect(resumeBtn.text).toContain('Відновити');
  });

  test('slotListKeyboard creates buttons for each slot', () => {
    const slots = [
      { id: 'slot1', time: '10:00', text: '☀️ Test', enabled: true },
      { id: 'slot2', time: '10:10', text: '⏰ Test2', enabled: false },
    ];
    const kb = slotListKeyboard(slots);
    const buttons = kb.reply_markup.inline_keyboard;
    // 2 slot buttons + 1 back button
    expect(buttons).toHaveLength(3);
    expect(buttons[0][0].callback_data).toBe('slot_view:slot1');
    expect(buttons[1][0].callback_data).toBe('slot_view:slot2');
    expect(buttons[0][0].text).toContain('✅');
    expect(buttons[1][0].text).toContain('⏸');
  });

  test('slotViewKeyboard has all action buttons', () => {
    const slot = { id: 'test', time: '10:00', enabled: true };
    const kb = slotViewKeyboard(slot);
    const allButtons = kb.reply_markup.inline_keyboard.flat();
    const actions = allButtons.map((b) => b.callback_data);
    expect(actions).toContain('slot_edit_text:test');
    expect(actions).toContain('slot_edit_time:test');
    expect(actions).toContain('slot_edit_link:test');
    expect(actions).toContain('slot_preview:test');
    expect(actions).toContain('slot_toggle:test');
    expect(actions).toContain('slot_remove:test');
    expect(actions).toContain('slot_list');
  });

  test('slotViewKeyboard shows disable when enabled', () => {
    const slot = { id: 'test', time: '10:00', enabled: true };
    const kb = slotViewKeyboard(slot);
    const allButtons = kb.reply_markup.inline_keyboard.flat();
    const toggleBtn = allButtons.find((b) => b.callback_data === 'slot_toggle:test');
    expect(toggleBtn.text).toContain('Вимкнути');
  });

  test('slotViewKeyboard shows enable when disabled', () => {
    const slot = { id: 'test', time: '10:00', enabled: false };
    const kb = slotViewKeyboard(slot);
    const allButtons = kb.reply_markup.inline_keyboard.flat();
    const toggleBtn = allButtons.find((b) => b.callback_data === 'slot_toggle:test');
    expect(toggleBtn.text).toContain('Увімкнути');
  });

  test('timePickerKeyboard has time options', () => {
    const kb = timePickerKeyboard();
    const allButtons = kb.reply_markup.inline_keyboard.flat();
    const timeButtons = allButtons.filter((b) => b.callback_data?.startsWith('pick_time:'));
    expect(timeButtons.length).toBeGreaterThanOrEqual(7);
  });

  test('confirmKeyboard creates confirm and cancel', () => {
    const kb = confirmKeyboard('confirm_action', 'cancel_action');
    const buttons = kb.reply_markup.inline_keyboard[0];
    expect(buttons[0].callback_data).toBe('confirm_action');
    expect(buttons[1].callback_data).toBe('cancel_action');
  });

  test('yesNoKeyboard creates yes and no', () => {
    const kb = yesNoKeyboard('yes_action', 'no_action');
    const buttons = kb.reply_markup.inline_keyboard[0];
    expect(buttons[0].callback_data).toBe('yes_action');
    expect(buttons[1].callback_data).toBe('no_action');
  });

  test('linkScopeKeyboard has scope options', () => {
    const kb = linkScopeKeyboard();
    const allButtons = kb.reply_markup.inline_keyboard.flat();
    const actions = allButtons.map((b) => b.callback_data);
    expect(actions).toContain('set_link_all');
    expect(actions).toContain('set_link_pick');
    expect(actions).toContain('main_menu');
  });

  test('backKeyboard creates single back button', () => {
    const kb = backKeyboard('main_menu');
    expect(kb.reply_markup.inline_keyboard).toHaveLength(1);
    expect(kb.reply_markup.inline_keyboard[0][0].callback_data).toBe('main_menu');
  });
});
