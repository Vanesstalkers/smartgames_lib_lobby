() =>
  class Lobby extends lib.store.Class(class {}, { broadcastEnabled: true }) {
    #chatEnabled;

    users = {};
    watchers = {};
    games = {};
    rankings = {};
    rankingsUsersTop = [];
    rankingSortFunc = {};

    constructor({ id } = {}, settings = {}) {
      super({ col: 'lobby', id });
      
      lib.chat['@class'].decorate(this);
      this.#chatEnabled = settings.chatEnabled ?? true;
      if (this.#chatEnabled) this.preventSaveFields(['chat']);

      this.__gameServerConfig = lib.lobby.__gameServerConfig;
    }

    async create({ code }) {
      const defaultDir = './application/static/img/workers';
      const defMaleCode = '_default/male';
      const maleCodeList = node.fs
        .readdirSync(`${defaultDir}/${defMaleCode}`)
        .filter((fileName) => !fileName.includes('.git'))
        .map((fileName) => `${defMaleCode}/${node.path.parse(fileName).name}`);
      const defFemaleCode = '_default/female';
      const femaleCodeList = node.fs
        .readdirSync(`${defaultDir}/${defFemaleCode}`)
        .filter((fileName) => !fileName.includes('.git'))
        .map((fileName) => `${defFemaleCode}/${node.path.parse(fileName).name}`);
      const avatars = { male: maleCodeList, female: femaleCodeList };

      await super.create({
        ...{ code, users: {}, avatars },
        rankings: domain.game?.configs?.rankings?.() || {},
      });
      this.checkRatings();

      await this.saveChanges();
      return this;
    }
    async load(from, loadConfig) {
      await super.load(from, loadConfig);

      if (this.#chatEnabled) await this.restoreChat();

      this.games = {}; // обнуляем (восстановление игр после рестарта сервера еще не работает)
      for (const user of Object.values(this.users)) {
        user.sessions = [];
        user.events = {};
        if (user.online) delete user.online;
      }

      this.updateRankings();

      console.log(`Lobby "${this.storeId()}" loaded.`);
      await this.saveChanges();
      return this;
    }

    updateRankings() {
      for (const [code, ranking] of Object.entries(domain.game.configs.rankings())) {
        if (code === 'title') continue;
        if (this.rankings[code] === undefined) this.rankings[code] = ranking;
        if (ranking === null) this.rankings[code] = null;
      }

      this.checkRatings();
    }

    /**
     * Сохраняет данные при получении обновлений
     * @param {*} data
     */
    async processData(data, broadcaster) {
      for (const [key, map] of Object.entries(data)) {
        switch (key) {
          case 'user':
            /* без removeEmptyObject у user будет обнуляться (в БД) объект rankings
      (потому что в map изменения придут, но они будут идентичны значению в masterObj) */
            this.set({ users: map }, { removeEmptyObject: true });
            for (const [userId, value] of Object.entries(map)) {
              if (value.rankings) this.checkRatings({ initiatorUserId: userId });
            }
            break;
          case 'game':
            this.set({ games: map });
            this.checkGameStatuses();
            break;
          default:
            throw new Error(`Unexpected  (key=${key}`);
        }
      }
      await this.saveChanges();
    }
    broadcastDataVueStoreRuleHandler(data) {
      return {
        ...data,
        ...(data.users
          ? {
              users: Object.fromEntries(
                Object.entries(lib.utils.clone(data.users))
                  .filter(
                    ([id, user]) =>
                      // юзер только что вышел из лобби
                      user.online === null ||
                      /* ниже проверки для рассылок по событию addSubscriber */
                      // не делаем рассылку тех, кто оффлайн
                      this.users[id].online ||
                      // оставляем в рассылке тех, что входит в топ рейтингов (чтобы отобразить их в таблицах рейтингов)
                      this.rankingsUsersTop.includes(id)
                  )
                  .map(([id, user]) => {
                    /* установка online произошла позже, чем отработал addSubscriber
              (без этого пользователь появится на фронте, но без данных) */
                    if (user.online) user = { ...this.users[id] };

                    // если бы не строчка выше, то делал бы это в prepareInitialDataForSubscribers()
                    if (user.events) delete user.events;
                    if (user.sessions) delete user.sessions;
                    return [id, user];
                  })
              ),
            }
          : {}),
      };
    }

    async userEnter({ sessionId, userId, name, tgUsername }) {
      let user = this.users[userId];
      if (!user) {
        this.set({ users: { [userId]: {} } });
        user = this.users[userId];
        user.sessions = [];
        user.events = {};
      } else {
        const { enter: lastEnterEventId } = user.events;
        this.set({ chat: { [lastEnterEventId]: null } });

        if (user.personalChatMap) {
          await lib.store.broadcaster.publishAction.call(this, `user-${userId}`, 'broadcastToSessions', {
            type: 'updateStore',
            data: { user: { [userId]: { personalChatMap: user.personalChatMap } } },
          });
          this.set({ users: { [userId]: { personalChatMap: null } } });
        }
      }
      if (user.sessions.length === 0) {
        // ловит как новых юзеров, так и тех, кто пришел после deleteUserFromLobby (в userLeave)
        await this.subscribe(`user-${userId}`, { rule: 'fields', fields: ['name', 'rankings'] });
      }

      if (this.#chatEnabled) {
        const { chatEventId } = await this.updateChat(
          { user: { id: userId }, event: 'enter' },
          { preventSaveChanges: true }
        );
        user.events.enter = chatEventId;
      }

      const sessions = [...user.sessions, sessionId];
      user.sessions = sessions;
      this.set({ users: { [userId]: { online: true } } });
      await this.saveChanges();

      await this.notifyWatchers({ msg: `Подключился новый игрок (${name || 'Гость'})`, tgUsername });
    }
    async gameLobbyUserEnter({ sessionId, userId, name, tgUsername, broadcastableFields }) {
      const userChannelName = `user-${userId}`;

      await this.subscribe(userChannelName, { rule: 'fields', fields: ['name', 'rankings'] });

      const user = lib.store('user').get(userId);
      for (const session of user.sessions()) {
        await session.subscribe(userChannelName, { rule: 'fields', fields: broadcastableFields });
      }
    }
    async userLeave({ sessionId, userId }) {
      const user = this.users[userId];
      if (user) {
        // может не быть user, если отработало несколько user.leaveLobby (из session.onClose)

        const { leave: lastLeaveEventId } = user.events;
        const sessions = user.sessions.filter((id) => id !== sessionId);
        user.sessions = sessions;
        this.set({ chat: { [lastLeaveEventId]: null } });

        if (sessions.length === 0) {
          // вышел из лобби
          await this.unsubscribe(`user-${userId}`);

          if (this.#chatEnabled) {
            const { chatEventId } = await this.updateChat(
              { user: { id: userId }, event: 'leave' },
              { preventSaveChanges: true }
            );
            user.events.leave = chatEventId;
          }
          // удаляем именно через null, чтобы отловить событие в broadcastDataVueStoreRuleHandler
          this.set({ users: { [userId]: { online: null } } });
        }
        await this.saveChanges();
      }
    }
    getAvatarPrompt({ userGender, userInfo }) {
      return `${userGender} computer programmer, ${userInfo || ''} --s 750 --ar 2:3`;
    }
    async userGenerateAvatar({ userId, userGender, userInfo, currentUserAvatarCode, newDefaultAvatars }) {
      try {
        const prompt = this.getAvatarPrompt({ userGender, userInfo });
        const Imagine = await this.midjourneyClient().Imagine(prompt, (uri, progress) => {
          console.log('loading', uri, 'progress', progress);
        });
        if (!Imagine) throw 'no message';

        const avatarCode = Imagine.id;
        const url = `${Imagine.proxy_url}?width=796&height=1196`;

        const response = await new Promise((resolve, reject) => {
          node.https.get(url, resolve).on('error', reject);
        });

        if (response.statusCode !== 200) {
          throw new Error(`Error: HTTP Status Code ${response.statusCode}`);
        }

        const buffers = [];
        response.on('data', (chunk) => {
          buffers.push(chunk);
        });
        await new Promise((resolve, reject) => {
          response.on('end', resolve);
          response.on('error', reject);
        });
        const fileBuffer = Buffer.concat(buffers);

        const outputDirectory = process.cwd() + `/application/static/img/workers/${avatarCode}`;
        if (!node.fs.existsSync(outputDirectory)) node.fs.mkdirSync(outputDirectory);

        const image = npm.sharp(fileBuffer);
        const metadata = await image.metadata();
        const partWidth = Math.floor(metadata.width / 2);
        const partHeight = Math.floor(metadata.height / 2);

        for (let i = 0; i < 4; i++) {
          const x = (i % 2) * partWidth;
          const y = Math.floor(i / 2) * partHeight;

          await npm
            .sharp(fileBuffer)
            .extract({ left: x, top: y, width: partWidth, height: partHeight })
            .toFile(`${outputDirectory}/${i + 1}.png`);
        }

        await lib.store.broadcaster.publishData.call(this, `user-${userId}`, {
          avatars: { code: avatarCode, gender: userGender },
        });

        if (newDefaultAvatars) {
          const { code: newDefCode, gender: newDefGender } = newDefaultAvatars;
          const avatars = [...this.avatars[newDefGender]];
          for (let i = 1; i <= 4; i++) {
            const code = newDefCode + '/' + i;
            if (code === currentUserAvatarCode) continue;
            const randomIdx = Math.floor(Math.random() * avatars.length);
            avatars[randomIdx] = code;
          }
          this.set({ avatars: { [newDefGender]: avatars } });
          await this.saveChanges();
        }
      } catch (exception) {
        console.log({ exception });
        await lib.store.broadcaster.publishAction.call(this, `user-${userId}`, 'broadcastToSessions', {
          data: { message: `Ошибка генерации (${exception.message})`, stack: exception.stack },
        });
      }
    }
    async startWatching({ telegramId, telegramUsername }) {
      this.set({ watchers: { [telegramUsername]: { chatId: telegramId } } });
      await this.saveChanges();
      await this.telegramBot().sendMessage(telegramId, 'Отслеживание включено');
    }
    async notifyWatchers({ msg, tgUsername }) {
      for (const [username, { chatId }] of Object.entries(this.watchers)) {
        if (username === tgUsername) continue;
        await this.telegramBot()?.sendMessage(chatId, msg);
      }
    }

    // !!! нужно решить, как организовать связку chat+lobby (в частности, решить где должна быть эта функция)
    async delayedChatEvent({ userId, targetId, chatEvent }) {
      let user = this.users[targetId];
      if (!user) {
        this.set({ users: { [targetId]: {} } });
        user = this.users[targetId];
        user.sessions = [];
        user.events = {};
      }
      this.set({
        users: {
          [targetId]: {
            personalChatMap: { [userId]: { items: { [chatEvent._id]: chatEvent } } },
          },
        },
      });
      await this.saveChanges();
    }

    getGameConfig({ gameType, gameConfig }) {
      return lib.lobby.__gameServerConfig.games[gameType].items[gameConfig];
    }
    async addGame(data) {
      const { creator, gameId, gameType, playerMap, restorationMode } = data;
      await this.subscribe(`game-${gameId}`, { rule: 'custom', ruleHandler: 'lobbySub' });
      await this.saveChanges();

      const player = {};
      for (const id of Object.keys(playerMap)) {
        const avatarsMap = {};
        for (const gender of ['male', 'female']) {
          const avatars = this.avatars[gender];
          avatarsMap[gender] = avatars[Math.floor(Math.random() * avatars.length)];
        }
        player[id] = { avatarsMap };
      }

      await lib.store.broadcaster.publishData.call(this, `game-${gameId}`, { store: { player } });

      const { teamsCount, playerCount } = this.getGameConfig(data);

      if ((parseInt(teamsCount) > 1 || parseInt(playerCount) > 1) && !restorationMode) {
        // может прийти строка вида "XX-XX"
        await this.notifyWatchers({
          msg: `Нужны игроки в новую игру (${gameType})`,
          tgUsername: creator.tgUsername,
        });
      }
    }
    async gameFinished({ gameId }) {
      await this.unsubscribe(`game-${gameId}`);
      this.set({ games: { [gameId]: null } });
      await this.saveChanges();
    }

    async checkGame({ gameId, initUserId }) {
      if (this.games[gameId]?.status === 'FINISHED') {
        await this.unsubscribe(`game-${gameId}`);
        this.set({ games: { [gameId]: null } });
      } else {
        const isAlive = await lib.store.broadcaster.publishAction.call(this, `game-${gameId}`, 'fakeAction');
        if (!isAlive) {
          await this.unsubscribe(`game-${gameId}`);
          this.set({ games: { [gameId]: null } });

          const gameLoaded = await db.redis.hget('games', gameId);
          if (gameLoaded) await db.redis.hdel('games', gameId);
        }

        if (!this.games[gameId] && initUserId) {
          await this.saveChanges();
          lib.store.broadcaster.publishAction.call(this, `user-${initUserId}`, 'broadcastToSessions', {
            data: { message: 'Игра была завершена' },
          });
        }
      }
    }

    async checkGameStatuses() {
      for (const gameId of Object.keys(this.games)) {
        await this.checkGame({ gameId });
      }
      await this.saveChanges();
    }

    checkRatings({ initiatorUserId = null } = {}) {
      const rankingList = Object.entries(this.rankings).map(([code, ranking]) => ({ ...ranking, code }));
      const rankingsUsersTop = [];

      for (const ranking of rankingList) {
        if (ranking === null) continue;

        const users = Object.values(ranking.usersTop || []); // клонирование массива usersTop
        if (initiatorUserId && !users.includes(initiatorUserId)) users.push(initiatorUserId);

        const draftUsersTop = users.map((userId) => ({
          ...(this.users[userId].rankings?.[config.smartgames.appCode] || {}),
          userId,
        }));
        const sortFunc = domain.game.configs.rankings(ranking.code)?.sortFunc;
        const usersTop = sortFunc
          ? draftUsersTop
              .sort(sortFunc)
              .map(({ userId }) => userId)
              .splice(0, 5)
          : [];

        this.set({ rankings: { [ranking.code]: { usersTop } } });

        rankingsUsersTop.push(...usersTop);
      }

      this.set({
        rankingsUsersTop: rankingsUsersTop.filter((val, idx, arr) => arr.indexOf(val) === idx),
      });
    }
  };
