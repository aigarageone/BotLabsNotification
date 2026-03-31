jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../src/config/manager', () => {
  let adminId = null;
  return {
    getAdminId: jest.fn(() => adminId),
    setAdminId: jest.fn((id) => { adminId = id; }),
    __resetAdminId: () => { adminId = null; },
  };
});

const { isAdmin, adminOnly, adminCallbackOnly } = require('../../src/middleware/auth');
const configManager = require('../../src/config/manager');

describe('Auth Middleware', () => {
  beforeEach(() => {
    configManager.__resetAdminId();
    jest.clearAllMocks();
  });

  describe('isAdmin', () => {
    test('returns true for admin username', () => {
      const ctx = { from: { id: 123, username: 'deyneka_i' } };
      expect(isAdmin(ctx)).toBe(true);
    });

    test('returns false for non-admin username', () => {
      const ctx = { from: { id: 999, username: 'hacker' } };
      expect(isAdmin(ctx)).toBe(false);
    });

    test('returns false when from is null', () => {
      const ctx = { from: null };
      expect(isAdmin(ctx)).toBe(false);
    });

    test('saves admin ID on first authorized access', () => {
      const ctx = { from: { id: 123, username: 'deyneka_i' } };
      isAdmin(ctx);
      expect(configManager.setAdminId).toHaveBeenCalledWith(123);
    });

    test('allows access by stored admin ID as fallback', () => {
      // First, set admin ID via username auth
      const adminCtx = { from: { id: 123, username: 'deyneka_i' } };
      isAdmin(adminCtx);

      // Now access with changed username but same ID
      const ctx = { from: { id: 123, username: 'new_username' } };
      expect(isAdmin(ctx)).toBe(true);
    });
  });

  describe('adminOnly', () => {
    test('calls next for admin', () => {
      const ctx = { from: { id: 123, username: 'deyneka_i' }, message: { text: '/admin' } };
      const next = jest.fn();
      adminOnly(ctx, next);
      expect(next).toHaveBeenCalled();
    });

    test('does not call next for non-admin', () => {
      const ctx = { from: { id: 999, username: 'hacker' }, message: { text: '/admin' } };
      const next = jest.fn();
      adminOnly(ctx, next);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('adminCallbackOnly', () => {
    test('calls next for admin', () => {
      const ctx = {
        from: { id: 123, username: 'deyneka_i' },
        callbackQuery: { data: 'test' },
        answerCbQuery: jest.fn(),
      };
      const next = jest.fn();
      adminCallbackOnly(ctx, next);
      expect(next).toHaveBeenCalled();
    });

    test('answers with forbidden for non-admin', () => {
      const ctx = {
        from: { id: 999, username: 'hacker' },
        callbackQuery: { data: 'test' },
        answerCbQuery: jest.fn().mockResolvedValue({}),
      };
      const next = jest.fn();
      adminCallbackOnly(ctx, next);
      expect(next).not.toHaveBeenCalled();
      expect(ctx.answerCbQuery).toHaveBeenCalledWith('⛔️ Доступ заборонено');
    });
  });
});
