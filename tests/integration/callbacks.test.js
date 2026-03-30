jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

const { createMockContext } = require('../helpers/mockContext');

describe('Callback Handlers', () => {
  let configManager;
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../src/config/manager')];
    configManager = require('../../src/config/manager');

    mockConfig = {
      chatId: -100123,
      globalEnabled: true,
      defaultMeetingLink: 'https://meet.google.com/test',
      timezone: 'Europe/Kyiv',
      adminId: null,
      slots: [
        { id: 'slot1', time: '10:00', text: '☀️ Test', showButton: true, buttonText: 'Join', meetingLink: null, enabled: true },
        { id: 'slot2', time: '10:15', text: '✅ Start', showButton: false, buttonText: null, meetingLink: null, enabled: false },
      ],
    };

    jest.spyOn(configManager, 'get').mockReturnValue(mockConfig);
    jest.spyOn(configManager, 'getSlots').mockReturnValue(mockConfig.slots);
    jest.spyOn(configManager, 'getSlot').mockImplementation((id) =>
      mockConfig.slots.find((s) => s.id === id) || null
    );
    jest.spyOn(configManager, 'getDefaultLink').mockReturnValue(mockConfig.defaultMeetingLink);
    jest.spyOn(configManager, 'updateSlot').mockImplementation((id, updates) => {
      const slot = mockConfig.slots.find((s) => s.id === id);
      if (slot) Object.assign(slot, updates);
      return slot;
    });
    jest.spyOn(configManager, 'removeSlot').mockImplementation((id) => {
      const idx = mockConfig.slots.findIndex((s) => s.id === id);
      if (idx === -1) return false;
      mockConfig.slots.splice(idx, 1);
      return true;
    });
    jest.spyOn(configManager, 'addSlot').mockImplementation((slot) => {
      mockConfig.slots.push(slot);
      return slot;
    });
    jest.spyOn(configManager, 'setGlobalEnabled').mockImplementation((v) => {
      mockConfig.globalEnabled = v;
    });
    jest.spyOn(configManager, 'setDefaultLink').mockImplementation((v) => {
      mockConfig.defaultMeetingLink = v;
    });
    jest.spyOn(configManager, 'getAdminId').mockReturnValue(null);
    jest.spyOn(configManager, 'setAdminId').mockImplementation(() => {});
    jest.spyOn(configManager, 'getTimezone').mockReturnValue('Europe/Kyiv');
    jest.spyOn(configManager, 'getChatId').mockReturnValue(-100123);
    jest.spyOn(configManager, 'isGlobalEnabled').mockReturnValue(true);
  });

  describe('slotList', () => {
    const { registerSlotList } = require('../../src/callbacks/slotList');

    test('lists all slots', () => {
      const bot = { action: jest.fn() };
      registerSlotList(bot);

      // First action registration is 'slot_list'
      const [, handler] = bot.action.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Оберіть слот'),
        expect.any(Object)
      );
    });

    test('slot_view shows slot info', () => {
      const bot = { action: jest.fn() };
      registerSlotList(bot);

      // Second action is regex for slot_view
      const [, handler] = bot.action.mock.calls[1];
      const ctx = createMockContext({ match: [null, 'slot1'] });
      handler(ctx);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('slot1'),
        expect.any(Object)
      );
    });

    test('slot_view handles non-existent slot', () => {
      const bot = { action: jest.fn() };
      registerSlotList(bot);

      const [, handler] = bot.action.mock.calls[1];
      const ctx = createMockContext({ match: [null, 'nonexistent'] });
      handler(ctx);
      expect(ctx.answerCbQuery).toHaveBeenCalledWith('Слот не знайдено');
    });
  });

  describe('slotToggle', () => {
    const { registerSlotToggle } = require('../../src/callbacks/slotToggle');

    test('toggles slot enabled state', () => {
      delete require.cache[require.resolve('../../src/scheduler')];
      const scheduler = require('../../src/scheduler');
      jest.spyOn(scheduler, 'reschedule').mockImplementation(() => {});

      const bot = { action: jest.fn() };
      registerSlotToggle(bot);

      const [, handler] = bot.action.mock.calls[0];
      const ctx = createMockContext({ match: [null, 'slot1'] });
      handler(ctx);

      expect(configManager.updateSlot).toHaveBeenCalledWith('slot1', { enabled: false });
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Вимкнено'),
        expect.any(Object)
      );
    });
  });

  describe('toggleAll', () => {
    const { registerToggleAll } = require('../../src/callbacks/toggleAll');

    test('shows pause confirmation when enabled', () => {
      const bot = { action: jest.fn() };
      registerToggleAll(bot);

      const [, handler] = bot.action.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Вимкнути ВСІ'),
        expect.any(Object)
      );
    });

    test('resumes when currently paused', () => {
      mockConfig.globalEnabled = false;

      delete require.cache[require.resolve('../../src/scheduler')];
      const scheduler = require('../../src/scheduler');
      jest.spyOn(scheduler, 'scheduleAll').mockImplementation(() => {});

      delete require.cache[require.resolve('../../src/callbacks/toggleAll')];
      const { registerToggleAll } = require('../../src/callbacks/toggleAll');
      const bot = { action: jest.fn() };
      registerToggleAll(bot);

      const [, handler] = bot.action.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(configManager.setGlobalEnabled).toHaveBeenCalledWith(true);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('відновлено'),
        expect.any(Object)
      );
    });
  });

  describe('slotRemove', () => {
    const { registerSlotRemove } = require('../../src/callbacks/slotRemove');

    test('shows removal confirmation', () => {
      const bot = { action: jest.fn() };
      registerSlotRemove(bot);

      const [, handler] = bot.action.mock.calls[0];
      const ctx = createMockContext({ match: [null, 'slot1'] });
      handler(ctx);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Видалити'),
        expect.any(Object)
      );
    });

    test('confirm_remove deletes slot', () => {
      delete require.cache[require.resolve('../../src/scheduler')];
      const scheduler = require('../../src/scheduler');
      scheduler.jobs = new Map();

      const bot = { action: jest.fn() };
      registerSlotRemove(bot);

      const [, confirmHandler] = bot.action.mock.calls[1];
      const ctx = createMockContext({ match: [null, 'slot1'] });
      confirmHandler(ctx);
      expect(configManager.removeSlot).toHaveBeenCalledWith('slot1');
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('видалено'),
        expect.any(Object)
      );
    });
  });

  describe('preview', () => {
    const { registerPreview } = require('../../src/callbacks/preview');

    test('sends preview message', async () => {
      const bot = { action: jest.fn() };
      registerPreview(bot);

      const [, handler] = bot.action.mock.calls[0];
      const ctx = createMockContext({ match: [null, 'slot1'] });
      await handler(ctx);
      expect(ctx.reply).toHaveBeenCalledTimes(2);
      expect(ctx.answerCbQuery).toHaveBeenCalledWith("Прев'ю відправлено");
    });
  });
});
