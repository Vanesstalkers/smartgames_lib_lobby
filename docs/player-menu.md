# Меню игрока в лобби

Описание работы меню игрока в компоненте `Lobby.vue` — навигация по лобби и всплывающее меню помощника.

## Обзор

Меню игрока состоит из двух частей:

1. **Основное меню лобби** (`menu-item-list`) — панель с разделами: игровая комната, правила, чат, зал славы.
2. **Меню помощника** (`defaultTutorialMenu`) — всплывающее меню при клике на аватар помощника.

---

## 1. Основное меню лобби (menu-item-list)

### Структура

Основное меню отображается через слот `menu-item-list` и содержит следующие пункты:

| Код      | Название         | Компонент   | Описание                          |
|----------|------------------|-------------|-----------------------------------|
| `game`   | ИГРОВАЯ КОМНАТА  | `games.vue` | Выбор и создание игр              |
| `list`   | ПРАВИЛА ИГР      | `rules.vue` | Правила игр и галерея             |
| `chat`   | ОБЩЕНИЕ          | `chat.vue`  | Общий чат лобби                   |
| `top`    | ЗАЛ СЛАВЫ        | `rankings.vue` | Рейтинги игроков              |
| `info`   | —                | —           | Информационный блок (название сервера) |

### Поведение пунктов меню

#### Hover и Pin

- **При наведении** (`:hover`): контент (`menu-item-content`) показывается под меткой.
- **Клик по метке**: переключает режим «закреплено» (pinned) — панель остаётся открытой.
- **Кнопка закрытия** (иконка `circle-xmark`): открепляет панель (снова клик по label).

#### Состояние pinned

- `pinnedItems` — объект с флагами: `{ game, list, chat, top, info }`.
- При переключении вызывается `pinMenuItem(code)`:
  - меняется `this.pinnedItems[code]`;
  - сохранение на сервере через `user.api.update` с `lobbyConfigs.pinnedItems`.

#### Восстановление pinned

- При загрузке из `store.user[currentUser].lobbyConfigs.pinnedItems` вызывается `preparePinnedItems()`.
- После первой загрузки `pinnedItemsLoaded = true`, дальнейшая синхронизация не выполняется.

### Позиционирование

Разные viewport и ориентации меняют расположение пунктов.

**Десктоп:**

- `game`: ~70% сверху, ~45% слева (при pinned — ~45% сверху)
- `chat`: ~60% сверху, ~10% слева (при pinned — ~10% сверху)
- `top`: ~35% сверху, ~40% слева (при pinned — ~10% сверху)
- `list`: ~45% сверху, ~80% слева (при pinned — ~20% сверху)

**Мобильный портрет** (`mobile-view portrait-view`):

- Пункты идут вертикально с шагом ~20%.
- При pinned один пункт разворачивается почти на весь экран (`height: calc(100% - 5% - 50px)`).

**Мобильный ландшафт** (`mobile-view landscape-view`):

- Список меню занимает ~50% ширины.
- Игровая комната при pinned — слева с увеличенной областью контента.

**Режим mobile-pinned**:

- Если хотя бы один пункт закреплён и включён мобильный режим, остальные пункты скрыты (`display: none`).

### Слоты для кастомизации

Можно переопределить секции через слоты:

- `menu-item-game-full` / `menu-item-game`
- `menu-item-rules-full` / `menu-item-rules`
- `menu-item-chat-full` / `menu-item-chat`
- `menu-item-top-full` / `menu-item-top`
- `menu-item-info`

В `*-full` слоты передаются `pinned`, `pinMenuItem` и специфичные для раздела данные.

### Чаты и уведомления

- В метке «ОБЩЕНИЕ» отображается: *«есть новые сообщения»*, если `unreadMessages > 0`.
- `hasUnreadMessages(count)` вызывается из чата; при появлении первого непрочитанного показывается `prettyAlert`.

---

## 2. Меню помощника (defaultTutorialMenu)

### Как показывается

- Компонент `tutorial` (helper) рендерится в `Lobby.vue`.
- При клике на аватар помощника (`helper-guru`) вызывается `initMenu`.
- В `customMenu` передаётся: `customMenu?.() ?? defaultTutorialMenu()`.

То есть используется `customMenu`, если он задан, иначе — стандартное меню лобби.

### Структура defaultTutorialMenu()

Метод возвращает объект меню:

```javascript
menuWrapper(this.userData)({ buttons })
```

`menuWrapper` (из `helper.vue`) создаёт объект с:

- `text`: «Чем могу помочь, {name|login}?»
- `bigControls: true`
- `buttons`: массив кнопок

### Кнопки по умолчанию

1. **Спасибо, ничего не нужно** — закрывает меню (`action: 'exit'`).
2. **Открой мой профиль** — открывает профиль (`actions.showProfile()`), меню закрывается.
3. **Восстановить корпоративную игру** — запрашивает `game.api.getRestorableGames`, показывает список игр из `game_dump`, в которых участвовал игрок. При выборе — восстановление через `game.api.restore` с `needLoadGame: true`.
4. **Покажи доступные обучения** — список туториалов:
   - «Стартовое приветствие» — `tutorial: 'lobby-tutorial-start'`
   - «Игровая комната» — `tutorial: 'lobby-tutorial-menuGame'`
5. **Активировать быстрые подсказки** — вызов `helper.api.restoreLinks`, обновление helper-ссылок.

### Режим iframe

Если `state.iframeMode === true`:

- В начало списка добавляется кнопка **«Выйти из лобби»**.
- Её действие: `window.parent.postMessage({ emit: { name: 'iframeLeaveLobby', data: {} } }, '*')`.

### Внедряемые действия (injectedActions)

- `showProfile` — открытие профиля.
- Другие действия можно добавить в `injectedActions()` и использовать в кастомном меню.

### Кастомное меню

Для своего меню нужно передать в `Lobby.vue` проп `customMenu`:

```javascript
customMenu: function() {
  const menuWrapper = tutorial.menuWrapper(this.userData);
  const menuButtonsMap = tutorial.menuButtonsMap(this.tutorialActions || {});
  // Собрать кнопки по своему усмотрению
  return menuWrapper({ buttons: [...] });
}
```

---

## 3. Быстрые подсказки (helper links)

Ссылки на элементы меню задаются в `tutorial/getHelperLinks.js`:

- `menuTop` → `.menu-item.top > label` → туториал «Зал славы»
- `menuChat` → `.menu-item.chat > label` → туториал «Общение»
- `menuGame` → `.menu-item.game > label` → туториал «Игровая комната»
- и др. (меню игр, режимы и т.п.)

Туториалы лобби: `start.js`, `menuTop.js`, `menuGame.js`, `menuChat.js`.

---

## 4. Связанные файлы

| Файл | Назначение |
|------|------------|
| `Lobby.vue` | Основной компонент, `pinMenuItem`, `defaultTutorialMenu`, `preparePinnedItems` |
| `~/lib/helper/front/helper.vue` | Компонент `tutorial`, `menuWrapper`, `menuButtonsMap` |
| `tutorial/getHelperLinks.js` | Селекторы и туториалы для helper-ссылок |
| `tutorial/start.js`, `menuGame.js`, `menuTop.js`, `menuChat.js` | Сценарии туториалов |
| `components/games.vue`, `rules.vue`, `rankings.vue` | Контент пунктов меню |
| `~/lib/chat/front/chat.vue` | Компонент чата |
| `~/lib/game/api/getRestorableGames.js` | API списка восстанавливаемых игр из `game_dump` |
