jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

const { createMockContext, createUnauthorizedContext } = require('../helpers/mockContext');

describe('Command Handlers', () => {
  let configManager;

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../src/config/manager')];
    configManager = require('../../src/config/manager');

    // Setup mock config
    const mockConfig = {
      chatId: -100123,
      globalEnabled: true,
      defaultMeetingLink: 'https://meet.google.com/test',
      timezone: 'Europe/Kyiv',
      adminId: null,
      slots: [
        { id: 'slot1', time: '10:00', text: '☀️ Test', showButton: true, buttonText: 'Join', meetingLink: null, enabled: true },
        { id: 'slot2', time: '10:15', text: '✅ Start', showButton: false, buttonText: null, meetingLink: null, enabled: true },
      ],
    };

    jest.spyOn(configManager, 'load').mockReturnValue(mockConfig);
    jest.spyOn(configManager, 'get').mockReturnValue(mockConfig);
    jest.spyOn(configManager, 'getSlots').mockReturnValue(mockConfig.slots);
    jest.spyOn(configManager, 'getChatId').mockReturnValue(mockConfig.chatId);
    jest.spyOn(configManager, 'setChatId').mockImplementation(() => {});
    jest.spyOn(configManager, 'getDefaultLink').mockReturnValue(mockConfig.defaultMeetingLink);
    jest.spyOn(configManager, 'getTimezone').mockReturnValue('Europe/Kyiv');
    jest.spyOn(configManager, 'getAdminId').mockReturnValue(null);
    jest.spyOn(configManager, 'setAdminId').mockImplementation(() => {});
    jest.spyOn(configManager, 'isGlobalEnabled').mockReturnValue(true);
  });

  describe('/admin command', () => {
    const { registerAdminCommand } = require('../../src/commands/admin');

    test('shows admin menu for authorized user', () => {
      const bot = { command: jest.fn() };
      const adminOnly = (ctx, next) => next();
      registerAdminCommand(bot, adminOnly);

      // Get the handler registered for 'admin'
      const [, , handler] = bot.command.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Панель управління'),
        expect.any(Object)
      );
    });
  });

  describe('/status command', () => {
    const { registerStatusCommand } = require('../../src/commands/status');

    test('shows status information', () => {
      const bot = { command: jest.fn() };
      const adminOnly = (ctx, next) => next();
      registerStatusCommand(bot, adminOnly);

      const [, , handler] = bot.command.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Статус BotLabs'));
    });
  });

  describe('/setchat command', () => {
    const { registerSetchatCommand } = require('../../src/commands/setchat');

    test('saves chat ID in group', () => {
      const bot = { command: jest.fn() };
      const adminOnly = (ctx, next) => next();
      registerSetchatCommand(bot, adminOnly);

      const [, , handler] = bot.command.mock.calls[0];
      const ctx = createMockContext({ chat: { id: -100999, type: 'group' } });
      handler(ctx);
      expect(configManager.setChatId).toHaveBeenCalledWith(-100999);
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Групу прив\'язано'));
    });

    test('rejects in private chat', () => {
      const bot = { command: jest.fn() };
      const adminOnly = (ctx, next) => next();
      registerSetchatCommand(bot, adminOnly);

      const [, , handler] = bot.command.mock.calls[0];
      const ctx = createMockContext({ chat: { id: 123, type: 'private' } });
      handler(ctx);
      expect(configManager.setChatId).not.toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('групі'));
    });
  });

  describe('/next command', () => {
    test('shows next meeting info', () => {
      delete require.cache[require.resolve('../../src/scheduler')];
      const scheduler = require('../../src/scheduler');
      jest.spyOn(scheduler, 'getNextSlot').mockReturnValue({
        slot: { id: 'slot1', time: '10:00', text: '☀️ Test', meetingLink: null },
        minutesUntil: 30,
      });

      const { registerNextCommand } = require('../../src/commands/next');
      const bot = { command: jest.fn() };
      registerNextCommand(bot);

      const [, handler] = bot.command.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('10:00'));
    });

    test('shows message when no meetings', () => {
      delete require.cache[require.resolve('../../src/scheduler')];
      const scheduler = require('../../src/scheduler');
      jest.spyOn(scheduler, 'getNextSlot').mockReturnValue(null);

      delete require.cache[require.resolve('../../src/commands/next')];
      const { registerNextCommand } = require('../../src/commands/next');
      const bot = { command: jest.fn() };
      registerNextCommand(bot);

      const [, handler] = bot.command.mock.calls[0];
      const ctx = createMockContext();
      handler(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('немає'));
    });
  });
});
