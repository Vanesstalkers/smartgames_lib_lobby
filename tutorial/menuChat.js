({
  utils: {
    async showChatBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $item = $root.querySelector('.menu-item.chat.pinned');
      if (!$item) {
        $root.querySelector('.menu-item.chat > label')?.click();
        await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
      }
    },
  },
  steps: {
    chat: {
      initialStep: true,
      text: `
        В чате игроки <a>находят соперников по игре</a> и просто общаются между собой.
      `,
      actions: { before: async (data) => await data.utils.showChatBlock(data) },
      buttons: [
        { text: 'Продолжай', step: 'username' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    username: {
      text: `
        Для того, чтобы писать в чате, <a>необходимо указать свое имя</a>.
      `,
      actions: {
        before: async (data) => {
          const { $root, utils } = data;

          await utils.showChatBlock(data);

          const $inputNameForm = $root.querySelector('.menu-item.chat .chat-controls-alert');
          return { skipStep: !$inputNameForm };
        },
      },
      active: { selector: '.menu-item.chat .chat-controls-alert', css: { boxShadow: 'inset 0 0 20px 10px white' } },
      pos: { desktop: 'bottom-right', mobile: 'top-right' },
      buttons: [{ text: 'Продолжай', step: 'personal' }],
    },
    personal: {
      text: `
        Чтобы написать <a>личное сообщение пользователю</a>, нужно нажать на его имя.
      `,
      actions: { before: async (data) => await data.utils.showChatBlock(data) },
      active: { selector: '.user-list span', css: { boxShadow: '0 0 10px 4px white' } },
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      text: `
        Это <a>список всех доступных чатов</a> (в том числе ранее открытых личных чатов).
      `,
      actions: { before: async (data) => await data.utils.showChatBlock(data) },
      active: '.menu-item.chat .chat-channels',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
