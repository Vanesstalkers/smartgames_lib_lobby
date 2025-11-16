<template>
  <div>
    <auth-form
      v-if="!state.currentUser"
      :on-success="handleAuthSuccess"
      :call-lobby-enter="callLobbyEnter"
      :custom-init-session="customInitSession"
    />

    <div
      id="lobby"
      :class="[
        state.isMobile ? 'mobile-view' : '',
        state.isLandscape ? 'landscape-view' : 'portrait-view',
        !state.currentUser ? 'need-auth' : '',
      ]"
    >
      <tutorial
        class="scroll-off"
        :customMenu="customMenu()"
        :injectedActions="{
          showProfile: () => {
            this.showProfile();
          },
        }"
      />

      <profile
        v-if="profileActive"
        :closeProfile="closeProfile"
        :userData="userData"
      />

      <div class="main-logo">
        <div class="contact-icons-wrapper">
          <a
            href="https://t.me/smartgamesstudio"
            target="_black"
            class="telegram-link"
          >
          </a>
          <a
            href="https://vk.com/smartgames.studio"
            target="_black"
            class="vk-link"
          >
          </a>
        </div>
      </div>

      <img
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
import { addEvents, removeEvents, events } from "./lobbyEvents";

import tutorial from "~/lib/helper/front/helper.vue";
import profile from "./components/profile.vue";
import authForm from "./components/AuthForm.vue";

export default {
  components: {
    tutorial,
    profile,
    authForm,
  },
  props: {
    customInitSession: Function,
  },
  data() {
    return {
      gameRestoreProcess: false,
      unreadMessages: 0,
      profileActive: false,
      bg: {
        top: 0,
        left: 0,
        showMask: "",
      },
      pinnedItemsLoaded: false,
      pinned: {
        chat: false,
        list: false,
        top: false,
        game: false,
        info: false,
      },
      // Данные для компонента галереи
      galleryData: {
        images: [],
        serverOrigin: "",
        filterConfig: { filters: [] },
      },
    };
  },
  watch: {},
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
  },
  methods: {
    async handleAuthSuccess({ lobbyId } = {}) {
      await this.callLobbyEnter({ lobbyId });
    },
    async callLobbyEnter({ lobbyId }) {
      await api.action
        .call({ path: "lobby.api.enter", args: [{ lobbyId }] })
        .then((data) => {
          console.log("callLobbyEnter then data", data);
          this.$set(this.$root.state, "currentLobby", lobbyId);
          if (data.restoreGame) this.gameRestoreProcess = true;
        })
        .catch(prettyAlert);
    },
    preparePinnedItems(userData = {}) {
      if (this.pinnedItemsLoaded) return;
      if (!userData?.lobbyPinnedItems) return;
      this.$set(this, "pinned", userData.lobbyPinnedItems);
      this.pinnedItemsLoaded = true;
    },
    customMenu() {
      const menuWrapper = tutorial.menuWrapper(this.userData);
      const menuButtonsMap = tutorial.menuButtonsMap(this.tutorialActions);

      const { cancel, tutorials, helperLinks } = menuButtonsMap;
      const fillTutorials = tutorials({
        showList: [
          {
            title: "Стартовое приветствие",
            action: { tutorial: "lobby-tutorial-start" },
          },
          {
            title: "Игровая комната",
            action: { tutorial: "lobby-tutorial-menuGame" },
          },
          {
            title: "Корпоративные игры в тематике ИТ",
            action: { tutorial: "lobby-tutorial-menuGameReleaseCorporate" },
          },
          {
            title: "Корпоративные игры для автобизнеса",
            action: { tutorial: "lobby-tutorial-menuGameAutoPoker" },
          },
        ],
      });

      const self = this;
      return menuWrapper({
        buttons: [
          cancel(),
          {
            text: "Открой мой профиль",
            action: async function () {
              self.menu = null;
              self.showProfile();
            },
          },
          fillTutorials,
          helperLinks(),
        ],
      });
    },
    showProfile() {
      this.profileActive = true;
    },
    closeProfile() {
      this.profileActive = false;
    },
  },
  async created() {
    this.state.emit.joinGame = (data) => {
      const { deckType, gameType, gameId } = data;
      app.$router
        .push({ path: `/game/${deckType}/${gameType}/${gameId}` })
        .catch((err) => {
          console.log(err);
        });
    };
    this.state.emit.leaveGame = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      app.$router.push({ path: `/` }).catch((err) => {
        console.log(err);
      });
    };
  },
  async mounted() {
    console.log("lib.lobby mounted() {");
    addEvents(this);
    events.resizeBG();
  },
  async beforeDestroy() {
    removeEvents();
  },
};
</script>
<style lang="scss">
#lobby {
  height: 100%;
  width: 100%;
}

#lobby > .main-logo {
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
</style>
