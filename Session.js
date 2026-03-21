() =>
  class LobbySession extends lib.user.Session() {
    constructor(data = {}) {
      super(data);

      // если сохранять lobbyId в БД, то поломается логика со связанными сессиями в initSession
      this.preventSaveFields(['lobbyId']);
    }
    getUserClass() {
      return lib.lobby.User();
    }

    async init({ context, data }) {

      const portalUserId = data.portalUserId;
      if (portalUserId && !lib.store('user').get(portalUserId)) {
        const UserClass = this.getUserClass();
        await new UserClass().load({ fromDB: { id: portalUserId } }).catch((err) => {
          if (err === 'not_found') throw 'user_not_found';
          // должно отличаться от not_found самой сессии
          else throw err;
        });
      }

      const initResult = await super.init({ context, data });

      const availableLobbies = Array.from(lib.store('lobby').keys());
      const lobbyId = this.lobbyId || availableLobbies[0];

      return { ...initResult, lobbyId };
    }
  };
