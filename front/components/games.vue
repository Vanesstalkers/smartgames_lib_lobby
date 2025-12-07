<template>
  <div :class="['games', bigConfig ? 'big-config' : '']">
    <div class="new-game-controls">
      <div v-if="gameDeckList.length > 0" class="breadcrumbs">
        <span
          v-if="!defaultDeckType"
          :class="['select-btn', deckType ? 'active selected' : '']"
          @click="
            selectGameConfig(null), selectGameType(null), selectDeckType(null)
          "
        >
          {{ deckMap[deckType]?.title || "Выбор колоды:" }}
        </span>
        <span v-else class="select-btn active selected preselected">
          {{ deckMap[deckType]?.title }}
        </span>
        <span
          v-if="deckType"
          :class="['select-btn', gameType ? 'active selected' : '']"
          @click="selectGameConfig(null), selectGameType(null)"
        >
          {{
            gameTypeMap[gameType]
              ? gameTypeMap[gameType].title
              : "Выбор типа игры:"
          }}
        </span>
        <span
          v-if="gameType"
          :class="['select-btn', gameConfig ? 'active selected' : '']"
          @click="selectGameConfig(null)"
        >
          {{
            gameConfigMap[gameConfig]
              ? gameConfigMap[gameConfig].title
              : "Выбор режима:"
          }}
        </span>
      </div>
      <div v-else class="breadcrumbs">
        Ожидание подключения игровых серверов...
      </div>

      <slot
        name="new-game-controls"
        :gameType="gameType"
        :gameConfig="gameConfig"
        :gameTypeList="gameTypeList"
        :gameConfigList="gameConfigList"
        :selectGameType="selectGameType"
        :selectGameConfig="selectGameConfig"
        :updateGameTimer="updateGameTimer"
        :updateGameRoundLimit="updateGameRoundLimit"
        :updateTeamsCount="updateTeamsCount"
        :updatePlayerCount="updatePlayerCount"
        :updateMaxPlayersInGame="updateMaxPlayersInGame"
        :handleAddGame="handleAddGame"
        :joinGame="joinGame"
        :showTeam="showTeam"
        :updateDifficulty="updateDifficulty"
        :gameTimer="gameTimer"
        :teamsCount="teamsCount"
        :playerCount="playerCount"
        :maxPlayersInGame="maxPlayersInGame"
        :gameRoundLimit="gameRoundLimit"
        :difficultyList="difficultyList"
        :difficulty="difficulty"
      >
        <div v-if="!deckType" class="game-types">
          <div
            v-for="[code, game] in gameDeckList"
            :key="code"
            :class="[
              'select-btn',
              `game-${code}`,
              'wait-for-select',
              game.active === false ? 'disabled' : '',
            ]"
            @click="selectDeckType(code)"
          >
            <div class="title">
              <font-awesome-icon :icon="game.icon" /> {{ game.title }}
            </div>
          </div>
        </div>
        <div v-if="!gameType" :class="['game-block']">
          <div
            v-for="[code, game] in gameTypeList"
            :key="code"
            :class="[
              'select-btn',
              'wait-for-select',
              code,
              game.disabled ? 'disabled' : '',
            ]"
            :style="game.style || {}"
            @click="selectGameType(code)"
          >
            <font-awesome-icon v-if="game.icon" :icon="game.icon" />
            {{ game.title }}
          </div>
        </div>

        <div v-if="!gameConfig" :class="['game-config-block']">
          <div
            v-for="[code, config] in gameConfigList"
            :key="code"
            :class="[
              'select-btn',
              'wait-for-select',
              code,
              config.disabled ? 'disabled' : '',
            ]"
            :style="config.style || {}"
            v-on:click="selectGameConfig(code)"
          >
            {{ config.title }}
          </div>
        </div>

        <div v-if="gameConfig" class="game-start-block">
          <div v-if="teamsCount.val">
            <div class="flex-block">
              <div class="timer">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateGameTimer(15)"
                  />
                  {{ gameTimer }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateGameTimer(-15)"
                  />
                </span>
                <span class="label"> секунд на ход</span>
              </div>
              <div class="rounds">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateGameRoundLimit(1)"
                  />
                  {{ gameRoundLimit }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateGameRoundLimit(-1)"
                  />
                </span>
                <span class="label"> лимит раундов на игру</span>
              </div>
            </div>
            <div class="flex-block">
              <div class="teams">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateTeamsCount(1)"
                  />
                  {{ teamsCount.val }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateTeamsCount(-1)"
                  />
                </span>
                <span class="label"> всего команд</span>
              </div>
              <button class="select-btn active" @click="handleAddGame()">
                Начать игру
              </button>
            </div>
          </div>
          <div v-else-if="maxPlayersInGame.val">
            <div class="flex-block">
              <div class="timer">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateGameTimer(15)"
                  />
                  {{ gameTimer }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateGameTimer(-15)"
                  />
                </span>
                <span class="label"> секунд на ход</span>
              </div>
              <div class="rounds">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateGameRoundLimit(1)"
                  />
                  {{ gameRoundLimit }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateGameRoundLimit(-1)"
                  />
                </span>
                <span class="label"> лимит раундов на игру</span>
              </div>
            </div>
            <div class="flex-block">
              <div class="max-players">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateMaxPlayersInGame(1)"
                  />
                  {{ maxPlayersInGame.val }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateMaxPlayersInGame(-1)"
                  />
                </span>
                <span class="label"> максимум игроков</span>
              </div>
              <button class="select-btn active" @click="handleAddGame()">
                Начать игру
              </button>
            </div>
          </div>
          <div v-else class="flex-block wrap">
            <div v-if="difficultyList.length" class="flex-block ai-config">
              <span class="label">Уровень ИИ</span>
              <select
                :value="difficulty"
                class="select-input"
                @change="updateDifficulty"
              >
                <option
                  v-for="option in difficultyList"
                  :key="option.code"
                  :value="option.code"
                >
                  {{ option.title }}
                </option>
              </select>
            </div>
            <div class="flex-block">
              <div class="timer">
                <span class="controls">
                  <font-awesome-icon
                    :icon="['fas', 'plus']"
                    @click="updateGameTimer(15)"
                  />
                  {{ gameTimer }}
                  <font-awesome-icon
                    :icon="['fas', 'minus']"
                    @click="updateGameTimer(-15)"
                  />
                </span>
                <span class="label"> секунд на ход</span>
              </div>
              <button class="select-btn active" @click="handleAddGame()">
                Начать игру
              </button>
            </div>
          </div>
        </div>
      </slot>
    </div>
    <hr />
    <div class="game-list-container">
      <perfect-scrollbar class="game-list">
        <div v-if="lobbyGameList.length === 0" class="no-games-label">
          В данный момент нет активных игр
        </div>

        <tutorial-games
          class="tutorial-games"
          :show-teams="showTeams"
          @show-team="showTeam"
        />

        <div v-for="game in lobbyGameList" :key="game.id">
          <game-item
            :game="game"
            :deck-map="deckMap"
            :show-teams="showTeams[game.id]"
            @show-team="showTeam(game.id)"
            @join="joinGame"
          />
        </div>
      </perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import { PerfectScrollbar } from "vue2-perfect-scrollbar";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import GameItem from "./game-item.vue";
import TutorialGames from "./tutorial-games.vue";

export default {
  name: "games",
  components: {
    PerfectScrollbar,
    GameItem,
    TutorialGames,
  },
  props: {
    addGameHandler: {
      type: Function,
      default: null,
    },
    deckMap: {
      type: Object,
      default: () => ({}),
    },
    defaultDeckType: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      gameConfigsLoaded: false,
      deckType: this.defaultDeckType || null,
      gameType: null,
      gameConfig: null,
      gameTimer: 60,
      gameRoundLimit: 40,
      teamsCount: { min: null, max: null, val: null },
      playerCount: { min: null, max: null, val: null },
      maxPlayersInGame: { min: null, max: null, val: null },
      showTeams: {},
      difficultyList: [],
      difficulty: null,
    };
  },
  watch: {
    defaultDeckType(newVal) {
      // если defaultDeckType обновился после инициализации компонента
      this.deckType = newVal || null;
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    userData() {
      const currentUserData = this.store.user?.[this.state.currentUser] || {};
      return { id: this.state.currentUser, ...currentUserData };
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    gameDeckList() {
      const list = Object.entries(this.deckMap);
      return list.sort((a, b) => (a.disabled && !b.disabled ? 1 : -1));
    },
    gameTypeMap() {
      return this.deckMap[this.deckType]?.games || {};
    },
    gameTypeList() {
      return Object.entries(this.gameTypeMap);
    },
    gameConfigMap() {
      return this.gameTypeMap[this.gameType]?.items || {};
    },
    gameConfigList() {
      return Object.entries(this.gameConfigMap);
    },
    lobbyGameList() {
      const list = Object.entries(this.lobby.games || {})
        .map(([id, game]) => Object.assign({}, game, { id }))
        .map((game) => {
          let waitForPlayer = game.status === "WAIT_FOR_PLAYERS";
          if (game.playerMap) {
            const players = Object.keys(game.playerMap).map(
              (id) => game.store?.player[id] || {},
            );
            const readyPlayers = players.filter((player) => player.ready);
            game.readyPlayers = readyPlayers.length;
            game.joinedPlayers =
              readyPlayers.length +
              " из " +
              (game.maxPlayersInGame || players.length);
            if (readyPlayers.length < players.length) waitForPlayer = true;
          }
          if (game.gamesMap) {
            const players = Object.keys(game.playerMap).map(
              (id) => game.store?.player[id] || {},
            );
            game.joinedPlayers = players.length;
            game.teams = Object.entries(game.gamesMap).map(
              ([id, playersMap]) => {
                const players = Object.values(playersMap)
                  .map(
                    (userId) =>
                      this.lobby.users[userId]?.name || "игрок без имени",
                  )
                  .join(", ");
                const gameTitle = game.store?.game[id]?.title;
                const title = `${gameTitle} (${players.length ? players : ""})`;
                return { id, title };
              },
            );
          }
          if (waitForPlayer) game.waitForPlayer = true;
          return game;
        })
        .reverse();

      const sortedList = [
        ...list.filter(({ waitForPlayer }) => waitForPlayer),
        ...list.filter(({ waitForPlayer }) => !waitForPlayer),
      ];
      return sortedList;
    },
    bigConfig() {
      return this.teamsCount.val > 0 ? true : false;
    },
  },
  methods: {
    prepareGameConfigs() {
      const configs = this.userData.lobbyGameConfigs;
      if (!configs) return;

      const {
        gameType,
        gameConfig,
        gameTimer,
        teamsCount,
        playerCount,
        maxPlayersInGame,
        gameRoundLimit,
        difficulty,
      } = configs.active;
      const { difficulty: difficultyList = [] } =
        this.gameTypeMap[gameType]?.items[gameConfig] || {};

      this.$set(this, "gameType", gameType);
      this.$set(this, "gameConfig", gameConfig);

      this.$set(this, "difficultyList", difficultyList);
      if (difficulty) this.$set(this, "difficulty", difficulty);

      if (gameTimer) this.$set(this, "gameTimer", gameTimer);
      if (gameRoundLimit) this.$set(this, "gameRoundLimit", gameRoundLimit);
      if (teamsCount) {
        const { min, max, val } = teamsCount;
        this.$set(this.teamsCount, "min", min);
        this.$set(this.teamsCount, "max", max);
        this.$set(this.teamsCount, "val", val);
      }
      if (playerCount) {
        const { min, max, val } = playerCount;
        this.$set(this.playerCount, "min", min);
        this.$set(this.playerCount, "max", max);
        this.$set(this.playerCount, "val", val);
      }
      if (maxPlayersInGame) {
        const { min, max, val } = maxPlayersInGame;
        this.$set(this.maxPlayersInGame, "min", min);
        this.$set(this.maxPlayersInGame, "max", max);
        this.$set(this.maxPlayersInGame, "val", val);
      }

      this.gameConfigsLoaded = true;
    },
    selectDeckType(type) {
      if (type === null || this.deckMap[type]?.active !== false) {
        this.deckType = type;
      }
    },
    selectGameType(type) {
      if (this.gameTypeMap[type]?.disabled && type !== null) return;

      this.gameType = type;

      const activeConfigs = this.gameConfigList.filter(
        ([code, config]) => !config.disabled,
      );
      if (activeConfigs.length === 1)
        this.selectGameConfig(activeConfigs[0][0]);
    },
    selectGameConfig(type) {
      if (this.gameConfigMap[type]?.disabled && type !== null) return;

      this.gameConfig = type;

      const {
        teamsCount,
        playerCount,
        maxPlayersInGame,
        difficulty: difficultyList = [],
      } = this.gameConfigMap[type] || {};

      this.$set(this, "difficultyList", difficultyList || []);
      if (!this.difficulty && difficultyList.length)
        this.$set(this, "difficulty", difficultyList[0].code);

      this.$set(this, "teamsCount", { min: null, max: null, val: null });
      if (teamsCount && teamsCount.toString().includes("-")) {
        const [min, max] = teamsCount
          .toString()
          .split("-")
          .map((num) => parseInt(num));
        this.$set(this, "teamsCount", { min, max, val: max });
      }

      this.$set(this, "playerCount", { min: null, max: null, val: null });
      if (playerCount && playerCount.toString().includes("-")) {
        const [min, max] = playerCount
          .toString()
          .split("-")
          .map((num) => parseInt(num));
        this.$set(this, "playerCount", { min, max, val: max });
      }

      this.$set(this, "maxPlayersInGame", { min: null, max: null, val: null });
      if (maxPlayersInGame && maxPlayersInGame.toString().includes("-")) {
        const [min, max] = maxPlayersInGame
          .toString()
          .split("-")
          .map((num) => parseInt(num));
        this.$set(this, "maxPlayersInGame", { min, max, val: max });
      }
    },
    updateGameTimer(timeShift) {
      this.gameTimer += timeShift;
      if (this.gameTimer > 120) this.gameTimer = 120;
      if (this.gameTimer < 15) this.gameTimer = 15;
    },
    updateGameRoundLimit(countShift) {
      this.gameRoundLimit += countShift;
      if (this.gameRoundLimit > 100) this.gameRoundLimit = 100;
      if (this.gameRoundLimit < 1) this.gameRoundLimit = 1;
    },
    updateTeamsCount(countShift) {
      const { max, min } = this.teamsCount;
      this.teamsCount.val += countShift;
      if (this.teamsCount.val > max) this.teamsCount.val = max;
      if (this.teamsCount.val < min) this.teamsCount.val = min;
    },
    updatePlayerCount(countShift) {
      const { max, min } = this.playerCount;
      this.playerCount.val += countShift;
      if (this.playerCount.val > max) this.playerCount.val = max;
      if (this.playerCount.val < min) this.playerCount.val = min;
    },
    updateMaxPlayersInGame(countShift) {
      const { max, min } = this.maxPlayersInGame;
      this.maxPlayersInGame.val += countShift;
      if (this.maxPlayersInGame.val > max) this.maxPlayersInGame.val = max;
      if (this.maxPlayersInGame.val < min) this.maxPlayersInGame.val = min;
    },
    async handleAddGame(data) {
      if (!data) {
        const {
          deckType,
          gameType,
          gameConfig,
          gameTimer,
          teamsCount,
          playerCount,
          maxPlayersInGame,
          gameRoundLimit,
          difficulty,
        } = this;
        data = {
          deckType,
          gameType,
          gameConfig,
          gameTimer,
          teamsCount,
          playerCount,
          maxPlayersInGame,
          gameRoundLimit,
          difficulty,
        };
      }

      // Если передана кастомная функция, используем её
      if (this.addGameHandler) {
        return await this.addGameHandler(data);
      }

      await api.action
        .call({
          path: "user.api.update",
          args: [{ lobbyGameConfigs: { active: data } }],
        })
        .catch(prettyAlert);

      await api.action
        .call({
          path: "game.api.new",
          args: [data],
        })
        .catch(prettyAlert);
    },
    async joinGame({ gameId, viewerMode, teamId }) {
      // игровой сервер мог отключиться
      const { isAlive } = await api.action
        .call({ path: "lobby.api.checkGame", args: [{ gameId }] })
        .catch(prettyAlert);
      if (!isAlive) return;

      // window.iframeEvents.push({
      //   data: {
      //     args: [{ gameId, viewerMode, teamId }],
      //   },
      //   event: ({ args }) => {
      //     const $iframe = document.querySelector('#gameIframe');
      //     $iframe.contentWindow.postMessage({ path: 'game.api.join', args }, '*');
      //   },
      // });
    },
    showTeam(gameId) {
      this.$set(this.showTeams, gameId, !this.showTeams[gameId]);
    },
    updateDifficulty(event) {
      this.difficulty = event.target.value;
    },
  },
  async created() {
    this.state.emit.addGame = (data) => {
      this.handleAddGame(data);
    };
    this.state.emit.joinGame = (data) => {
      const { deckType, gameType, gameId } = data;
      app.$router.push({ path: `/game/${deckType}/${gameType}/${gameId}` });
    };
    this.state.emit.leaveGame = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      app.$router.push({ path: `/` });
    };
  },
  async mounted() {
    this.prepareGameConfigs();
  },
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss" scoped>
@import "@/mixins.scss";

.games {
  overflow: hidden !important;

  .new-game-controls {
    @media only screen and (max-width: 360px) {
      font-size: 9px;
    }

    .breadcrumbs {
      text-align: center;
      padding: 10px 4px;

      .select-btn:not(.active) {
        border: none;
        cursor: default !important;

        &:hover {
          opacity: 1 !important;
        }
      }

      .select-btn.active {
        &:not(.disabled):not(.preselected):hover {
          background: transparent;
          color: white;

          &::after {
            color: white;
          }
        }
      }
    }

    .release-game {
      @include flex($wrap: wrap);
    }

    .game-types {
      @include flex();
      padding: 0px 10px;

      .select-btn {
        text-align: center;
        text-transform: uppercase;

        svg {
          width: 10px;
          margin-right: 4px;
        }

        .title {
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
      }
    }

    .game-block {
      display: flex;
      justify-content: space-around;

      .select-btn {
        text-align: center;
      }
    }

    .game-config-block {
      @include flex();
      padding: 0px 10px;

      .select-btn {
        text-align: center;

        &.disabled {
          border: 2px solid #ccc;
          background-color: #ccc;
          cursor: default;
        }
      }
    }

    .game-start-block {
      @include flex($wrap: wrap);
      max-width: 80%;
      padding: 0px 10px;
      margin: auto;

      .select-btn {
        text-align: center;
        max-width: 100px;

        &:hover {
          background: transparent;
          color: white;
        }
      }

      .controls {
        color: #f4e205;
        font-size: 16px;

        svg {
          cursor: pointer;
          border-radius: 50%;
          padding: 0px 2px;
          color: black;
          background: #f4e205;
          border: 2px solid #f4e205;
          font-size: 10px;

          &:hover {
            background: transparent;
            color: #f4e205;
            font-size: 8px;
            padding: 1px 2.8px;
            // border-width: 3px;
          }
        }

        &.tutorial-active {
          box-shadow: none;

          > svg {
            box-shadow: 0 0 10px 10px #f4e205;
          }
        }
      }

      .label {
        margin: 0px 10px 0px 4px;
      }

      .flex-block {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        white-space: nowrap;

        &.wrap {
          flex-wrap: wrap;
        }
      }
    }

    .select-btn {
      width: 40%;
      text-align: left;
      border: 2px solid #f4e205;
      color: white;
      background-color: transparent;
      padding: 4px 10px;
      margin: 4px;
      border-radius: 4px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      cursor: pointer;

      &:not(.disabled):not(.preselected):hover {
        background: transparent;
        color: white;
      }

      @media only screen and (max-width: 360px) {
        padding: 4px 4px;
      }

      svg {
        width: 40px;

        @media only screen and (max-width: 360px) {
          width: 30px;
        }
      }

      &.active {
        background: #f4e205;
        color: black;

        svg {
          color: black !important;
        }
      }

      &.selected {
        &:not(.preselected):after {
          content: "X";
          color: black;
          padding: 0px 2px;
          font-weight: bold;
        }
      }
      &.preselected {
        cursor: default !important;
      }

      &.disabled {
        border: 2px solid #ccc;
        background-color: #ccc;
        cursor: default;
      }

      &.wait-for-select:not(.disabled):hover {
        // opacity: 0.7;
        background-color: #f4e205;
        color: black;
      }

      &.tutorial-active {
        box-shadow: 0px 0px 20px 5px white;
      }
    }

    .select-input {
      width: 150px;
      color: #f4e205;
      background: black;
      border: 1px solid #f4e205;
      text-align: center;
      margin: 8px;
      cursor: pointer;
    }
  }

  hr {
    margin: 10px 30px;
    border-color: #f4e205;
  }

  .game-list-container {
    height: calc(100% - 100px);

    .game-list {
      height: 100%;
    }

    .tutorial-games {
      display: none;

      &.tutorial-active {
        display: block;
      }
    }

    &.big-config {
      .game-list-container {
        height: calc(100% - 120px);
      }
    }
  }
}
</style>
