function prepareLobbyGlobals() {
  async function initSession(config, handlers) {
    if (arguments.length < 2) {
      handlers = config;
      config = {};
    }
    const { success: onSuccess, error: onError } = handlers;

    const token = localStorage.getItem(window.tokenName);
    const session =
      (await api.action
        .public({
          path: 'user.api.initSession',
          args: [{ token, windowTabId: window.name, ...config }],
        })
        .catch(async (err) => {
          if (typeof onError === 'function') await onError(err);
        })) || {};

    if (session.newUser && typeof onError === 'function') await onError(); // отработает lobbyDataLoaded = true

    const { token: sessionToken, userId } = session;

    this.$set(this.$root.state, 'currentToken', sessionToken);
    if (sessionToken && sessionToken !== token) localStorage.setItem(window.tokenName, sessionToken);
    if (userId) {
      this.$set(this.$root.state, 'currentUser', userId);
      if (typeof onSuccess === 'function') await onSuccess(session);
    }

    return session;
  }

  async function fetchActionPublic({ path, args = [], serverOrigin } = {}) {
    const state = this?.$root?.state || {};
    const origin = (serverOrigin || state.serverOrigin || '').replace(/\/$/, '');

    const method = 'POST';
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ path, args });

    const packet = await fetch(origin + '/api/action/public', { method, headers, body })
      .then((res) => res.text())
      .then((text) => JSON.parse(text));

    return packet;
  }

  return {
    fetchActionPublic,
    initSession,
  };
}

export { prepareLobbyGlobals };

