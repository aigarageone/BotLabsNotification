jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn(),
  })),
}));

jest.mock('../../src/utils/retry', () => ({
  withRetry: jest.fn((fn) => fn()),
}));

const cron = require('node-cron');

describe('Scheduler', () => {
  let scheduler;
  let configManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear module caches
    delete require.cache[require.resolve('../../src/scheduler')];
    delete require.cache[require.resolve('../../src/config/manager')];

    configManager = require('../../src/config/manager');

    // Mock configManager methods
    const mockConfig = {
      chatId: -100123,
      globalEnabled: true,
      defaultMeetingLink: 'https://meet.google.com/test',
      timezone: 'Europe/Kyiv',
      adminId: null,
      slots: [
        { id: 'slot1', time: '10:00', text: 'Test 1', showButton: false, enabled: true },
        { id: 'slot2', time: '10:15', text: 'Test 2', showButton: false, enabled: true },
        { id: 'slot3', time: '17:55', text: 'Test 3', showButton: false, enabled: false },
      ],
    };

    jest.spyOn(configManager, 'get').mockReturnValue(mockConfig);
    jest.spyOn(configManager, 'getSlot').mockImplementation((id) =>
      mockConfig.slots.find((s) => s.id === id) || null
    );
    jest.spyOn(configManager, 'getTimezone').mockReturnValue('Europe/Kyiv');
    jest.spyOn(configManager, 'getChatId').mockReturnValue(-100123);
    jest.spyOn(configManager, 'getDefaultLink').mockReturnValue('https://meet.google.com/test');
    jest.spyOn(configManager, 'getAdminId').mockReturnValue(null);

    scheduler = require('../../src/scheduler');
    scheduler.init({
      telegram: {
        sendMessage: jest.fn().mockResolvedValue({}),
      },
    });
  });

  test('scheduleAll creates cron jobs for enabled slots', () => {
    scheduler.scheduleAll();
    // Only 2 enabled slots should be scheduled
    expect(cron.schedule).toHaveBeenCalledTimes(2);
    expect(scheduler.jobs.size).toBe(2);
  });

  test('scheduleAll uses correct cron expression', () => {
    scheduler.scheduleAll();
    // slot1 at 10:00 -> '0 10 * * 1-5'
    expect(cron.schedule).toHaveBeenCalledWith(
      '0 10 * * 1-5',
      expect.any(Function),
      { timezone: 'Europe/Kyiv' }
    );
    // slot2 at 10:15 -> '15 10 * * 1-5'
    expect(cron.schedule).toHaveBeenCalledWith(
      '15 10 * * 1-5',
      expect.any(Function),
      { timezone: 'Europe/Kyiv' }
    );
  });

  test('stopAll stops all jobs', () => {
    scheduler.scheduleAll();
    const jobs = [...scheduler.jobs.values()];
    scheduler.stopAll();
    jobs.forEach((job) => {
      expect(job.stop).toHaveBeenCalled();
    });
    expect(scheduler.jobs.size).toBe(0);
  });

  test('reschedule stops old job and creates new one', () => {
    scheduler.scheduleAll();
    const oldJob = scheduler.jobs.get('slot1');

    cron.schedule.mockClear();
    scheduler.reschedule('slot1');

    expect(oldJob.stop).toHaveBeenCalled();
    expect(cron.schedule).toHaveBeenCalledTimes(1);
  });

  test('sendNotification sends message to configured chat', async () => {
    scheduler.scheduleAll();
    await scheduler.sendNotification('slot1');
    expect(scheduler.bot.telegram.sendMessage).toHaveBeenCalledWith(
      -100123,
      'Test 1',
      expect.any(Object)
    );
  });

  test('sendNotification skips when no chatId', async () => {
    configManager.getChatId.mockReturnValue(null);
    await scheduler.sendNotification('slot1');
    expect(scheduler.bot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  test('sendNotification skips disabled slot', async () => {
    await scheduler.sendNotification('slot3');
    expect(scheduler.bot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  test('scheduleAll skips when globalEnabled is false', () => {
    const config = configManager.get();
    config.globalEnabled = false;
    scheduler.scheduleAll();
    // Jobs should be cleared (stopAll called) but no new ones scheduled
    expect(cron.schedule).not.toHaveBeenCalled();
  });
});
