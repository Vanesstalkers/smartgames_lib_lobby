<template>
  <div v-if="showAuthForm" class="auth">
    <div class="form">
      <h3>Вход в лобби</h3>
      <button class="new" v-on:click="createDemoUser">Войти как гость</button>
      <button v-if="!showLoginForm" class="link" v-on:click="toggleLoginForm">Войти с паролем</button>
      <template v-else>
        <div class="inputs">
          <input v-model="auth.login" name="login" placeholder="логин" @input="updateAuth" />
          <span :style="{ width: '10px' }"></span>
          <input v-model="auth.password" name="password" placeholder="пароль" @input="updateAuth" />
        </div>
        <button v-on:click="login">Авторизоваться</button>
      </template>
      <div v-if="auth.err" class="err">{{ auth.err }}</div>
      <br />
      <slot :createDemoUser="createDemoUser"></slot>
    </div>
  </div>
</template>

<script>
import { prepareLobbyGlobals } from '../lobbyGlobals.mjs';

const lobbyGlobals = prepareLobbyGlobals();

export default {
  name: 'AuthForm',
  inject: ['setLobbyState'],
  props: {
    onSuccess: {
      type: Function,
      default: null,
    },
    onError: {
      type: Function,
      default: null,
    },
    customInitSession: {
      type: Function,
      default: null,
    },
    customLobbyEnter: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      showAuthForm: false,
      showLoginForm: false,
      auth: { login: '', password: '', err: null },
    };
  },
  methods: {
    updateAuth() {
      // Сбрасываем ошибку при изменении полей
      if (this.auth.err) {
        this.auth.err = null;
      }
    },
    toggleLoginForm() {
      this.showLoginForm = true;
    },
    async initSession(data = {}) {
      return await lobbyGlobals.initSession.call(this, data, {
        success: async ({ lobbyId }) => {
          if (this.onSuccess) await this.onSuccess({ lobbyId });

          this.callLobbyEnter({ lobbyId });
          this.showAuthForm = false;
        },
        error: async (err = {}) => {
          let { code, message } = err;

          if (message && code !== 'new_user') this.auth.err = message;
          if (this.onError) await this.onError(err);

          this.showAuthForm = true;
        },
      });
    },
    updateLobbyState(state) {
      if (this.setLobbyState) this.setLobbyState(state);
    },
    async callLobbyEnter(data) {
      if (this.customLobbyEnter) return this.customLobbyEnter(data);

      const { lobbyId, joinGameId } = data;
      await api.action
        .call({ path: 'lobby.api.enter', args: [{ lobbyId }] })
        .then(async (data) => {
          this.updateLobbyState('');
          this.$set(this.$root.state, 'currentLobby', lobbyId);

          if (joinGameId) {
            this.updateLobbyState('joining-game');

            const args = [{ gameId: joinGameId }];
            await api.action.call({ path: 'game.api.join', args }).catch(prettyAlert);
          } else if (data.restoreGame) {
            this.updateLobbyState('restoring-game');

            const args = [data.restoreGame];
            await api.action
              .call({ path: 'game.api.restore', args })
              .then(() => this.updateLobbyState(''))
              .catch(prettyAlert);
          }
        })
        .catch(prettyAlert);
    },
    async createDemoUser({ tutorial } = {}) {
      await this.initSession({ demo: true, tutorial });
    },
    async login() {
      const { login, password } = this.auth;
      await this.initSession({ login, password });
    },
  },
  async mounted() {
    if (this.customInitSession) {
      await this.customInitSession({
        callLobbyEnter: this.callLobbyEnter,
      });
    } else {
      await this.initSession();
    }
  },
};
</script>

<style lang="scss" scoped>
.auth {
  z-index: 10001;
  position: fixed;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  background-image: url(@/assets/clear-black-back.png);
  background-size: cover;
  display: grid;

  > .form {
    align-self: center;
    justify-self: center;
    width: 400px;
    height: auto;
    border: 4px solid #f4e205;
    display: flex;
    flex-wrap: wrap;
    color: #f4e205;
    max-width: 90%;
    position: fixed;

    > .err {
      width: 100%;
      color: orangered;
      margin-bottom: 10px;
    }

    > h3 {
      width: 100%;
      text-align: center;
    }

    > .inputs {
      width: 100%;
      display: flex;
      margin: 10px;

      > input {
        width: 50%;
        font-size: 14px;
        padding: 2px 8px;
        background: transparent;
        border: 2px solid #f4e205;
        color: #f4e205;
      }
    }

    > button {
      width: 100%;
      margin: 10px;
      background: transparent;
      color: #f4e205;
      border: 2px solid #f4e205;
      cursor: pointer;

      &:hover {
        opacity: 0.7;
      }

      &.new {
        background-color: #f4e205;
        color: black;
      }

      &.link {
        background: transparent;
        border: none;
        text-decoration: underline;
        font-size: 16px;
        padding: 0;
        margin: 5px 0;
        font-size: 12px;
        padding-bottom: 10px;
      }
    }
  }
}
</style>
