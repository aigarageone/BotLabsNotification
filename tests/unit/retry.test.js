jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

const { withRetry } = require('../../src/utils/retry');

describe('withRetry', () => {
  test('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 'test');
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries on failure and succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValue('ok');

    // Use real timers but mock the delay via setTimeout override
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (cb) => originalSetTimeout(cb, 0);

    const result = await withRetry(fn, 'test');
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);

    global.setTimeout = originalSetTimeout;
  });

  test('throws after all retries exhausted', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));

    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (cb) => originalSetTimeout(cb, 0);

    await expect(withRetry(fn, 'test')).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries

    global.setTimeout = originalSetTimeout;
  });
});
