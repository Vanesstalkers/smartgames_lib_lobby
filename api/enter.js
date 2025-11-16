async (context, { lobbyId }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();

  const lobbyName = `lobby-${lobbyId}`;
  await session.subscribe(lobbyName, { rule: 'vue-store', userId: user.id() });

  session.onClose.push(async () => {
    if (session.lobbyId !== lobbyId) return; // уже вышел из лобби

    await session.unsubscribe(lobbyName);
    session.set({ lobbyId: null });
    await session.saveChanges();

    await user.leaveLobby({ sessionId, lobbyId });
  });
  await user.enterLobby({ sessionId, lobbyId });

  const { gameId, playerId, viewerId } = user;
  if (gameId) {
    const gameInfo = await db.redis.hget('games', gameId, { json: true });
    if (!gameInfo) {
      user.set({ gameId: null, playerId: null, viewerId: null });
      await user.saveChanges();

      return { status: 'ok' };
    }

    const { deckType, gameType } = gameInfo;
    let needLoadGame = false;
    const isAlive = await lib.store.broadcaster.publishAction.call(session, `game-${gameId}`, 'isAlive');
    if (isAlive) {
      session.set({ gameId, playerId, viewerId, lobbyId });
      await session.saveChanges();
    } else {
      needLoadGame = true;
      // игра восстановится из БД
      // const sessions = user.sessions();
      // for (const session of sessions) {
      // break; // для восстановления игры достаточно одного вызова
      // }
    }
    session.emit('restoreGame', { deckType, gameType, gameId, needLoadGame });
    return { status: 'ok', restoreGame: true };
  } else {
    session.set({ lobbyId });
    await session.saveChanges();
  }

  return { status: 'ok' };
};
