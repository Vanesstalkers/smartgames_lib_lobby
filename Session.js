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
  };
