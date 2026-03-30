const fs = require('fs');
const path = require('path');

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'config.json');
const CONFIG_TMP = CONFIG_PATH + '.tmp';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    // Clean up any existing config
    if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
    if (fs.existsSync(CONFIG_TMP)) fs.unlinkSync(CONFIG_TMP);

    // Clear require cache to get fresh instance
    delete require.cache[require.resolve('../../src/config/manager')];
    configManager = require('../../src/config/manager');
  });

  afterAll(() => {
    if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
    if (fs.existsSync(CONFIG_TMP)) fs.unlinkSync(CONFIG_TMP);
  });

  test('load creates default config when file missing', () => {
    const config = configManager.load();
    expect(config).toBeDefined();
    expect(config.slots).toHaveLength(5);
    expect(config.globalEnabled).toBe(true);
    expect(fs.existsSync(CONFIG_PATH)).toBe(true);
  });

  test('load reads existing config from disk', () => {
    const testConfig = {
      chatId: -100999,
      globalEnabled: false,
      defaultMeetingLink: 'https://test.com',
      timezone: 'Europe/Kyiv',
      adminId: null,
      slots: [],
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(testConfig), 'utf-8');

    const config = configManager.load();
    expect(config.chatId).toBe(-100999);
    expect(config.globalEnabled).toBe(false);
    expect(config.slots).toHaveLength(0);
  });

  test('save writes config atomically', () => {
    configManager.load();
    configManager.setChatId(-100555);

    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const saved = JSON.parse(raw);
    expect(saved.chatId).toBe(-100555);
    // Temp file should not exist after rename
    expect(fs.existsSync(CONFIG_TMP)).toBe(false);
  });

  test('getSlots returns all slots', () => {
    configManager.load();
    const slots = configManager.getSlots();
    expect(slots).toHaveLength(5);
    expect(slots[0].id).toBe('morning_greeting');
  });

  test('getSlot returns specific slot', () => {
    configManager.load();
    const slot = configManager.getSlot('morning_greeting');
    expect(slot).toBeDefined();
    expect(slot.time).toBe('10:00');
  });

  test('getSlot returns null for non-existent slot', () => {
    configManager.load();
    expect(configManager.getSlot('nonexistent')).toBeNull();
  });

  test('addSlot adds new slot', () => {
    configManager.load();
    const newSlot = {
      id: 'test_slot',
      time: '13:00',
      text: 'Test!',
      showButton: false,
      buttonText: null,
      meetingLink: null,
      enabled: true,
    };
    configManager.addSlot(newSlot);
    expect(configManager.getSlots()).toHaveLength(6);
    expect(configManager.getSlot('test_slot').time).toBe('13:00');
  });

  test('updateSlot updates slot properties', () => {
    configManager.load();
    configManager.updateSlot('morning_greeting', { text: 'Updated text', time: '09:30' });
    const slot = configManager.getSlot('morning_greeting');
    expect(slot.text).toBe('Updated text');
    expect(slot.time).toBe('09:30');
  });

  test('updateSlot returns null for non-existent slot', () => {
    configManager.load();
    expect(configManager.updateSlot('nonexistent', { text: 'test' })).toBeNull();
  });

  test('removeSlot removes slot', () => {
    configManager.load();
    const result = configManager.removeSlot('morning_greeting');
    expect(result).toBe(true);
    expect(configManager.getSlots()).toHaveLength(4);
    expect(configManager.getSlot('morning_greeting')).toBeNull();
  });

  test('removeSlot returns false for non-existent slot', () => {
    configManager.load();
    expect(configManager.removeSlot('nonexistent')).toBe(false);
  });

  test('setGlobalEnabled toggles global state', () => {
    configManager.load();
    configManager.setGlobalEnabled(false);
    expect(configManager.isGlobalEnabled()).toBe(false);
    configManager.setGlobalEnabled(true);
    expect(configManager.isGlobalEnabled()).toBe(true);
  });

  test('setDefaultLink updates meeting link', () => {
    configManager.load();
    configManager.setDefaultLink('https://new-link.com');
    expect(configManager.getDefaultLink()).toBe('https://new-link.com');
  });

  test('setAdminId stores admin ID', () => {
    configManager.load();
    configManager.setAdminId(12345);
    expect(configManager.getAdminId()).toBe(12345);
  });

  test('setAllSlotsLink sets link for all slots', () => {
    configManager.load();
    configManager.setAllSlotsLink('https://all-slots.com');
    const slots = configManager.getSlots();
    slots.forEach((s) => {
      expect(s.meetingLink).toBe('https://all-slots.com');
    });
  });
});
