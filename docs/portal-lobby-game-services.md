# Взаимодействие Портал-лобби и игровых сервисов

Этот документ описывает, как **портал-лобби** агрегирует информацию об игровых сервисах (например `release`, `bank`, `auto`, `billion`) и как затем фронт использует эти данные для подключения в “игровую комнату”.

## Термины и роли
- **Портал-лобби**: лобби-агрегатор, который хранит карту доступных игровых сервисов в `lobby.gameServers` и рассылает её на клиент.
- **Игровой сервис**: сервис доменного уровня (например `release`/`bank`/`auto`/`billion`), который при старте сообщает портал-лобби, какие варианты игр доступны, где находится фронт (`url`) и где находится API (`serverUrl`).

---

## Контракт данных `gameServerConnected`
Игровой сервис публикует в канал портал-лобби action с именем:
`gameServerConnected`

и передаёт параметры в формате:
- `code` — ключ сервиса (например `release`, `bank`, `auto`, `billion`)
- `channelName` — имя канала, на который портал-лобби подпишется, чтобы получать обновления по `games`
- остальная часть `serverData` — конфигурация сервиса, которая будет положена в `lobby.gameServers[code]`
  - типично: `title`, `icon`, `active`, `url`, `serverUrl`, `games` (и/или другие поля, которые фронт использует для join/iframe)

---

## Шаги протокола: кто кого “подключает”
### 1) Игровой сервис при старте публикует `gameServerConnected`
В каждом игровом сервисе есть доменный старт-скрипт, который:
1. находит channelName портал-лобби в Redis (через ключ `smartgamesPortalLobby`)
2. формирует конфигурацию сервиса (`lib.lobby.__gameServerConfig` или аналогичную структуру)
3. публикует действие `gameServerConnected` в канал портал-лобби

Примеры файлов, где это происходит:
- `release\application\domain\lobby\start.js`
- `billion\application\domain\lobby\start.js`
- `bank\application\domain\game\start.js` (для bank публикуется `gameServerConnected`)
- `auto\application\domain\game\start.js` (аналогично)
- `core\application\domain\game\start.js` (шаблон/база для подобных сервисов)

---

### 2) Портал-лобби принимает action и заполняет `gameServers`
Портал-лобби обрабатывает действие в:
- `lobby\application\domain\lobby\class.js`
  - метод `gameServerConnected({ code, channelName, ...serverData })`

Внутри метода происходит:
1. сохранение конфигурации сервиса:
   - `this.set({ gameServers: { [code]: serverData } })`
2. подписка портал-лобби на канал конкретного сервиса:
   - `this.subscribe(channelName, { rule: 'fields', fields: ['games', 'rankings', 'rankingsUsersTop'] })`

Смысл подписки: портал хранит `games` в `gameServers[code].games`, а также получает рассчитанные топ-рейтинги `rankings` и `rankingsUsersTop` (чтобы корректно отфильтровать игроков на фронте) из состояния игровых сервисов.

---

### 3) Портал-лобби рассылает `lobby.gameServers` на фронт
Как только `gameServers` меняется в доменном объекте лобби, оно попадает в Vue-store через механизм `lib.store`/broadcast (вызов `saveChanges()` запускает обновление подписчиков).

---

### 4) Фронт использует `lobby.gameServers` для отображения и join
Во фронт-части портал-лобби:
- отображает список сервисов на основе `this.lobby.gameServers`
- при выборе сервиса строит iframe-url используя `lobby.gameServers[gameCode].url`

Конкретные места:
- `lobby\application\domain\lobby\front\Lobby.vue`
  - `gamesList`: `Object.entries(this.lobby.gameServers || {})`
  - `showGameLobbyIframe(...)`: использует `this.lobby.gameServers[gameCode].url` для сборки адреса iframe

---

## Что важно при расширении
1. Чтобы новый сервис появился в меню, достаточно обеспечить публикацию `gameServerConnected` с корректным `code` и заполненным `serverData` (минимум: `url`, `serverUrl`, `games`).
2. Чтобы портал-лобби получал обновления списка игр, нужно передать корректный `channelName`, на который портал сможет подписаться.
3. Любое изменение ключей в `serverData` должно учитывать, что фронт читает конкретные поля (`url`, `serverUrl`, `games` и т.д.).

