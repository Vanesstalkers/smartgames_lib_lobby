import type { SessionClass, SessionContextLike, SessionInitData, SessionInstance } from '../../user/types/Session';
import type { LobbyUserClass } from './User';

export interface LobbySessionInitData extends SessionInitData {
  portalUserId?: string;
}

export interface LobbySessionInitResult {
  token: string;
  userId: string;
  lobbyId: string;
}

export interface LobbySessionInstance extends SessionInstance {
  lobbyId?: string;
  getUserClass(): LobbyUserClass;
  init(data: { context: SessionContextLike; data: LobbySessionInitData }): Promise<LobbySessionInitResult>;
}

export interface LobbySessionClass extends SessionClass {
  new (data?: { id?: string; client?: any }): LobbySessionInstance;
}

declare function createLobbySessionClass(): LobbySessionClass;

export = createLobbySessionClass;
