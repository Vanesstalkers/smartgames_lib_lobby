<template>
  <perfect-scrollbar>
    <div class="rules">
      <ul v-if="rulesSections && rulesSections.length">
        <li v-for="(section, sectionIndex) in rulesSections" :key="sectionIndex" class="disabled">
          <label class="not-disabled">{{ section.title }}</label>
          <div>{{ section.description }}</div>

          <ul>
            <!-- Первый PDF + разделение на галерею (как в старом шаблоне) -->
            <li v-if="section.pdfLinks && section.pdfLinks.length">
              <label v-if="section.pdfLinks[0]">
                <a :href="serverOrigin + section.pdfLinks[0].path" target="_blank">{{ section.pdfLinks[0].label }}</a>
              </label>

              <hr v-if="section.galleries && section.galleries.length" />

              <span
                v-for="(galleryItem, galleryIndex) in section.galleries || []"
                :key="galleryIndex"
                class="gallery"
                v-on:click="showGallery(galleryItem.selectGroup)"
                >{{ galleryItem.label }}</span
              ><br v-if="section.galleries && section.galleries.length" />
            </li>

            <!-- Остальные PDF -->
            <li v-for="(pdfLink, pdfIndex) in (section.pdfLinks || []).slice(1)" :key="pdfIndex">
              <label>
                <a :href="serverOrigin + pdfLink.path" target="_blank">{{ pdfLink.label }}</a>
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
    return {
      rulesSections: [],
    };
  },
  watch: {
    serverOrigin: {
      immediate: true,
      handler(newServerOrigin) {
        if (!newServerOrigin) return;
        this.loadRulesSections();
      },
    },
  },
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
    serverOrigin() {
      return this.lobby.__gameServerConfig?.serverUrl || '';
    },
  },
  methods: {
    // Получение конфигурации фильтров
    getFilterConfig(deck, group) {
      const key = group ? `${deck}.${group}` : deck;
      return FILTER_CONFIGS[key] || { filters: [] };
    },
    // Подгружает структуру раздела правил с текущего игрового сервиса
    async loadRulesSections() {
      if (!this.serverOrigin) return;

      const { result } = await this.fetchActionPublic('game.api.getRules');
      this.rulesSections = result?.rules || [];
    },

    // Загружает карточки (галерею) по selectGroup и открывает viewer
    async showGallery(group) {
      if (!this.serverOrigin) return;

      const { result } = await this.fetchActionPublic({
        path: 'game.api.cards',
        args: [{ selectGroup: group ?? null }],
      });
      const images = result.cards;

      // Получаем конфигурацию фильтров для deck/group
      const filterConfig = this.getFilterConfig(this.lobby.__gameServerConfig?.code, group);
      this.updateGallery(images, filterConfig);
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
