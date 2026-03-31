const logger = require('../utils/logger');
const configManager = require('../config/manager');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'deyneka_i';

function isAdmin(ctx) {
  if (!ctx.from) return false;

  const username = ctx.from.username;
  const userId = ctx.from.id;
  const storedAdminId = configManager.getAdminId();

  if (username === ADMIN_USERNAME) {
    // Auto-save admin ID on first contact
    if (!storedAdminId) {
      configManager.setAdminId(userId);
      logger.info('Admin ID saved', { userId, username });
    }
    return true;
  }

  if (storedAdminId && userId === storedAdminId) {
    return true;
  }

  return false;
}

function adminOnly(ctx, next) {
  if (!isAdmin(ctx)) {
    logger.warn('Unauthorized command attempt', {
      event: 'unauthorized_command',
      userId: ctx.from?.id,
      username: ctx.from?.username,
      command: ctx.message?.text,
    });
    return; // Silently ignore
  }
  return next();
}

function adminCallbackOnly(ctx, next) {
  if (!isAdmin(ctx)) {
    logger.warn('Unauthorized callback attempt', {
      event: 'unauthorized_callback',
      userId: ctx.from?.id,
      username: ctx.from?.username,
      action: ctx.callbackQuery?.data,
    });
    return ctx.answerCbQuery('⛔️ Доступ заборонено');
  }
  return next();
}

module.exports = { isAdmin, adminOnly, adminCallbackOnly, ADMIN_USERNAME };
