const sessions = new Map();

function getSession(userId) {
  return sessions.get(userId) || null;
}

function setSession(userId, data) {
  sessions.set(userId, data);
}

function clearSession(userId) {
  sessions.delete(userId);
}

function hasSession(userId) {
  return sessions.has(userId);
}

module.exports = { getSession, setSession, clearSession, hasSession };
