/* eslint-disable max-len */
({
  utils: {
    ...lib.lobby.tutorial.menuGame.utils,
    async showGamesBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $label = $root.querySelector('.menu-item.game:not(.pinned) label');
      if ($label) $label.click();

      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
    async transferToConfigBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.showGamesBlock(data);

      const $btn = $root.querySelector('.game-block .select-btn.sales');
      if ($btn) $btn.click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
    async transferToSettingsBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.transferToConfigBlock(data);

      const $btn = $root.querySelector('.game-config-block .select-btn.ai');
      if ($btn) $btn.click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
  },
  steps: {
    init: {
      initialStep: true,
      text: `
        Для начала ознакомительной игры нажми эту кнопку
      `,
      actions: {
        before: async (data) => await data.utils.transferToSettingsBlock(data),
      },
      active: '.game-start-block .select-btn',
      buttons: [{ text: 'Хорошо', action: 'exit', exit: true }],
    },
  },
});
