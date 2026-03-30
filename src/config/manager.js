const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { DEFAULT_CONFIG } = require('./defaults');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'config.json');
const CONFIG_DIR = path.dirname(CONFIG_PATH);

class ConfigManager {
  constructor() {
    this.config = null;
  }

  load() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        this.config = JSON.parse(raw);
        logger.info('Config loaded from disk');
      } catch (err) {
        logger.error('Failed to read config, using defaults', { error: err.message });
        this.config = { ...DEFAULT_CONFIG };
        this.save();
      }
    } else {
      this.config = { ...DEFAULT_CONFIG, slots: DEFAULT_CONFIG.slots.map((s) => ({ ...s })) };
      this.save();
      logger.info('Config created with defaults');
    }

    return this.config;
  }

  save() {
    const tmpPath = CONFIG_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(this.config, null, 2), 'utf-8');
    fs.renameSync(tmpPath, CONFIG_PATH);
    logger.info('Config saved to disk');
  }

  get() {
    return this.config;
  }

  getChatId() {
    return this.config.chatId;
  }

  setChatId(chatId) {
    this.config.chatId = chatId;
    this.save();
  }

  isGlobalEnabled() {
    return this.config.globalEnabled;
  }

  setGlobalEnabled(enabled) {
    this.config.globalEnabled = enabled;
    this.save();
  }

  getDefaultLink() {
    return this.config.defaultMeetingLink;
  }

  setDefaultLink(link) {
    this.config.defaultMeetingLink = link;
    this.save();
  }

  getTimezone() {
    return this.config.timezone;
  }

  getAdminId() {
    return this.config.adminId;
  }

  setAdminId(id) {
    this.config.adminId = id;
    this.save();
  }

  getSlots() {
    return this.config.slots;
  }

  getSlot(id) {
    return this.config.slots.find((s) => s.id === id) || null;
  }

  addSlot(slot) {
    this.config.slots.push(slot);
    this.save();
    return slot;
  }

  updateSlot(id, updates) {
    const slot = this.getSlot(id);
    if (!slot) return null;
    Object.assign(slot, updates);
    this.save();
    return slot;
  }

  removeSlot(id) {
    const index = this.config.slots.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.config.slots.splice(index, 1);
    this.save();
    return true;
  }

  setAllSlotsLink(link) {
    this.config.slots.forEach((s) => {
      s.meetingLink = link;
    });
    this.save();
  }
}

module.exports = new ConfigManager();
