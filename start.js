async () => {
  lib.lobby.__devMode = process.env.NODE_ENV === 'development';

  db.mongo.handlers.afterStart({ creatingLobby: async () => {
    const LobbyClass = domain.lobby.class || lib.lobby.Class();
    const lobby = new LobbyClass();
    const code = `${config.smartgames.appCode}Lobby`;

    await lobby.load({ fromDB: { query: { code } } }).catch(async (err) => {
      if (err !== 'not_found') throw err; // любая ошибка, кроме ожидаемой "not_found";
      await lobby.create({ code });
    });
    db.redis.handlers.afterStart({ creatingLobby: async () => {
      await db.redis.set(code, { channelName: lobby.channelName() }, { json: true });
    } });
  } });

  if (lib.game) {
    db.redis.handlers.afterStart({ fillingLobbyGamesList: async () => {
      const gameTypes = lib.game.actions.getFilledGamesConfigs();
      const games = {};

      for (const [gameType, typeData] of Object.entries(gameTypes)) {
        const { items, ...typeInfo } = typeData;

        games[gameType] = typeInfo;
        games[gameType].items = {};

        for (const [gameConfig, configData] of Object.entries(items)) {
          const { title, timer, teamsCount, playerCount, maxPlayersInGame, difficulty, style } = configData;
          games[gameType].items[gameConfig] = {
            ...{ title, timer, difficulty, style },
            ...{ teamsCount, playerCount, maxPlayersInGame },
          };
        }
      }

      lib.lobby.__games = games;
    } });

    // TO_CHANGE - uncomment if needed
    // const files = await node.fsp.readdir('./application/static/img/cards', { withFileTypes: true });
    // const cardTemplates = Object.values(files).map((_) => _.name);
    // domain.game.configs.cardTemplates = cardTemplates;
    // domain.game.configs.cardTemplates.random = ({ exclude = [] } = {}) => {
    //   const templates = cardTemplates.filter((_) => !exclude.includes(_));
    //   return templates[Math.floor(Math.random() * templates.length)];
    // };
  }
};
