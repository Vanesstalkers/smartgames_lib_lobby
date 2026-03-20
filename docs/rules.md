# Правила / Правила игры (rules)

Раздел **«Правила»** отвечает за отображение ссылок на PDF с правилами и за загрузку изображений/карточек в галерею по клику на “Список карт” внутри выбранной игры (deck) и группы карт (group).

---

## Где расположен компонент

- `\application\lib\lobby\front\components\rules.vue`

Компонент использует:
- обертку прокрутки `PerfectScrollbar`
- общую функцию `updateGallery`, полученную через `inject`
- данные лобби из `$root.state` и `store`

---

## Источники данных (computed)

Компонент читает глобальные данные так:
- `state`: `this.$root.state || {}`
- `store`: `this.state.store || {}`
- `lobby`: `this.store.lobby?.[this.state.currentLobby] || {}`

В результате `rules.vue` зависит от того, что в store лобби доступны:
- `lobby.gameServers` (с серверами для разных deck’ов)
- `state.currentLobby` (ключ, по которому выбирается текущий lobby)

---

## UI: какие секции показывает

`rules.vue` отображает секции из ответа бэкенда:
- фронт сначала загружает `rulesSections` из `game.api.rulesMenu`
- каждая секция содержит:
  - `title` и `description`
  - `pdfLinks: [{ label, path }]` (рендерятся как `serverOrigin + path`)
  - `galleries: [{ label, selectGroup }]` (кликабельные элементы, открывают галерею)

---

## Поведение по клику: `showGallery(selectGroup)`

Метод `showGallery` выполняет 3 шага:

1) Использует `serverOrigin` текущего игрового сервиса
- вычисляется как `lobby.gameServers[gameCode].serverUrl`, где `gameCode = lobby.__gameServerConfig.code`

2) Загружает карточки с бэкенда
Запрос выполняется на:
- `POST ${serverOrigin}/api/action/public`

Тело:
- `path: 'game.api.cards'`
- `args: [{ selectGroup: selectGroup }]`

Ожидаемая форма ответа:
- результат парсится как JSON
- берется `result.cards`

3) Подбирает фильтры для галереи и передает данные
Фильтры выбираются через `getFilterConfig(deck, group)`, где:
- `deck = gameCode = lobby.__gameServerConfig.code`
- `group = selectGroup`

Далее выполняется:
- `this.updateGallery(images, serverOrigin, filterConfig)`

---

## Конфигурация фильтров

Конфигурация фильтров хранится в:
- `\application\lib\lobby\front\components\gallery-filters-config.mjs`

`rules.vue` использует `FILTER_CONFIGS` и выбирает `filterConfig` по ключам формата:
- `auto.car`
- `bank.product`

Если для конкретного `${deck}.${group}` конфигурация отсутствует, используется дефолт:
- `{ filters: [] }`

---

## Ожидаемая схема зависимостей и контрактов

Для корректной работы `rules.vue` требуется, чтобы:

1) На сервере текущего игрового сервиса был доступен эндпоинт:
  - `game.api.rulesMenu`
  - ответ должен содержать `result.rules`

2) Эндпоинт `POST /api/action/public` на сервере игр возвращал структуру:
```js
{
  result: {
    cards: [...]
  }
}
```

3) Метод `updateGallery` (inject) умел принимать:
- список `images` (карточки)
- `serverOrigin` (для дальнейших действий/линков внутри галереи)
- `filterConfig` (настройки UI фильтров)

---

## Практические замечания

- `showGallery` делает сетевой запрос **на каждый клик** — повторные клики на одну и ту же группу будут заново запрашивать данные.
- В текущей реализации нет явной обработки ошибок `fetch`/парсинга JSON — при проблемах с сервером галерея может не обновиться.

