/* eslint-disable max-len */
({
  utils: {
    async showGamesBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $item = $root.querySelector('.menu-item.game.pinned');
      if (!$item) $root.querySelector('.menu-item.game > label')?.click();

      const $btn = $root.querySelector('.menu-item-content.games .select-btn.active');
      if ($btn) $btn.click(); // скрываем открытые конфиги

      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
  },
  steps: {
    games: {
      initialStep: true,
      text: `
        Это доступные режимы игр. В некоторых режимах <a>есть возможность одиночной игры с компьютером</a>.
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      active: { selector: '.select-btn.wait-for-select:not(.disabled)', css: { boxShadow: '0px 0px 10px 4px white' } },
      buttons: [
        { text: 'Продолжай', step: 'type' },
        { text: 'Я разберусь', action: 'exit', exit: true },
      ],
    },
    type: {
      text: `
        Это список идущих прямо сейчас и ожидающих начала игр.
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      active: [
        { selector: '.game-list-container .tutorial-games', css: { boxShadow: 'none' } },
        { selector: '.game-list-container .no-games-label', css: { display: 'none' } },
        { selector: '.game-list-container', css: { boxShadow: 'inset 0 0 20px 10px white' } },
      ],
      buttons: [{ text: 'Продолжай', step: 'settings' }],
    },
    settings: {
      text: `
        Это тип и основные настройки игры (время на ход, количество&nbsp;игроков&nbsp;и&nbsp;т.п.).
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      active: [
        { selector: '.game-list-container .tutorial-games', css: { boxShadow: 'none' } },
        { selector: '.game-list-container .no-games-label', css: { display: 'none' } },
        {
          selector: '.game-list-container .game-config-info',
          css: { boxShadow: '0 0 10px 10px white', padding: '4px 10px' },
        },
      ],
      buttons: [{ text: 'Дальше', step: 'teams' }],
    },
    teams: {
      text: `
        Это иконка для открытия список команд (<a>только у корпоративных игр</a>). Можно присоединиться к любой команде на выбор.
      `,
      active: [
        { selector: '.game-list-container .tutorial-games', css: { boxShadow: 'none' } },
        { selector: '.game-list-container .no-games-label', css: { display: 'none' } },
        { selector: '.game-list-container .show-teams', css: { boxShadow: '0 0 20px 10px white' } },
      ],
      actions: {
        before: async (data) => {
          const { $root, utils } = data;

          await utils.showGamesBlock(data);

          const $showTeamsBtn = $root.querySelector('.game-list-container .show-teams');
          if (!$showTeamsBtn.classList.contains('open')) $showTeamsBtn.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'join' }],
    },
    join: {
      text: `
        Это кнопка <a>для присоединения к игре</a>.
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      active: [
        { selector: '.game-list-container .tutorial-games', css: { boxShadow: 'none' } },
        { selector: '.game-list-container .no-games-label', css: { display: 'none' } },
        { selector: '.game-list-container .join-btn:not(.viewer)', css: { boxShadow: '0 0 20px 10px white' } },
      ],
      buttons: [{ text: 'Дальше', step: 'view' }],
    },
    view: {
      text: `
        Можно посмотреть игру <a>в качестве наблюдателя</a>.
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      active: [
        { selector: '.game-list-container .tutorial-games', css: { boxShadow: 'none' } },
        { selector: '.game-list-container .no-games-label', css: { display: 'none' } },
        { selector: '.game-list-container .join-btn.viewer', css: { boxShadow: '0 0 20px 10px white' } },
      ],
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
