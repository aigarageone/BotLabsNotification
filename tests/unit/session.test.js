const { getSession, setSession, clearSession, hasSession } = require('../../src/utils/session');

describe('Session Manager', () => {
  afterEach(() => {
    clearSession(1);
    clearSession(2);
  });

  test('returns null for non-existent session', () => {
    expect(getSession(999)).toBeNull();
  });

  test('sets and gets session data', () => {
    setSession(1, { action: 'edit_text', slotId: 'test' });
    const session = getSession(1);
    expect(session).toEqual({ action: 'edit_text', slotId: 'test' });
  });

  test('hasSession returns true for existing session', () => {
    setSession(1, { action: 'test' });
    expect(hasSession(1)).toBe(true);
    expect(hasSession(999)).toBe(false);
  });

  test('clearSession removes session', () => {
    setSession(1, { action: 'test' });
    clearSession(1);
    expect(getSession(1)).toBeNull();
    expect(hasSession(1)).toBe(false);
  });

  test('sessions are isolated per user', () => {
    setSession(1, { action: 'action1' });
    setSession(2, { action: 'action2' });
    expect(getSession(1).action).toBe('action1');
    expect(getSession(2).action).toBe('action2');
  });
});
