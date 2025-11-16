<template>
  <perfect-scrollbar>
    <div class="rules">
      <ul v-if="lobby.gameServers">
        <li class="disabled">
          <label class="not-disabled">Игра "Релиз"</label>
          <div>Игра про ИТ-разработку</div>
          <ul>
            <li>
              <label>
                <a :href="lobby.gameServers.release?.serverUrl + '/rules/deck.pdf'" target="_blank"> Правила игры </a>
              </label>
              <hr />
              <span class="gallery" v-on:click="showGallery('release')">Список карт</span>
            </li>
          </ul>
        </li>
        <li class="disabled">
          <label class="not-disabled">Автобизнес</label>
          <div>Колода для игр про продажи автомобилей</div>
          <ul v-if="lobby.gameServers.auto?.serverUrl">
            <li>
              <label>
                <a :href="lobby.gameServers.auto?.serverUrl + '/rules/deck.pdf'" target="_blank"> Описание колоды </a>
              </label>
              <hr />
              <span
                v-for="(item, index) in [
                  { type: 'car', text: 'Карты авто' },
                  { type: 'service', text: 'Карты сервисов' },
                  { type: 'client', text: 'Карты клиентов' },
                  { type: 'feature', text: 'Карты особенностей' },
                  { type: 'credit', text: 'Карты кредитов' },
                ]"
                :key="index"
                class="gallery"
                v-on:click="showGallery('auto', item.type)"
                >{{ item.text }}</span
              ><br />
            </li>
            <li>
              <label>
                <a :href="lobby.gameServers.auto?.serverUrl + '/rules/sales.pdf'" target="_blank">
                  Игра "Авто-продажи"
                </a>
              </label>
            </li>
            <li>
              <label>
                <a :href="lobby.gameServers.auto?.serverUrl + '/rules/auction.pdf'" target="_blank">
                  Игра "Авто-аукцион"
                </a>
              </label>
            </li>
            <li>
              <label>
                <a :href="lobby.gameServers.auto?.serverUrl + '/rules/express.pdf'" target="_blank">
                  Игра "Авто-экспресс"
                </a>
              </label>
            </li>
          </ul>
        </li>
        <li class="disabled">
          <label class="not-disabled">Банкинг</label>
          <div>Колода для игр про работу в банках</div>
          <ul>
            <li>
              <label>
                <a :href="state.serverOrigin + '/pdf/rules/bank-deck.pdf'" target="_blank"> Правила игры </a>
              </label>

              <hr />
              <span
                v-for="(item, index) in [
                  { type: 'product', text: 'Карты продуктов' },
                  { type: 'service', text: 'Карты сервисов' },
                  { type: 'scoring', text: 'Карты скоринга' },
                  { type: 'client', text: 'Карты клиентов' },
                  { type: 'feature', text: 'Карты особенностей' },
                ]"
                :key="index"
                class="gallery"
                v-on:click="showGallery('bank', item.type)"
                >{{ item.text }}</span
              ><br />
            </li>
            <li>
              <label>
                <a :href="state.serverOrigin + '/pdf/rules/bank-sales.pdf'" target="_blank"> Игра "Банк-продаж" </a>
              </label>
            </li>
            <li>
              <label>
                <a :href="state.serverOrigin + '/pdf/rules/bank-risks.pdf'" target="_blank"> Игра "Банк-рисков" </a>
              </label>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </perfect-scrollbar>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import { FILTER_CONFIGS } from './gallery-filters-config.mjs';

export default {
  inject: ['updateGallery'],
  components: {
    PerfectScrollbar,
  },
  props: {},
  data() {
    return {};
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
  },
  methods: {
    // Получение конфигурации фильтров
    getFilterConfig(deck, group) {
      const key = group ? `${deck}.${group}` : deck;
      return FILTER_CONFIGS[key] || { filters: [] };
    },

    async showGallery(deck, group) {
      const { serverUrl: serverOrigin } = this.lobby.gameServers[deck] || {};

      const method = 'POST';
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ path: 'game.api.cards', args: [{ selectGroup: group }] });
      const images = await fetch(serverOrigin + '/api/action/public', { method, headers, body }).then((res) =>
        res.text().then((packet) => {
          const {
            result: { cards },
          } = JSON.parse(packet);
          return cards;
        })
      );

      // Получаем конфигурацию фильтров для данного deck.group
      const filterConfig = this.getFilterConfig(deck, group);
      
      this.updateGallery(images, serverOrigin, filterConfig);
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style scoped lang="scss">
.rules {
  label {
    > a:after {
      position: absolute;
      content: '';
      width: 16px;
      height: 16px;
      background-color: white;
      mask-image: url(@/assets/download.png);
      mask-size: 16px;
      -webkit-mask-image: url(@/assets/download.png);
      -webkit-mask-size: 16px;
      background-size: 16px;
      margin-left: 6px;
      background-repeat: no-repeat;
      margin-top: 8px;

      visibility: hidden;
    }

    &:hover {
      a::after {
        visibility: visible;
      }
    }
  }

  .gallery {
    display: block;

    &:after {
      position: absolute;
      content: '';
      width: 16px;
      height: 16px;
      background-color: white;
      mask-image: url(@/assets/gallery.png);
      mask-size: 16px;
      -webkit-mask-image: url(@/assets/gallery.png);
      -webkit-mask-size: 16px;
      background-size: 16px;
      margin-left: 4px;
      background-repeat: no-repeat;
      margin-top: 4px;

      visibility: hidden;
    }

    &:hover {
      &:after {
        visibility: visible;
      }
    }
  }
}
</style>
