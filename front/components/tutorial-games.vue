<template>
  <div>
    <game-item
      :game="{
        id: 'tutorial-game',
        gameCode: 'corporate',
        gameType: 'corporate',
        gameConfig: 'default',
        gameTimer: 120,
        joinedPlayers: 2,
        waitForPlayer: false,
        round: 1,
        teams: [
          { id: 'team1', title: 'Команда 1' },
          { id: 'team2', title: 'Команда 2' },
        ],
      }"
      :gamesMap="{
        corporate: {
          icon: ['fas', 'building'],
          games: {
            corporate: {
              icon: ['fas', 'users'],
              items: {
                default: {
                  title: 'Хакатон',
                },
              },
            },
          },
        },
      }"
      :show-teams="showTeams['tutorial-game']"
      @show-team="showTeam('tutorial-game')"
      @join="() => {}"
    />
    <game-item
      :game="{
        id: 'tutorial-game',
        gameCode: 'auto',
        gameType: 'duel',
        gameConfig: 'default',
        gameTimer: 30,
        joinedPlayers: 1,
        waitForPlayer: true,
        // round: 1,
      }"
      :gamesMap="{
        auto: {
          icon: ['fas', 'car'],
          games: {
            duel: {
              icon: ['fas', 'car'],
              items: {
                default: {
                  title: 'Дуэль',
                },
              },
            },
          },
        },
      }"
      @join="() => {}"
    />
    <game-item
      :game="{
        id: 'tutorial-game-ai',
        gameCode: 'auto',
        gameType: 'ai',
        gameConfig: 'default',
        gameTimer: 60,
        joinedPlayers: 1,
        waitForPlayer: false,
        round: 1,
      }"
      :gamesMap="{
        auto: {
          icon: ['fas', 'car'],
          games: {
            ai: {
              icon: ['fas', 'cash-register'],
              items: {
                default: {
                  title: 'Один игрок',
                },
              },
            },
          },
        },
      }"
      @join="() => {}"
    />
  </div>
</template>

<script>
import GameItem from './game-item.vue';

export default {
  name: 'tutorial-games',
  components: { GameItem },
  props: {
    showTeams: { type: Object, required: true },
    showTeam: { type: Function, required: true },
  },
};
</script>
