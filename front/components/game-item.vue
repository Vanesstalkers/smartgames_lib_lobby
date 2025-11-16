<template>
  <div class="game-item">
    <div v-if="game.joinedPlayers" style="width: calc(100% - 200px)">
      <div class="game-config-info"
        :style="{ marginLeft: '-4px', paddingLeft: '6px', paddingRight: '6px', marginRight: '-24px' }">
        <span>
          <font-awesome-icon :icon="deckMap[game.deckType].icon" :style="{ marginRight: '2px' }" />
          <font-awesome-icon :icon="deckMap[game.deckType].games[game.gameType].icon" />
          {{ deckMap[game.deckType].games[game.gameType].items[game.gameConfig].title }}
        </span>
        <span>
          <font-awesome-icon :icon="['fas', 'stopwatch']" /> {{ game.gameTimer / 1000 }} сек
        </span>
      </div>
      <div :style="{ display: 'flex', alignItems: 'center' }">
        <button v-if="game.gameType === 'corporate'" :class="['show-teams', showTeams ? 'open' : '']"
          v-on:click="$emit('show-team')" />
        <span v-if="game.waitForPlayer && game.teams" :style="{ marginRight: '8px' }" class="teams-btn">Команд: {{
          game.teams.length }}</span>
        <span v-if="game.waitForPlayer && game.joinedPlayers">Игроков: {{ game.joinedPlayers }}</span>
        <span v-if="!game.waitForPlayer || game.round"> Идет {{ game.round }} раунд </span>
      </div>
    </div>
    <div :style="{ flexShrink: 0, alignSelf: 'flex-start' }">
      <button v-if="game.waitForPlayer || game.teams?.length > 0 || game.readyPlayers < game.maxPlayersInGame"
        class="lobby-btn join-btn"
        v-on:click="$emit('join', { gameId: game.id, deckType: game.deckType })">
        Присоединиться
      </button>
      <span v-if="game.joinedPlayers && (!game.waitForPlayer || game.round)" :style="{
        color: '#f4e205',
        display: 'block',
        margin: '4px'
      }">
        <button class="lobby-btn join-btn viewer"
          v-on:click="$emit('join', { gameId: game.id, deckType: game.deckType, viewerMode: true })">
          <font-awesome-icon :icon="['fas', 'eye']" />
          Посмотреть
        </button>
      </span>
    </div>
    <div v-if="showTeams" :style="{ width: '100%', fontSize: '12px' }">
      <div v-for="team in game.teams" :key="team.id" :style="{ display: 'flex', marginBottom: '6px' }">
        <button class="lobby-btn join-btn small-btn" :style="{
          border: 'none',
          marginRight: '8px',
          marginLeft: '24px',
          marginTop: '4px',
          marginBottom: '2px',
          padding: '2px 6px',
          height: '20px',
        }" v-on:click="$emit('join', { gameId: game.id, deckType: game.deckType, teamId: team.id })">
          Присоединиться
        </button>
        <span :style="{ paddingTop: '6px' }">{{ team.title }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'game-item',
  props: {
    game: {
      type: Object,
      required: true
    },
    deckMap: {
      type: Object,
      required: true
    },
    showTeams: {
      type: Boolean,
      default: false
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/mixins.scss';

.game-item {
  @include flex($justify: space-between, $wrap: wrap);
  margin: 4px auto;
  min-height: 30px;
  max-width: 400px;
  text-align: left;

  .game-config-info {
    color: #f4e205;
    display: flex;
    justify-content: space-between;

    >svg {
      margin-left: 0px 4px;
    }

    >span {
      text-wrap-mode: nowrap;
    }
  }

  .show-teams {
    cursor: pointer;
    width: 18px;
    height: 18px;
    margin-right: 4px;
    background-size: 14px;
    background-color: transparent;
    border: none;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url(@/assets/list.png);

    &.open:not(.tutorial-active) {
      background-image: url(@/assets/arrow_up.png);
    }

    &:hover {
      opacity: 0.7;
    }
  }
}

.mobile-view .game-item {
  justify-content: center;

  >* {
    margin: 4px 10px;
  }
}

@media only screen and (max-width: 360px) {
  .join-btn {
    font-size: 9px;
    padding: 4px;
  }
}

.join-btn.viewer {
  background: transparent;
  color: #f4e205;

  >svg {
    color: #f4e205;
  }
}
</style>