const logger = require('./logger');

const DELAYS = [5000, 15000, 30000];

async function withRetry(fn, context = 'operation') {
  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === DELAYS.length) {
        logger.error(`${context} failed after ${DELAYS.length + 1} attempts`, {
          error: err.message,
        });
        throw err;
      }
      const delay = DELAYS[attempt];
      logger.warn(`${context} failed (attempt ${attempt + 1}), retrying in ${delay / 1000}s`, {
        error: err.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { withRetry };
