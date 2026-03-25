import type { StoreBaseMethods, StoreBroadcastMethods } from '../../store/types/Class';

export interface LobbyCreateData {
  code: string;
}

export interface LobbyUserState {
  sessions?: string[];
  events?: Record<string, string>;
  online?: boolean | null;
  rankings?: Record<string, any>;
  personalChatMap?: Record<string, any> | null;
  [key: string]: any;
}

export interface LobbyGameState {
  status?: string;
  [key: string]: any;
}

export interface LobbyWatcherState {
  chatId: string | number;
}

/** Рантайм: `lib.store.Class(class {}, { broadcastEnabled: true })` — свой `create`, остальное из store */
export type LobbyStoreBase = Omit<StoreBaseMethods, 'create'> & {
  create(data: LobbyCreateData): Promise<this>;
};

export interface LobbyInstance extends LobbyStoreBase, StoreBroadcastMethods {
  users: Record<string, LobbyUserState>;
  watchers: Record<string, LobbyWatcherState>;
  games: Record<string, LobbyGameState>;
  rankings: Record<string, any>;
  rankingsUsersTop: string[];
  rankingSortFunc: Record<string, (...args: any[]) => number>;
  avatars: Record<string, string[]>;

  broadcastDataVueStoreRuleHandler(data: Record<string, any>): Record<string, any>;

  userEnter(data: { sessionId: string; userId: string; name?: string; tgUsername?: string }): Promise<void>;
  gameLobbyUserEnter(data: {
    sessionId: string;
    userId: string;
    name?: string;
    tgUsername?: string;
    broadcastableFields: string[];
  }): Promise<void>;
  userLeave(data: { sessionId: string; userId: string }): Promise<void>;

  userGenerateAvatar(data: {
    userId: string;
    userGender: string;
    userInfo?: string;
    currentUserAvatarCode?: string;
    newDefaultAvatars?: { code: string; gender: string };
  }): Promise<void>;

  addGame(data: Record<string, any>): Promise<void>;
  gameFinished(data: { gameId: string }): Promise<void>;
  checkGame(data: { gameId: string; initUserId?: string | null }): Promise<void>;
  checkGameStatuses(): Promise<void>;

  updateRankings(): void;
  checkRatings(data?: { initiatorUserId?: string | null }): void;
  getAvatarPrompt(data: { userGender: string; userInfo?: string }): string;
  getGameConfig(data: { gameType: string; gameConfig: string }): any;

  startWatching(data: { telegramId: string | number; telegramUsername: string }): Promise<void>;
  notifyWatchers(data: { msg: string; tgUsername?: string }): Promise<void>;
  delayedChatEvent(data: { userId: string; targetId: string; chatEvent: Record<string, any> }): Promise<void>;
}

export interface LobbyClass {
  new (data?: { id?: string }, settings?: { chatEnabled?: boolean }): LobbyInstance;
}

declare function createLobbyClass(): LobbyClass;

export = createLobbyClass;
