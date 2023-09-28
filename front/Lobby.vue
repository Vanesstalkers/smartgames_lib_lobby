<template>
  <div
    id="lobby"
    :class="[
      state.isMobile ? 'mobile-view' : '',
      state.isLandscape ? 'landscape-view' : 'portrait-view',
      !state.currentUser ? 'need-auth' : '',
    ]"
  >
    <div class="main-logo">
      <div class="contact-icons-wrapper">
        <a href="https://t.me/smartgamesstudio" target="_black" class="telegram-link"> </a>
        <a href="https://vk.com/smartgames.studio" target="_black" class="vk-link"> </a>
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
</template>

<script>
export default {
  components: {},
  props: {
    customInitSession: Function,
  },
  data() {
    return {
      auth: { login: '', password: '', err: null },
      bg: {
        top: 0,
        left: 0,
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
    async initSession(config = {}) {
      await this.$root.initSession(config, {
        success: async ({ lobbyId, availableLobbies }) => {
          if (lobbyId) {
            this.$set(this.$root.state, 'currentLobby', lobbyId);
            this.lobbyDataLoaded = true;
          } else {
            if (availableLobbies.length) await this.callLobbyEnter({ lobbyId: availableLobbies[0] });
          }
        },
        error: async (err) => {
          if (err.message) this.auth.err = err.message;
          // чтобы пользователь увидел форму авторизации
          this.lobbyDataLoaded = true;
        },
      });
    },
  },
  async created() {
    this.state.emit.joinGame = (data) => {
      const { deckType, gameId } = data;
      app.$router.push({ path: `/game/${deckType}/${gameId}` }).catch((err) => {
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
    if (this.state.currentUser && this.state.currentLobby) {
      this.lobbyDataLoaded = true;
    } else {
      const initSession = this.customInitSession || this.initSession;
      initSession();
    }
  },
  async beforeDestroy() {},
};
</script>
<style lang="scss">
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
