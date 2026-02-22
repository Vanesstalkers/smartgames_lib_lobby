# lib/lobby

Лобби: список игр, пользователи, рейтинги, чат, галерея и общий UI лобби.

## Структура

### Ядро

- **Class.js** — класс `Lobby`: наследует `lib.store.class` с broadcast. Хранит users, watchers, games, rankings, поддерживает чат (декоратор), создание/загрузку лобби, аватары.
- **User.js** — пользователь в контексте лобби (`LobbyUser`): enterLobby/leaveLobby, broadcastableFields.
- **Session.js** — сессия в лобби.
- **start.js** — инициализация лобби при старте (создание/загрузка лобби, заполнение списка типов игр).

### API (`api/`)

- **enter.js** — вход в лобби.
- **exit.js** — выход из лобби.
- **logout.js** — выход из аккаунта.
- **checkGame.js** — проверка активности игрового сервера перед присоединением к игре.

### Фронт (`front/`)

- **Lobby.vue** — главная страница лобби.
- **lobbyEvents.mjs** — обработка событий (WebSocket и т.д.).
- **components/**: game-item.vue, games.vue, tutorial-games.vue, profile.vue, AuthForm.vue, rules.vue, rankings.vue, gallery.vue, gallery-filters-config.mjs.

### Туториалы (`tutorial/`)

- start.js, menuTop.js, menuGame.js, menuChat.js, getHelperLinks.js — шаги и пункты меню туториала лобби.

---

## Функционал лобби (как это работает)

### Инициализация при старте (start.js)

- **Создание/загрузка лобби**: после старта MongoDB вызывается `creatingLobby`: загружается лобби с `code = config.smartgames.appCode + 'Lobby'` (например, `releaseLobby`). Если не найдено — создаётся через `lobby.create({ code })` (users: {}, rankings, avatars из статики `application/static/img/workers`).
- В Redis после старта в ключ с тем же `code` записывается `{ channelName: lobby.channelName() }`, чтобы другие воркеры/клиенты знали канал лобби.
- **Список типов игр**: после старта Redis выполняется `fillingLobbyGamesList`: из `lib.game.actions.getFilledGamesConfigs()` формируется объект игр (по gameType и gameConfig — title, timer, teamsCount, playerCount и т.д.) и записывается в `lib.lobby.__gameServerConfig.games`. Домен может дополнять `__gameServerConfig` (url, serverUrl, code, title) в `domain/lobby/start.js`.

### Вход и выход из лобби (api/enter, api/exit)

- **enter.js**: сессия подписывается на канал `lobby-${lobbyId}` с правилом `vue-store` (данные в формате для Vue store на клиенте). В `onClose` сессии добавляется отписка и вызов `user.leaveLobby`. Затем вызывается `user.enterLobby({ sessionId, lobbyId })`.
- **enterLobby** (User.js): публикуется действие `publishAction(lobbyChannel, 'userEnter', { sessionId, userId, name, tgUsername })`. Лобби в `processAction` вызывает `lobby.userEnter(...)`. Обновляются туториалы/helper для пользователя, данные сохраняются.
- **userEnter** (Class.js): если пользователя ещё нет в `this.users`, создаётся запись с sessions = [], events = {}. Иначе очищаются старые события чата и при необходимости рассылается personalChatMap. Сессия добавляется в user.sessions, выставляется `users[userId].online = true`, лобби подписывается на канал пользователя `user-${userId}` (rule: fields, name/rankings) для обновления рейтингов. При включённом чате создаётся событие «вошёл в лобби». После saveChanges вызывается notifyWatchers (уведомление в Telegram).
- **exit.js**: сессия отписывается от `lobby-${lobbyId}`, session.lobbyId = null, вызывается `user.leaveLobby`.
- **leaveLobby**: публикуется действие `userLeave` в канал лобби. **userLeave** (Class.js): сессия удаляется из user.sessions; если сессий не осталось — отписка лобби от `user-${userId}`, событие чата «вышел», выставляется `users[userId].online = null` (чтобы фронт мог скрыть пользователя), saveChanges.

### Появление игры в списке (addGame, подписка на игру)

- Когда игра создаётся (**game.api.new**), после `game.create()` вызывается `publishAction(session, 'lobby-${lobbyId}', 'addGame', { gameId, creator, gameCode, gameType, playerMap, ... })`. Сообщение уходит в канал лобби; экземпляр лобби получает его в **processAction** и вызывает **lobby.addGame(data)**.
- **addGame** (Class.js):
  - Лобби подписывается на канал игры: `this.subscribe('game-${gameId}', { rule: 'custom', ruleHandler: 'lobbySub' })`. Правило **lobbySub** (в игре: `lib.game.actions.broadcastRules.lobbySub` или доменный аналог) фильтрует рассылку: в лобби попадают только поля round, status, gameCode, gameType, gameConfig, gameTimer, playerMap, maxPlayersToStart, minPlayersToStart и при необходимости store.player (ready и т.д.).
  - Лобби формирует для каждого слота игрока случайные аватары (avatarsMap) и отправляет в канал игры: `publishData('game-${gameId}', { store: { player } })`, чтобы игра могла отображать аватары в карточках.
  - При многопользовательской игре (teamsCount > 1 или playerCount > 1) вызывается notifyWatchers — уведомление в Telegram «Нужны игроки в новую игру».
- Данные **списка игр** в лобби (`this.games`) приходят не в addGame, а при рассылке **от игры**: когда игра делает broadcastData, подписчик с правилом lobbySub получает отфильтрованный объект. Лобби в **processData** обрабатывает ключ `game`: `this.set({ games: map })`, т.е. мержит присланные изменения в `this.games`. Таким образом, при каждом saveChanges игры в лобби обновляется запись по gameId (статус, раунд, playerMap и т.д.).

### Завершение игры и проверка активности (gameFinished, checkGame)

- Когда игра заканчивается, она публикует действие **gameFinished** (или лобби обрабатывает это иначе). Лобби в **gameFinished**: отписывается от `game-${gameId}`, обнуляет `games[gameId]`, saveChanges.
- **checkGame** (api/checkGame.js): вызывается с клиента перед присоединением к игре. Сессия отправляет в канал игры «фейковое» действие (fakeAction), чтобы проверить, жив ли канал (игра на этом воркере). Затем в канал лобби публикуется действие **checkGame** с gameId и initUserId.
- **lobby.checkGame({ gameId, initUserId })**: если игра в статусе FINISHED — отписка и удаление из games. Иначе снова проверяется «живость» канала игры (publishAction fakeAction); если игра не отвечает — отписка, удаление из games, при необходимости удаление из Redis (hdel games). Если игры уже нет в списке и передан initUserId, пользователю отправляется сообщение «Игра была завершена».

После загрузки лобби и при получении обновлений по играм вызывается **checkGameStatuses** — проход по всем gameId в this.games и вызов checkGame для каждой, чтобы убрать «мёртвые» игры из списка.

### Обновления данных лобби (processData)

- Лобби получает рассылки по каналу `lobby-${lobbyId}` и по подпискам на каналы игр. В **processData(data, broadcaster)** обрабатываются ключи:
  - **user**: `this.set({ users: map }, { removeEmptyObject: true })`; при изменении rankings у пользователя вызывается checkRatings(initiatorUserId).
  - **game**: `this.set({ games: map })`, затем checkGameStatuses().
- После изменений вызывается saveChanges(), т.е. состояние сохраняется в MongoDB и снова рассылается подписчикам лобби.

### Рассылка на клиент (broadcastDataVueStoreRuleHandler)

- Подписчики лобби (сессии) используют правило **vue-store**. Данные перед отправкой проходят через **broadcastDataVueStoreRuleHandler**: пользователей фильтруют — оставляют только тех, кто онлайн (`user.online === true`), или с обнулённым online (только что вышел), или входящих в rankingsUsersTop (для таблиц рейтингов). У пользователей убираются служебные поля events и sessions. Так на клиент не уходят лишние данные и сохраняется конфиденциальность.

### Рейтинги (rankings, checkRatings)

- В лобби хранится **rankings** (по gameType и коду рейтинга — rankingMap). При создании лобби вызывается fillRankings(); при загрузке и при обновлении пользователей — **checkRatings({ initiatorUserId, gameType })**: для каждого рейтинга берётся rankingMap, формируется список пользователей (usersTop + при необходимости initiatorUserId), к ним подмешиваются данные из users[userId].rankings, сортировка по rankingSortFunc, выбираются топ-5, результат записывается в rankings и в rankingsUsersTop (уникальный список id для рассылки).

### Чат, наблюдатели, прочее

- **Чат**: подмешан через декоратор `lib.chat['@class'].decorate()`. Лобби не сохраняет chat в БД (preventSaveFields(['chat'])). При входе/выходе пользователя создаются события enter/leave; личные сообщения приходят через delayedChatEvent и personalChatMap, рассылаются в канал пользователя.
- **Наблюдатели (watchers)**: объект watchers (например, telegramUsername → { chatId }) для Telegram-уведомлений; startWatching, notifyWatchers — отправка сообщений в Telegram при входе игроков и при создании многопользовательских игр.
- **Аватары**: при создании лобби список аватаров (male/female) строится из файлов в `application/static/img/workers`. userGenerateAvatar — генерация аватара через Midjourney API, сохранение в статику, рассылка кода аватара пользователю; опционально обновление дефолтных аватаров лобби.

## Связи

- Вызовы `game.api.join` и переход на страницу игры инициируются из `games.vue` и `game-item.vue` (подробнее: [Процесс игры с точки зрения кода](../game/docs/game-process.md#логика-подключения-игрока-к-игре)).
- Домен может переопределять фронт лобби в `domain/lobby/front/` и настройки в `domain/lobby/start.js`.
