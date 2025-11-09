<template>
  <div v-if="showAuthForm" class="auth">
    <div class="form">
      <h3>Вход в лобби</h3>
      <button class="new" v-on:click="createDemoUser">Войти как гость</button>
      <button v-if="!showLoginForm" class="link" v-on:click="toggleLoginForm">
        Войти с паролем
      </button>
      <template v-else>
        <div class="inputs">
          <input
            v-model="auth.login"
            name="login"
            placeholder="логин"
            @input="updateAuth"
          />
          <span :style="{ width: '10px' }"></span>
          <input
            v-model="auth.password"
            name="password"
            placeholder="пароль"
            @input="updateAuth"
          />
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
export default {
  name: "AuthForm",
  props: {
    onSuccess: {
      type: Function,
      default: null,
    },
    onError: {
      type: Function,
      default: null,
    },
    callLobbyEnter: {
      type: Function,
      default: null,
    },
    customInitSession: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      showAuthForm: false,
      showLoginForm: false,
      auth: { login: "", password: "", err: null },
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
    async initSession(config = {}) {
      await this.$root.initSession(config, {
        success: async ({ lobbyId, availableLobbies }) => {
          this.showAuthForm = false;

          if (this.onSuccess) {
            await this.onSuccess({ lobbyId, availableLobbies });
          } else {
            // Дефолтная обработка успеха
            if (lobbyId) {
              this.$set(this.$root.state, "currentLobby", lobbyId);
              this.$emit("session-success");
            } else {
              if (availableLobbies.length && this.callLobbyEnter) {
                await this.callLobbyEnter({ lobbyId: availableLobbies[0] });
              }
            }
          }
        },
        error: async (err = {}) => {
          let { code, message } = err;

          if (message && code !== 'new_user') {
            this.auth.err = message;
          }
          if (this.onError) {
            await this.onError(err);
          } else {
            this.$emit("session-error", err);
          }

          this.showAuthForm = true;
        },
      });
    },
    async createDemoUser({ tutorial } = {}) {
      await this.initSession({ demo: true, tutorial });
    },
    async login() {
      await this.initSession({
        login: this.auth.login,
        password: this.auth.password,
      });
    },
  },
  async mounted() {
    if (this.customInitSession) {
      await this.customInitSession();
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
