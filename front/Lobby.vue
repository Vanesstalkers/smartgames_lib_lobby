<template>
  <div style="height: 100%; width: 100%; position: absolute; top: 0; left: 0">
    <slot name="auth-form">
      <auth-form v-if="!state.currentUser" :custom-init-session="state.iframeMode ? initSessionIframe : null" />
    </slot>

    <div
      id="lobby"
      :class="[
        'state-' + lobbyState,
        state.isMobile ? 'mobile-view' : '',
        state.isLandscape ? 'landscape-view' : 'portrait-view',
        !state.currentUser ? 'need-auth' : '',
        isMobilePinned ? 'mobile-pinned' : '',
      ]"
    >
      <slot name="custom-layout" />

      <tutorial
        class="scroll-off"
        :customMenu="customMenu?.() ?? defaultTutorialMenu()"
        :injectedActions="injectedActions()"
      />

      <profile v-if="profileActive" :closeProfile="closeProfile" :userData="userData" />

      <slot name="menu-item-list">
        <div class="menu-item-list">
          <slot name="menu-item-game-full">
            <div :class="['menu-item', pinnedItems.game ? 'pinned' : '', 'game']">
              <label v-on:click="pinMenuItem('game')">
                ИГРОВАЯ КОМНАТА
                <font-awesome-icon :icon="['fas', 'circle-xmark']" size="2xs" />
              </label>
              <slot name="menu-item-game">
                <games class="menu-item-content" />
              </slot>
            </div>
          </slot>
          <slot name="menu-item-rules-full" :pinned="pinnedItems.list" :pinMenuItem="pinMenuItem">
            <div :class="['menu-item', pinnedItems.list ? 'pinned' : '', 'list']">
              <label v-on:click="pinMenuItem('list')">
                ПРАВИЛА ИГР
                <font-awesome-icon :icon="['fas', 'circle-xmark']" size="2xs" />
              </label>
              <slot name="menu-item-rules">
                <rules class="menu-item-content" />
              </slot>
            </div>
          </slot>
          <slot
            name="menu-item-chat-full"
            :pinned="pinnedItems.chat"
            :pinMenuItem="pinMenuItem"
            :unreadMessages="unreadMessages"
            :state="state"
            :userData="userData"
            :hasUnreadMessages="hasUnreadMessages"
            :chatChannels="chatChannels"
          >
            <div :class="['menu-item', pinnedItems.chat ? 'pinned' : '', 'chat']">
              <label v-on:click="pinMenuItem('chat')">
                ОБЩЕНИЕ
                <font-awesome-icon :icon="['fas', 'circle-xmark']" size="2xs" />
                <small v-if="unreadMessages > 0">есть новые сообщения</small>
              </label>
              <slot name="menu-item-chat">
                <chat
                  class="menu-item-content"
                  :defActiveChannel="`lobby-${state.currentLobby}`"
                  :userData="userData"
                  :isVisible="pinnedItems.chat"
                  :hasUnreadMessages="hasUnreadMessages"
                  :channels="chatChannels"
                />
              </slot>
            </div>
          </slot>
          <slot name="menu-item-top-full" :pinned="pinnedItems.top" :pinMenuItem="pinMenuItem" :lobby="lobby">
            <div :class="['menu-item', pinnedItems.top ? 'pinned' : '', 'top']">
              <label v-on:click="pinMenuItem('top')">
                ЗАЛ СЛАВЫ
                <font-awesome-icon :icon="['fas', 'circle-xmark']" size="2xs" />
              </label>
              <slot name="menu-item-top">
                <rankings class="menu-item-content" :games="lobby.rankings" />
              </slot>
            </div>
          </slot>

          <slot name="menu-item-info" :pinned="pinnedItems.info" :pinMenuItem="pinMenuItem">
            <div :class="['menu-item', 'info']">
              {{ gameServerTitle }}
            </div>
          </slot>
        </div>
      </slot>

      <gallery
        :images="galleryData.images"
        :server-origin="galleryData.serverOrigin"
        :filter-config="galleryData.filterConfig"
        @gallery-closed="onGalleryClosed"
      />

      <div class="main-logo">
        <div class="contact-icons-wrapper">
          <a href="https://t.me/smartgamesstudio" target="_black" class="telegram-link"> </a>
          <a href="https://vk.com/smartgames.studio" target="_black" class="vk-link"> </a>
        </div>
      </div>

      <img
        v-if="!state.iframeMode"
        id="bg-img"
        src="./assets/lobby.png"
        usemap="#image-map"
        :style="{
          position: 'absolute',
          left: `${bg.left || 0}px`,
          top: `${bg.top || 0}px`,
          scale: bg.scale || 1,
          transformOrigin: 'center',
          filter: 'grayscale(1)',
        }"
      />
    </div>
  </div>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import { addEvents, removeEvents, events } from './lobbyEvents';

import authForm from './components/AuthForm.vue';
import profile from './components/profile.vue';
import gallery from './components/gallery.vue';
import games from './components/games.vue';
import rankings from './components/rankings.vue';
import rules from './components/rules.vue';
import chat from '~/lib/chat/front/chat.vue';
import tutorial from '~/lib/helper/front/helper.vue';

export default {
  components: {
    PerfectScrollbar,
    authForm,
    tutorial,
    profile,
    gallery,
    games,
    rankings,
    rules,
    chat,
  },
  props: {
    gameServerTitle: null,
    customMenu: Function,
  },
  data() {
    return {
      lobbyState: 'deactivated',
      auth: { login: '', password: '', err: null },
      bg: {
        top: 0,
        left: 0,
      },
      pinnedItemsLoaded: false,
      pinnedItems: {
        chat: false,
        list: false,
        top: false,
        game: false,
        info: false,
      },
      profileActive: false,
      unreadMessages: 0,
      // Данные для компонента галереи
      galleryData: {
        images: [],
        serverOrigin: '',
        filterConfig: { filters: [] },
      },
    };
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      const store = this.state.store || {};

      // не придумал другого способа как предустановить pinneItems с учетом синхронной подгрузки userData
      this.preparePinnedItems(store.user?.[this.state.currentUser]);

      return store;
    },
    userData() {
      const currentUserData = this.store.user?.[this.state.currentUser] || {};
      return { id: this.state.currentUser, ...currentUserData };
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    chatChannels() {
      return {
        [`lobby-${this.state.currentLobby}`]: {
          name: 'Общий чат',
          users: this.lobby.users || {},
          items: this.lobby.chat || {},
        },
      };
    },
    isMobilePinned() {
      return Object.values(this.pinnedItems).find((_) => _) && this.state.isMobile;
    },
  },
  methods: {
    async initSessionIframe({ callLobbyEnter }) {
      const searchParams = new URLSearchParams(document.location.search);
      const portalUserId = searchParams.get('userId');
      const portalToken = searchParams.get('token');
      const joinGameId = searchParams.get('joinGameId');

      const session = await api.action.public({
        path: 'user.api.initSession',
        args: [
          {
            ...{ token: portalToken, portalUserId: portalUserId },
            windowTabId: window.name,
          },
        ],
      });

      localStorage.setItem(window.tokenName, portalToken);
      this.$set(this.$root.state, 'currentToken', portalToken);
      this.$set(this.$root.state, 'currentUser', portalUserId);

      window.parent.postMessage({ emit: { name: 'iframeAlive', data: {} } }, '*');

      callLobbyEnter({ lobbyId: session.lobbyId, joinGameId });
    },
    preparePinnedItems(userData = {}) {
      if (this.pinnedItemsLoaded) return;
      if (!userData?.lobbyConfigs?.pinnedItems) return;
      this.$set(this, 'pinnedItems', userData.lobbyConfigs.pinnedItems);
      this.pinnedItemsLoaded = true;
    },
    pinMenuItem(code) {
      this.pinnedItems[code] = !this.pinnedItems[code];

      const args = [{ lobbyConfigs: { pinnedItems: this.pinnedItems } }];
      api.action.call({ path: 'user.api.update', args }).catch(prettyAlert);
    },
    showProfile() {
      this.profileActive = true;
    },
    closeProfile() {
      this.profileActive = false;
    },
    injectedActions() {
      return {
        showProfile: () => {
          this.showProfile();
        },
      };
    },
    hasUnreadMessages(count = 0) {
      if (this.unreadMessages === 0 && count > 0) {
        prettyAlert({ message: 'Новое сообщение в чате' });
      }
      this.unreadMessages = count;
    },
    // Методы для работы с галереей

    // Метод для обновления галереи (вызывается из rules.vue)
    updateGallery(images, serverOrigin, filterConfig) {
      // Обновляем данные для компонента галереи
      this.galleryData = {
        images,
        serverOrigin,
        filterConfig,
      };
    },

    // Обработчик закрытия галереи
    onGalleryClosed() {
      // Очищаем данные галереи
      this.galleryData = {
        images: [],
        serverOrigin: '',
        filterConfig: { filters: [] },
      };
    },
    defaultTutorialMenu() {
      const menuWrapper = tutorial.menuWrapper(this.userData);
      const menuButtonsMap = tutorial.menuButtonsMap(this.tutorialActions || {});

      const { cancel, tutorials, helperLinks } = menuButtonsMap;
      const fillTutorials = tutorials({
        showList: [
          {
            title: 'Стартовое приветствие',
            action: { tutorial: 'lobby-tutorial-start' },
          },
          {
            title: 'Игровая комната',
            action: { tutorial: 'lobby-tutorial-menuGame' },
          },
        ],
      });

      const actions = this.injectedActions();
      const buttons = [
        cancel(),
        {
          text: 'Открой мой профиль',
          action: async function ({ helper }) {
            helper.menu = null;
            actions.showProfile();
          },
        },
        fillTutorials,
        helperLinks(),
      ];
      if (this.state.iframeMode) {
        buttons.unshift({
          text: 'Выйти из лобби',
          action: async function () {
            window.parent.postMessage({ emit: { name: 'iframeLeaveLobby', data: {} } }, '*');
          },
        });
      }
      return menuWrapper({ buttons });
    },
  },
  provide() {
    const self = this;
    return {
      updateGallery: (images, serverOrigin, filterConfig) => {
        self.updateGallery(images, serverOrigin, filterConfig);
      },
      setLobbyState: (state) => (self.lobbyState = state),
    };
  },
  async mounted() {
    // возврат из game
    if (this.state.currentUser && !this.userData.gameId) {
      this.lobbyState = '';
      if (this.state.iframeMode) {
        window.parent.postMessage({ emit: { name: 'iframeLeaveGame', data: {} } }, '*');
      }
    }

    addEvents(this);
    events.resizeBG();
  },
  async beforeDestroy() {
    removeEvents();
    this.$set(this.$root.state, 'viewLoaded', false);

    // console.log('async beforeDestroy() { this.lobbyState = ', this.lobbyState);

    return; // при входе в игру не выходим из лобби

    await api.action
      .call({
        path: 'lobby.api.exit',
      })
      .then((data) => {
        this.$set(this.$root.state, 'currentLobby', '');
      })
      .catch(prettyAlert);
  },
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss">
@import '@/mixins.scss';

$textshadow: rgb(42, 22, 23);

@mixin menu-item-label-active {
  background-size: 100% 100%;
  background-position: 0% 100%;
  transition:
    background-position 0.7s,
    background-size 0.5s ease-in-out;
  box-shadow: 1px 0px 20px 6px rgba(0, 0, 0, 1);
}

#lobby {
  height: 100%;
  width: 100%;

  > .main-logo {
    z-index: 1;
    position: absolute;
    width: 400px;
    height: 200px;
    left: calc(50% - 200px);
    top: 0px;
    background-image: url(./assets/logo.png);
    background-size: cover;
    transform-origin: top;
  }

  &.state-deactivated,
  &.state-restoring-game {
    > * {
      display: none;
    }
  }

  &.state-restoring-game {
    &:after {
      content: 'Загружается последняя игра...';
      color: #f4e205;
      line-height: 36px;
    }
  }

  .menu-item {
    z-index: 1;
    position: absolute;
    transform: translate(-50%, -50%);
    transition: top 0.7s;

    &.tutorial-active {
      background: white;
    }

    &.pinned,
    &.preview {
      z-index: 2;
    }

    &.pinned {
      > div {
        max-height: none !important;
      }
      > label > svg {
        display: inline-block;
      }
    }

    .menu-item-content {
      visibility: hidden;
      opacity: 0;
      border: 4px solid #f4e205;
      position: absolute;
      left: 0px;
      top: 100%;
      background-image: url(@/assets/clear-black-back.png);
      color: white;
      transition:
        visibility 0s,
        opacity 0.5s linear;
      overflow: auto;
    }

    &:hover > div,
    &.pinned > div,
    &.preview > div,
    &.tutorial-active > div {
      visibility: visible;
      opacity: 1;
    }

    > label {
      cursor: pointer;
      position: relative;
      color: crimson;
      text-shadow:
        $textshadow 0px 0px 0px,
        $textshadow 0.669131px 0.743145px 0px,
        $textshadow 1.33826px 1.48629px 0px,
        $textshadow 2.00739px 2.22943px 0px,
        $textshadow 2.67652px 2.97258px 0px,
        $textshadow 3.34565px 3.71572px 0px,
        $textshadow 4.01478px 4.45887px 0px,
        $textshadow 4.68391px 5.20201px 0px;
      font-family: fantasy;
      font-weight: bold;
      letter-spacing: 10px;
      white-space: nowrap;
      padding-left: 6px;

      font-size: 3em;
      background-image: linear-gradient(#f4e205, #f4e205);
      background-size: 100% 10px;
      background-repeat: no-repeat;
      background-position: 100% 0%;
      transition:
        background-size 0.7s,
        background-position 0.5s ease-in-out;

      > svg {
        display: none;
        padding: 10px;
        position: absolute;
        top: 0px;
        right: 100%;
        color: #f4e205;
        box-shadow: 0px 0px 10px 2px rgb(0, 0, 0);
        background-color: black;
        border-radius: 50%;
        padding: 0px;
        margin: 10px;

        :hover {
          opacity: 0.7;
        }
      }
    }

    &:hover > label,
    &.pinned > label {
      @include menu-item-label-active;
    }

    &.game {
      top: 70%;
      left: 45%;

      &.pinned {
        top: 45%;
        left: 45%;
      }

      > label {
        display: block;
        white-space: pre-line;
      }

      > div {
        height: 300px;
        width: 500px;
        max-height: 200px;
      }
    }

    &.chat {
      top: 60%;
      left: 10%;

      &.pinned {
        top: 10%;
        left: 10%;

        .chat-controls {
          display: flex !important;
        }
      }

      > label > small {
        font-size: 16px;
        letter-spacing: 0px;
        text-align: right;
        position: absolute;
        width: 100%;
        text-align: center;
        left: 0px;
        top: -16px;
        color: #0078d7;
      }

      > div {
        height: 500px;
        width: 300px;
        max-height: 200px;
      }
    }

    &.top {
      top: 35%;
      left: 40%;

      &.pinned {
        top: 10%;
        left: 40%;
      }

      > div {
        height: 200px;
        width: 500px;
      }
    }

    &.list {
      top: 45%;
      left: 80%;

      &.pinned {
        top: 20%;
        left: 80%;
      }

      > div {
        height: 500px;
        width: 400px;
        max-height: 300px;
      }
    }
  }

  iframe {
    z-index: 99999;
    position: absolute;
    width: 100%;
    height: 100%;
    right: 0px;
    bottom: 0px;
  }
}

#lobby:not(.mobile-view) .menu-item.tutorial-active > label {
  @include menu-item-label-active;
}

#lobby.mobile-view .menu-item-list {
  position: relative;
  height: calc(100% - 150px - 50px);
  width: 100%;
  margin-top: 150px;
  @include flex($wrap: wrap);

  .menu-item {
    font-size: 10px;

    &.info {
      top: 0%;
    }

    &.top {
      top: 20%;
    }

    &.list {
      top: 40%;
    }

    &.chat {
      top: 60%;
    }

    &.game {
      top: 80%;
    }

    &.pinned,
    &.tutorial-active {
      top: 0px;
      height: calc(100% - 5% - 50px);
      z-index: 2;
    }
  }
}

#lobby.mobile-pinned .menu-item-list .menu-item:not(.pinned) {
  display: none;
}

#lobby.mobile-view.landscape-view .menu-item-list {
  margin-top: 5%;
  width: 50%;
  height: 100%;

  .menu-item {
    &.game {
      left: 100%;
      top: 150px;
      width: 90%;

      &.pinned,
      &.tutorial-active {
        left: 0px;
        top: 0px;
        width: 100%;

        label {
          display: initial;
          white-space: nowrap;
          left: 20%;
        }

        .menu-item-content {
          width: 185%;
        }
      }
    }

    > div {
      top: auto;
      left: 5%;
      width: 185%;
      height: calc(100% - 30px);
    }
  }
}

#lobby.mobile-view .menu-item {
  left: 0px;
  width: 100%;
  transform: none;
}

#lobby.mobile-view .menu-item > div {
  top: auto;
  left: 5%;
  width: 90%;
  height: 100%;
}

#lobby.mobile-view .menu-item.game > label {
  max-width: 220px;
  margin: auto;
}

#lobby.mobile-view.portrait-view .menu-item.game > div {
  height: 90%;
}

#lobby.mobile-view.landscape-view .menu-item.game > label {
  max-width: 450px;
}

#lobby.mobile-view .menu-item.tutorial-active {
  background: transparent;
  box-shadow: none;
}

#lobby.mobile-view > .main-logo {
  width: 300px;
  height: 150px;
  left: calc(50% - 150px);

  .contact-icons-wrapper {
    top: 80px;
    right: 15px;
  }
}

#lobby.mobile-view.landscape-view > .main-logo {
  left: auto;
  right: 10px;
  top: -25px;
}

.menu-item.info ul,
.menu-item.list ul {
  padding-top: 4px;
  font-size: 18px;
  color: white;
  text-align: left;
}

.menu-item.info ul > li,
.menu-item.list ul > li {
  padding-bottom: 10px;
}

.menu-item.info ul > li > label,
.menu-item.info ul > li > label > a,
.menu-item.info ul > li::marker,
.menu-item.list ul > li > label,
.menu-item.list ul > li > label > a,
.menu-item.list ul > li::marker {
  cursor: pointer;
  font-family: fantasy;
  font-size: 24px;
  color: #f4e205;
  text-decoration: none;
}

.menu-item.list ul > li > span {
  cursor: pointer;
  color: #f4e205;
}

.menu-item ul > li.white > label,
.menu-item ul > li.white > label > a,
.menu-item ul > li.white::marker {
  color: white;
}

.menu-item.info ul > li > label,
.menu-item.info ul > li > label > a,
.menu-item.info ul > li::marker {
  color: crimson;
}

.menu-item.list ul > li:not(.disabled) label:hover,
.menu-item.list ul > li:not(.disabled) label:hover > a,
.menu-item.list ul > li > span:hover,
.menu-item.list ul > li:not(.disabled):hover::marker,
.menu-item.info ul > li:not(.disabled) > label:hover,
.menu-item.info ul > li > span:hover,
.menu-item.info ul > li:not(.disabled):hover::marker {
  color: white;
}

.menu-item.list ul > li.disabled > label {
  cursor: default !important;
}

.menu-item.list ul > li.disabled > label:not(.not-disabled):after {
  content: '(в разработке)';
  color: grey;
  font-size: 20px;
  padding-left: 10px;
}

.menu-item.list ul > li > hr {
  width: 80%;
  margin: 6px 0px;
}

.contact-icons-wrapper {
  position: absolute;
  top: 115px;
  right: 30px;
  display: flex;
  justify-content: center;

  * {
    cursor: pointer;
    width: 30px;
    height: 30px;
    margin: 5px;
    background-size: cover;
    box-shadow: 1.5px 1px black;
    border-radius: 50%;

    &:hover {
      opacity: 0.7;
    }
  }

  .telegram-link {
    background-image: url(./assets/telegram.png);
  }

  .vk-link {
    background-image: url(./assets/vk.png);
  }
}

.helper-dialog {
  .contact-icons-wrapper {
    width: 100%;
    position: relative;
    top: auto;
    left: auto;
    padding-left: 40px;
  }
}

.lobby-btn {
  background: #f4e205;
  border: 2px solid #f4e205;
  color: black;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.lobby-btn:hover,
.lobby-btn[disabled='disabled'] {
  background: black !important;
  color: #f4e205;
}
</style>
