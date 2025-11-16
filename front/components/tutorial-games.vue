<template>
  <div>
    <game-item :game="{
      id: 'tutorial-game',
      deckType: 'corporate',
      gameType: 'corporate',
      gameConfig: 'default',
      gameTimer: 60000,
      joinedPlayers: 2,
      waitForPlayer: false,
      round: 1,
      teams: [
        { id: 'team1', title: 'Команда 1' },
        { id: 'team2', title: 'Команда 2' }
      ]
    }" :deck-map="{
      corporate: {
        icon: ['fas', 'building'],
        games: {
          corporate: {
            icon: ['fas', 'users'],
            items: {
              default: {
                title: 'Хакатон'
              }
            }
          }
        }
      }
    }" :show-teams="showTeams['tutorial-game']" @show-team="showTeam('tutorial-game')" @join="() => { }" />
    <game-item :game="{
      id: 'tutorial-game-classic',
      deckType: 'classic',
      gameType: 'classic',
      gameConfig: 'default',
      gameTimer: 45000,
      joinedPlayers: 3,
      waitForPlayer: true,
      round: null
    }" :deck-map="{
      classic: {
        icon: ['fas', 'microchip'],
        games: {
          classic: {
            icon: ['fas', 'user-group'],
            items: {
              default: {
                title: 'Стандарт'
              }
            }
          }
        }
      }
    }" :show-teams="showTeams['tutorial-game-classic']" @show-team="showTeam('tutorial-game-classic')"
      @join="() => { }" />
  </div>
</template>

<script>
import GameItem from './game-item.vue'

export default {
  name: 'tutorial-games',
  components: {
    GameItem
  },
  props: {
    showTeams: {
      type: Object,
      required: true
    }
  },
  methods: {
    showTeam(gameId) {
      this.$emit('show-team', gameId);
    }
  }
}
</script> 