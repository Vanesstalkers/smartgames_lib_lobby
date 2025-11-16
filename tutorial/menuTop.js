({
  utils: {
    async showTopBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      if (!$root.querySelector('.menu-item.top.pinned')) {
        $root.querySelector('.menu-item.top > label').click();
        await new Promise(resolve => setTimeout(resolve, 0));  // ждем отрисовки фронтенда
      }
      const $close = $root.querySelector('.menu-item-content .title .close');
      if ($close) { // открыта таблица рейтинга
        $close.click();
        await new Promise(resolve => setTimeout(resolve, 0));  // ждем отрисовки фронтенда
      }
      if ($root.querySelector('.menu-item.top.pinned .toggle-ranking')) { // открыт список рейтингов (для первой игры)
        $root.querySelector('.menu-item.top.pinned .toggle-game').click();
        await new Promise(resolve => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
      }
    },
    async showRankings(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      const selector = '.menu-item.top.pinned .toggle-game';

      let $item = $root.querySelector(selector);
      if (!$item) {
        await utils.showTopBlock(data);
        $item = $root.querySelector(selector);
      }
      $item.click();

      await new Promise(resolve => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
    async showRating(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      const selector = '.menu-item.top.pinned .toggle-ranking';

      let $item = $root.querySelector(selector);
      if (!$item) {
        await utils.showRankings(data);
        $item = $root.querySelector(selector);
      }
      $item.click();
    }
  },
  steps: {
    top: {
      initialStep: true,
      text: `
        Для каждой игровой колоды свой список рейтингов.
      `,
      actions: { before: async (data) => await data.utils.showTopBlock(data) },
      active: {
        selector: '.toggle-game > span',
        css: { padding: '4px 10px' }
      },
      buttons: [
        { text: 'Продолжай', step: 'list' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    list: {
      text: `
        Каждый рейтинг формируется по своим показателям. Например, это может быть наибольшее количество игр или полученный доход.
      `,
      actions: { before: async (data) => await data.utils.showRankings(data) },
      active: {
        selector: '.menu-game-item > ul',
        css: {
          boxShadow: 'inset 0px 0px 10px 4px white',
          ...{ marginRight: '40px', paddingTop: "10px", paddingBottom: '10px' }
        }
      },
      buttons: [
        { text: 'Продолжай', step: 'rating' }
      ],
    },
    rating: {
      text: `
        В таблице 5 лучших результатов. <a>Твой личный результат выделен по цвету среди все остальных строк</a>.
      `,
      actions: { before: async (data) => await data.utils.showRating(data) },
      active: 'tr.iam',
      buttons: [
        { text: 'Дальше', step: 'exit' }
      ],
    },
    exit: {
      text: `
        Это иконка для возврата к списку рейтингов.
      `,
      actions: { before: async (data) => await data.utils.showRating(data) },
      active: { selector: '.menu-item-content .title .close', css: { boxShadow: '0px 0px 10px 10px white' } },
      buttons: [
        { text: 'Спасибо', action: 'exit' }
      ],
    },
  },
});
