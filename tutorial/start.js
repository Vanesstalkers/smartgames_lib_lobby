/* eslint-disable max-len */
({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: `
        Приветствую на портале обучающих настольных бизнес-игр.
        <a>Я могу провести короткую экскурсию</a>.
      `,
      buttons: [
        { text: 'Продолжай', step: 'fullscreen' },
        { text: 'Я разберусь', step: 'exit', exit: true },
      ],
    },
    fullscreen: {
      superPos: true,
      text: `
        В левом верхнем углу кнопка, которая включает <a>режим полного экрана</a>. Повторное нажатие на нее отключит этот режим.
      `,
      active: '.fullscreen-btn',
      buttons: [{ text: 'Продолжай', step: 'games' }],
    },
    games: {
      text: `
        В разделе ПРАВИЛА ИГР <a>список всех игр на портале</a>. Можно&nbsp;скачать&nbsp;<a>правила</a> в pdf-формате, а также посмотреть&nbsp;<a>все&nbsp;карты&nbsp;каждой&nbsp;колоды</a>.
      `,
      actions: {
        before: ({ $root }) => {
          $root.querySelectorAll('.menu-item.pinned label').forEach(($el) => $el.click());

          const $item = $root.querySelector('.menu-item.list.pinned');
          if (!$item) $root.querySelector('.menu-item.list > label')?.click();
        },
      },
      pos: { desktop: 'bottom-left', mobile: 'bottom-right' },
      buttons: [{ text: 'Дальше', step: 'rates' }],
    },
    rates: {
      text: `
        В разделе ЗАЛ СЛАВЫ <a>рейтинги достижений всех игроков</a>. Там&nbsp;же&nbsp;ты&nbsp;найдешь и статистику по своим играм.
      `,
      actions: {
        before: ({ $root }) => {
          let $item = $root.querySelector('.menu-item.list.pinned');
          if ($item) $root.querySelector('.menu-item.list > label')?.click();
          $item = $root.querySelector('.menu-item.top.pinned');
          if (!$item) $root.querySelector('.menu-item.top > label')?.click();
        },
      },
      pos: { desktop: 'bottom-left', mobile: 'bottom-right' },
      buttons: [{ text: 'Дальше', step: 'chat' }],
    },
    chat: {
      text: `
      ЧАТ ПОРТАЛА предназначен для общения игроков между собой и&nbsp;<a>поиска соперника</a>. В том числе есть возможность написать&nbsp;личное&nbsp;сообщение.
      `,
      actions: {
        before: ({ $root }) => {
          let $item = $root.querySelector('.menu-item.top.pinned');
          if ($item) $root.querySelector('.menu-item.top > label')?.click();
          $item = $root.querySelector('.menu-item.chat.pinned');
          if (!$item) $root.querySelector('.menu-item.chat > label')?.click();
        },
      },
      pos: { desktop: 'bottom-right', mobile: 'bottom-right' },
      buttons: [{ text: 'Дальше', step: 'playground' }],
    },
    playground: {
      text: `
        В разделе ИГРОВАЯ КОМНАТА, ты можешь <a>начать новую партию в&nbsp;одиночном режиме или с соперниками</a>. Также присутствует режим наблюдателя, позволяющий наблюдать за чужими играми.
      `,
      actions: {
        before: ({ $root }) => {
          let $item = $root.querySelector('.menu-item.chat.pinned');
          if ($item) $root.querySelector('.menu-item.chat > label')?.click();
          $item = $root.querySelector('.menu-item.game.pinned');
          if (!$item) $root.querySelector('.menu-item.game > label')?.click();
        },
      },
      pos: { desktop: 'bottom-right', mobile: 'bottom-right' },
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      superPos: true,
      showMenu: true,
      actions: {
        profile: (data) => {
          data.actions.showProfile();
          return { exit: true };
        },
      },
      active: '.helper-guru',
      text: `
        В левом нижнем углу иконка МЕНЮ ИГРОКА. С помощью него можно:
        
        - получить доступ к своему профилю
        - <a>повторно запустить любое обучение</a>
        <center>Рекомендую сразу заполнить профиль, установив свой личный логин, пароль и выбрав аватар для игры.</center>
      `,
      buttons: [
        { text: 'Перейти в профиль', icon: ['fas', 'user'], action: 'profile' },
        { text: 'Понятно', action: 'exit' },
      ],
    },
  },
});
