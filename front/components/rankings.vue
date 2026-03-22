<template>
  <perfect-scrollbar ref="scrollRankings">
    <div class="rankings">
      <div v-if="!menuOpened" class="title">
        <div>{{ this.activeRating?.title }}</div>
        <div v-on:click="menuOpened = true" class="close" />
      </div>
      <div v-if="menuOpened" class="menu">
        Выбор рейтинга:
        <ul>
          <li v-for="ranking in rankingList" :key="ranking.code">
            <span
              class="toggle-ranking"
              v-on:click="
                menuOpened = false;
                activeRating = {
                  title: ranking.title,
                  headers: ranking.headers,
                  list: getUsersRankings(ranking),
                };
              "
              >{{ ranking.title }}</span
            >
          </li>
        </ul>
      </div>
      <div v-if="!menuOpened" class="content">
        <perfect-scrollbar>
          <table v-if="activeRating">
            <tr>
              <th v-for="header in activeRatingHeaders" :key="header.code" :code="header.code">
                {{ header.title }}
              </th>
            </tr>
            <tr
              v-for="(item, idx) in activeRating.list"
              :key="idx"
              :class="[item.iam ? 'iam' : '', item.noGames ? 'no-games' : '']"
            >
              <td v-for="header in activeRatingHeaders" :key="header.code + idx" :code="header.code">
                {{ header.format ? formatValue(item[header.code], header.format) : item[header.code] }}
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
    rankings: Object,
  },
  data() {
    return {
      menuOpened: true,
      activeRating: null,
    };
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    lobby() {
      return this.$root.state.store.lobby[this.state.currentLobby];
    },
    rankingList() {
      return Object.entries(this.rankings || {}).map(([code, ranking]) => ({ ...ranking, code }));
    },
    activeRatingHeaders() {
      return [{ code: 'idx' }, { code: 'player' }].concat(this.activeRating?.headers || []);
    },
  },
  methods: {
    getUsersRankings({ code, usersTop = [] }) {
      const gameCode = this.lobby.__gameServerConfig.code;

      const lobbyUsers = this.lobby.users || {};
      const result = usersTop.map((userId, idx) => ({
        idx: idx + 1,
        ...(lobbyUsers[userId]?.rankings[gameCode] || {}),
        player: lobbyUsers[userId]?.name || 'имя не указано',
        iam: userId === this.state.currentUser,
      }));

      if (result.filter((user) => user.iam).length === 0) {
        const user = lobbyUsers[this.state.currentUser] || {};

        result.push({ player: '...' });

        const iamItem = user.rankings?.[gameCode] ? { ...user.rankings[gameCode] } : { noGames: true };
        result.push({ ...iamItem, idx: '-', iam: true, player: user.name || 'игрок (имя не указано)' });
      }
      return result;
    },
    formatValue(value, format) {
      if (format === 'money') return value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
      return value;
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss">
.rankings {
  overflow: hidden !important;

  .tutorial-active {
    box-shadow: 0px 0px 20px 5px white;
  }

  > * {
    height: 100%;

    &.title {
      position: absolute;
      display: flex;
      justify-content: center;
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
        position: relative;
        width: 14px;
        height: 14px;
        background-size: 14px;
        margin-left: 4px;
        background-image: url(@/assets/close.png);
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

        &.no-games > td[code='player'] {
          position: relative;

          &:after {
            content: 'не сыграно ни одной игры';
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
