import type { UserClass, UserInstance } from '../../user/types/Class';

/**
 * Рантайм: `class LobbyUser extends lib.user.Class()` — тот же store + broadcast, что у `User`,
 * плюс поля лобби и методы `enterLobby` / `leaveLobby`.
 */
export interface LobbyUserInstance extends UserInstance {
  enterLobby(data: { sessionId: string; lobbyId: string }): Promise<void>;
  leaveLobby(data: { sessionId: string; lobbyId: string }): Promise<void>;
}

export interface LobbyUserClass extends UserClass {
  new (data?: { id?: string }): LobbyUserInstance;
}

declare function createLobbyUserClass(): LobbyUserClass;

export = createLobbyUserClass;
