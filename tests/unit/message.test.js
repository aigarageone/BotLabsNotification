const { buildNotificationMessage, formatSlotInfo, formatNextMeeting } = require('../../src/utils/message');

describe('Message Utils', () => {
  describe('buildNotificationMessage', () => {
    test('builds message without button when showButton is false', () => {
      const slot = {
        text: '✅ Стендап почався!',
        showButton: false,
        buttonText: null,
        meetingLink: null,
      };
      const { text, extra } = buildNotificationMessage(slot, 'https://meet.google.com/test');
      expect(text).toBe('✅ Стендап почався!');
      expect(extra.reply_markup).toBeUndefined();
    });

    test('builds message with button using slot link', () => {
      const slot = {
        text: '☀️ Доброго ранку!',
        showButton: true,
        buttonText: 'Підключитися',
        meetingLink: 'https://meet.google.com/slot-link',
      };
      const { text, extra } = buildNotificationMessage(slot, 'https://meet.google.com/default');
      expect(text).toBe('☀️ Доброго ранку!');
      expect(extra.reply_markup).toBeDefined();
      const button = extra.reply_markup.inline_keyboard[0][0];
      expect(button.text).toBe('Підключитися');
      expect(button.url).toBe('https://meet.google.com/slot-link');
    });

    test('uses default link when slot link is null', () => {
      const slot = {
        text: '⏰ Стендап через 5 хвилин!',
        showButton: true,
        buttonText: 'Join',
        meetingLink: null,
      };
      const { text, extra } = buildNotificationMessage(slot, 'https://meet.google.com/default');
      const button = extra.reply_markup.inline_keyboard[0][0];
      expect(button.url).toBe('https://meet.google.com/default');
    });

    test('no button when showButton is true but no links available', () => {
      const slot = {
        text: 'Test',
        showButton: true,
        buttonText: 'Join',
        meetingLink: null,
      };
      const { extra } = buildNotificationMessage(slot, null);
      expect(extra.reply_markup).toBeUndefined();
    });
  });

  describe('formatSlotInfo', () => {
    test('formats enabled slot info', () => {
      const slot = {
        id: 'morning_greeting',
        time: '10:00',
        text: '☀️ Продуктивного Вам дня!',
        showButton: true,
        buttonText: 'Підключитися',
        meetingLink: null,
        enabled: true,
      };
      const result = formatSlotInfo(slot, 'https://meet.google.com/test');
      expect(result).toContain('morning_greeting');
      expect(result).toContain('10:00');
      expect(result).toContain('✅ Увімкнено');
      expect(result).toContain('Підключитися');
    });

    test('formats disabled slot with no button', () => {
      const slot = {
        id: 'test_slot',
        time: '15:00',
        text: 'Test',
        showButton: false,
        buttonText: null,
        meetingLink: null,
        enabled: false,
      };
      const result = formatSlotInfo(slot, null);
      expect(result).toContain('⏸ Вимкнено');
      expect(result).toContain('вимкнена');
    });
  });

  describe('formatNextMeeting', () => {
    test('formats next meeting with link', () => {
      const slot = { id: 'morning_start', time: '10:15', text: '✅ Стендап' };
      const result = formatNextMeeting(slot, 'https://meet.google.com/test', 47);
      expect(result).toContain('10:15');
      expect(result).toContain('https://meet.google.com/test');
      expect(result).toContain('47 хвилин');
    });

    test('formats next meeting without link', () => {
      const slot = { id: 'test', time: '10:00', text: '☀️ Test' };
      const result = formatNextMeeting(slot, null, 30);
      expect(result).not.toContain('Підключитися:');
      expect(result).toContain('30 хвилин');
    });
  });
});
