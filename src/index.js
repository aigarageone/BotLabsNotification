require('dotenv').config();

const logger = require('./utils/logger');
const configManager = require('./config/manager');
const scheduler = require('./scheduler');
const { createBot } = require('./bot');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  logger.error('BOT_TOKEN is not set in .env');
  process.exit(1);
}

// Load config
configManager.load();

// Set chat ID from env if not already set
if (!configManager.getChatId() && process.env.DEFAULT_CHAT_ID) {
  configManager.setChatId(Number(process.env.DEFAULT_CHAT_ID));
}

// Create and start bot
const bot = createBot(BOT_TOKEN);

// Init scheduler with bot instance
scheduler.init(bot);
scheduler.scheduleAll();

// Start bot
bot.launch()
  .then(() => {
    logger.info('Bot started successfully');
  })
  .catch((err) => {
    logger.error('Failed to start bot', { error: err.message });
    process.exit(1);
  });

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down...`);
  scheduler.stopAll();
  bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
