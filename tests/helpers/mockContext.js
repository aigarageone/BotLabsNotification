function createMockContext(overrides = {}) {
  const ctx = {
    from: {
      id: 123456,
      username: 'deyneka_i',
      first_name: 'Test',
      ...overrides.from,
    },
    chat: {
      id: -100123456789,
      type: 'group',
      ...overrides.chat,
    },
    message: {
      text: '/test',
      ...overrides.message,
    },
    callbackQuery: {
      data: 'test',
      ...overrides.callbackQuery,
    },
    match: overrides.match || null,
    reply: jest.fn().mockResolvedValue({}),
    editMessageText: jest.fn().mockResolvedValue({}),
    answerCbQuery: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  return ctx;
}

function createUnauthorizedContext(overrides = {}) {
  return createMockContext({
    from: {
      id: 999999,
      username: 'hacker',
      first_name: 'Hacker',
      ...overrides.from,
    },
    ...overrides,
  });
}

module.exports = { createMockContext, createUnauthorizedContext };
