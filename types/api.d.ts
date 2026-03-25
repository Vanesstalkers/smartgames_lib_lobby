import type { ApiContextLike, StatusOkResult } from '../../user/types/api';

export interface LobbyEnterData {
  lobbyId: string;
}

export interface LobbyCheckGameData {
  gameId: string;
}

export interface LobbyEnterResult extends StatusOkResult {
  restoreGame?: {
    gameCode: string;
    gameType: string;
    gameId: string;
    needLoadGame: boolean;
  };
}

export interface LobbyCheckGameResult extends StatusOkResult {
  isAlive: boolean;
}

export type LobbyEnterMethod = (context: ApiContextLike, data: LobbyEnterData) => Promise<LobbyEnterResult>;
export type LobbyExitMethod = (context: ApiContextLike) => Promise<StatusOkResult>;
export type LobbyLogoutMethod = (context: ApiContextLike) => Promise<StatusOkResult>;
export type LobbyCheckGameMethod = (context: ApiContextLike, data: LobbyCheckGameData) => Promise<LobbyCheckGameResult>;

export interface LobbyApiMethods {
  enter: LobbyEnterMethod;
  exit: LobbyExitMethod;
  logout: LobbyLogoutMethod;
  checkGame: LobbyCheckGameMethod;
}
