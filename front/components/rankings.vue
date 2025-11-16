<template>
  <perfect-scrollbar ref="scrollRankings">
    <div class="rankings">
      <div v-if="!menuOpened" class="title">
        <div v-on:click="menuOpened = true" class="close" />
        <div>{{ activeRatingTitle }}</div>
      </div>
      <div v-if="menuOpened" class="menu">
        Выбор рейтинга:
        <div v-for="game in gameList" :key="game.title" class="menu-game-item">
          <h4 class="toggle-game" v-on:click="
            toggleMenuGameItem({
              gameCode: game.code,
              event: $event,
            })
            ">
            <span>Игра "{{ game.title }}"</span>
          </h4>
          <ul v-if="menuGameItems[game.code]?.open">
            <li v-for="ranking in game.rankingList" :key="ranking.title">
              <span class="toggle-ranking" v-on:click="
                menuOpened = false;
              activeRating = {
                title: `${ranking.title} (Игра &quot;${game.title}&quot;)`,
                headers: ranking.headers,
                list: getUsersRankings({ gameType: game.code, usersList: ranking.usersTop }),
              };
              ">{{ ranking.title }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="!menuOpened" class="content">
        <perfect-scrollbar>
          <table v-if="activeRating">
            <tr>
              <th v-for="header in activeRatingHeaders" :key="header.code" :code="header.code">
                {{ header.title }}
              </th>
            </tr>
            <tr v-for="(item, idx) in activeRating.list" :key="idx"
              :class="[item.iam ? 'iam' : '', item.noGames ? 'no-games' : '']">
              <td v-for="header in activeRatingHeaders" :key="header.code + idx" :code="header.code">
                {{ item[header.code] }}
              </td>
            </tr>
          </table>
        </perfect-scrollbar>
      </div>
    </div>
  </perfect-scrollbar>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';

export default {
  components: {
    PerfectScrollbar,
  },
  props: {
    games: Object,
  },
  data() {
    return {
      menuGameItems: {},
      menuOpened: true,
      activeRating: null,
    };
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    gameList() {
      return Object.entries(this.games || {}).map(([code, game]) => ({
        ...game,
        code,
        rankingList: Object.entries(game.rankingMap).map(([code, ranking]) => ({ ...ranking, code })),
      }));
    },
    activeRatingTitle() {
      return this.activeRating?.title || 'Выберите рейтинг, который хотели бы посмотреть';
    },
    activeRatingHeaders() {
      return [{ code: 'idx' }, { code: 'player' }].concat(this.activeRating?.headers || []);
    },
  },
  methods: {
    toggleMenuGameItem({ gameCode, event }) {
      if (!this.menuGameItems[gameCode]) this.$set(this.menuGameItems, gameCode, {});
      const state = !this.menuGameItems[gameCode]?.open;
      this.$set(this.menuGameItems[gameCode], 'open', state);
      if (state === true) {
        this.$nextTick(() => {
          const game = event.target.closest('.menu-game-item');
          const scrollTo = game.offsetTop + game.clientHeight;
          if (this.$refs.scrollRankings.$el.scrollTop < scrollTo) this.$refs.scrollRankings.$el.scrollTop = scrollTo;
        });
      }
    },
    getUsersRankings({ gameType, usersList = [] }) {
      const lobbyUsers = this.$root.state.store.lobby[this.state.currentLobby].users || {};
      const result = usersList.map((userId, idx) => ({
        idx: idx + 1,
        ...(lobbyUsers[userId]?.rankings?.[gameType] || {}),
        player: lobbyUsers[userId]?.name || 'имя не указано',
        iam: userId === this.state.currentUser,
      }));
      if (result.filter((user) => user.iam).length === 0) {
        const userId = this.state.currentUser;
        const user = lobbyUsers[userId] || {};
        result.push({ player: '...' });
        const iamItem = user.rankings?.[gameType]
          ? { ...user.rankings[gameType] }
          : { noGames: true };
        iamItem.idx = '-';
        iamItem.iam = true;
        iamItem.player = user.name || 'игрок (имя не указано)';
        result.push(iamItem);
      }
      return result;
    },
  },
  async created() { },
  async mounted() { },
  async beforeDestroy() { },
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss">
.rankings {
  overflow: hidden !important;

  .tutorial-active {
    box-shadow: 0px 0px 20px 5px white;
  }

  >* {
    height: 100%;

    &.title {
      position: absolute;
      left: 0px;
      top: 0px;
      height: auto;
      width: 100%;
      color: #f4e205;
      font-weight: bold;
      white-space: pre-wrap;
      text-align: center;
      padding: 8px 0px;

      .close {
        position: absolute;
        left: 10px;
        top: 10px;
        width: 18px;
        height: 18px;
        background-size: 18px;
        background-image: url(@/assets/back.png);
        border-radius: 50%;
        cursor: pointer;

        &:hover {
          opacity: 0.7;
        }
      }
    }

    &.menu {
      width: 100%;
      left: 0px;
      top: 0px;
      text-align: left;
      padding: 6px 20px;
      z-index: 1;

      h4 {
        cursor: pointer;
        color: #f4e205;

        &:hover {
          color: white;
        }
      }

      ul {
        text-align: left;
        list-style-type: square;

        li {
          cursor: pointer;

          &:hover {
            color: #f4e205;
          }
        }
      }
    }
  }

  .content {
    width: calc(100% - 20px);
    height: calc(100% - 30px);
    margin: 4px 10px;
    margin-top: 30px;

    table {
      min-width: 400px;
      margin-bottom: 10px;

      th {
        white-space: nowrap;
        font-size: 10px;

        &[code='player'] {
          width: 100%;
        }
      }

      td[code='idx'] {
        white-space: nowrap;
      }

      tr.iam {
        color: #f4e205;
        font-weight: bold;

        &.no-games>td[code='player'] {
          position: relative;

          &:after {
            content: "не сыграно ни одной игры";
            position: absolute;
            left: 100%;
            white-space: nowrap;
            text-align: center;
            font-size: 10px;
            line-height: 13px;
            color: white;
          }
        }
      }
    }
  }
}
</style>
