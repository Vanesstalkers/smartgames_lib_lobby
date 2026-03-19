# Рейтинги / Зал славы (rankings)

## Назначение раздела
Раздел **«ЗАЛ СЛАВЫ»** показывает таблицы топ-игроков по нескольким рейтингам (в разрезе `gameType` и кода рейтинга).

На фронте таблицы строятся компонентом `front/components/rankings.vue`, а на бэкенде данные для них формируются в `lib/lobby/Class.js` через пересчёт `checkRatings()`.

---

## UI: где рендерится “ЗАЛ СЛАВЫ”
Компонент рейтингов подключается в главное меню лобби:

- `\application\lib\lobby\front\Lobby.vue:86`
  - В меню пункт **«ЗАЛ СЛАВЫ»** отображает компонент:
    - `<rankings :games="lobby.rankings" />`
  - `lobby.rankings` приходит из store лобби.

---

## Фронт: как `rankings.vue` строит таблицу
`\application\lib\lobby\front\components\rankings.vue`

### 1) Меню выбора рейтинга
Компонент получает `props.games` и вычисляет список игр:
- `gameList = Object.entries(this.games || {}) ...`

Для каждого `gameType` формируется список рейтингов:
- `rankingList = Object.entries(game.rankingMap).map(...)`

### 2) Выбор конкретного рейтинга
Когда пользователь выбирает рейтинг, в `activeRating` кладётся:
- `title`
- `headers`
- `list = getUsersRankings({ gameType: game.code, usersList: ranking.usersTop })`

### 3) Построение строк: `getUsersRankings`
Строки таблицы строятся по `usersList` (это и есть `ranking.usersTop`):
1. Для каждого `userId` создаётся строка:
   - `idx` — место (1..N)
   - метрики берутся из:
     - `lobbyUsers[userId].rankings[gameType]`
   - `player` — имя игрока
   - `iam` — пометка “это текущий пользователь”
2. Если в топе по `usersList` текущий пользователь не попал, он добавляется отдельной строкой:
   - либо из `user.rankings[gameType]`
   - либо как `noGames: true`

### 4) Рендер
Таблица использует:
- заголовки `activeRatingHeaders`:
  - всегда `idx` и `player`
  - плюс колонки из `activeRating.headers`
- ячейки `item[header.code]`

Итого: код колонки (`headers[].code`) должен соответствовать полю, которое хранится в `user.rankings[gameType]` (например `money`, `games`, `win`, `crutch`, `penalty`, `totalTime`, `avrTime`).

---

## Бэкенд: структура `lobby.rankings`
`lobby.rankings` хранит **описание рейтингов** и текущий **топ-список**.

Типовая структура (упрощённо):

```js
lobby.rankings = {
  [gameType]: {
    rankingMap: {
      [rankingCode]: {
        usersTop: [userId1, userId2, ...] // обычно до 5
      }
    }
  }
}
```

При **создании** лобби базовая конфигурация рейтингов задаётся через `fillRankings()` (она сохраняется в `rankings`). При **загрузке из БД** `fillRankings()` не вызывается повторно: вместо этого вызывается `checkRatings()`, который пересчитывает `usersTop` внутри `rankings`.

---

## Бэкенд: как `usersTop` пересчитывается (checkRatings)
`\application\lib\lobby\Class.js`

Метод:
- `checkRatings({ initiatorUserId = null, gameType } = {})`

Алгоритм:
1. Выбирается `game = this.rankings[gameType]`.
2. Для каждого рейтинга из `game.rankingMap`:
   1. Берутся кандидаты из `ranking.usersTop` (массив/список, откуда стартует пересчёт).
   2. При наличии `initiatorUserId` он добавляется в список кандидатов, чтобы инициатор гарантированно был пересчитан/попал в топ.
   3. Для каждого кандидата берутся метрики из `this.users[userId].rankings[gameType]`.
   4. Кандидаты сортируются функцией:
      - `this.rankingSortFunc[`${gameType}.${ranking.code}`]`
   5. Берутся первые 5 значений (`splice(0, 5)`).
   6. Получившийся массив id записывается в:
      - `this.rankings[gameType].rankingMap[ranking.code].usersTop`

---

## Бэкенд: откуда берётся описание рейтингов (fillRankings) и сортировки
`\application\domain\lobby\class.js`

Там задаются две части:
1. `fillRankings()`
   - `rankingMap`: `title`, `headers` и `rankingCode`
   - определяет, какие колонки будут в таблице
2. `rankingSortFunc`
   - правила сортировки по ключу вида:
     - `${gameType}.${rankingCode}`

---

## Важный момент: доставка данных на фронт (фильтрация пользователей)
Перед отправкой данных пользователю данные проходят через:
- `broadcastDataVueStoreRuleHandler` в `lib/lobby/Class.js`

Там пользователей фильтруют так, чтобы на фронт уходили:
- онлайн-игроки
- только что вышедшие (online === null)
- и дополнительно игроки из `rankingsUsersTop` (чтобы их метрики были доступны для таблиц).

---

## Практические выводы
1. Если `ranking.usersTop` пустой/не обновляется, на фронте не будет “настоящего” топа (останется добавление текущего пользователя с заглушками).
2. Для корректных колонок важно, чтобы:
   - `headers[].code` совпадал с ключами в `user.rankings[gameType]`.
3. Для добавления нового рейтинга обычно нужно:
   - обновить `fillRankings()` (title + headers),
   - добавить функцию в `rankingSortFunc`,
   - убедиться, что `user.rankings[gameType]` заполняется соответствующими полями в процессе игры.

