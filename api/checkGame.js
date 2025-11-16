async (context, { gameId }) => {
  const { sessionId, userId } = context.session.state;
  const session = lib.store('session').get(sessionId);

  const isAlive = await lib.store.broadcaster.publishAction.call(session, `game-${gameId}`, 'isAlive');

  lib.store.broadcaster.publishAction.call(session, `lobby-${session.lobbyId}`, 'checkGame', {
    gameId,
    initUserId: userId,
  });

  return { status: 'ok', isAlive };
};
