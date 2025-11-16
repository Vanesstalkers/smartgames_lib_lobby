<template>
  <div v-if="galleryVisible" ref="viewerContainer">
    <img v-for="(image, index) in galleryImages" :key="index" :src="image" :data-src="image" style="display: none" />
  </div>
</template>

<script>
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

export default {
  name: 'Gallery',
  props: {
    images: {
      type: Array,
      default: () => []
    },
    serverOrigin: {
      type: String,
      default: ''
    },
    filterConfig: {
      type: Object,
      default: () => ({ filters: [] })
    }
  },
  data() {
    return {
      galleryImages: [],
      galleryOriginalImages: [], // Оригинальные данные с сервера
      galleryVisible: false,
      viewerInstance: null,
      filterValues: {}, // Значения всех фильтров
      activeFilters: [], // Активные фильтры для текущего deck/group
      viewerOptions: {
        inline: false,
        // button: true,
        navbar: true,
        title: false,
        toolbar: {
          zoomIn: false,
          zoomOut: false,
          oneToOne: false,
          reset: false,
          prev: true,
          play: false,
          next: true,
          rotateLeft: false,
          rotateRight: false,
          flipHorizontal: false,
          flipVertical: false,
        },
        tooltip: false,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: true,
        transition: true,
        keyboard: true,
        backdrop: true,
        loop: false,
        zIndex: 10001,
        // Touch-события для navbar
        touch: true,
        swipe: true, // Включает swipe-жесты
        slideOnTouch: true, // Позволяет переключать изображения свайпом
        // Дополнительные настройки для мобильных устройств
        toggleOnDblclick: false,
      },
    };
  },
  watch: {
    images: {
      handler(newImages) {
        if (newImages && newImages.length > 0) {
          this.showGallery();
        }
      },
      immediate: true
    }
  },
  methods: {
    showGallery() {
      // Используем переданную конфигурацию фильтров
      this.activeFilters = this.filterConfig.filters || [];
      
      // Инициализируем значения фильтров
      this.filterValues = {};
      this.activeFilters.forEach(filter => {
        this.filterValues[filter.type] = '';
      });

      // Сохраняем оригинальные данные с сервера
      this.galleryOriginalImages = this.images.map((img) => ({
        url: `${this.serverOrigin}/img/cards/${typeof img === 'string' ? img : img.path}`,
        // Копируем все свойства оригинального объекта
        ...img,
        originalData: img,
      }));

      // Применяем фильтры
      this.applyCurrentFilters();

      // Показываем галерею
      this.galleryVisible = true;

      // Ждем рендеринга и инициализируем viewer
      this.$nextTick(() => {
        this.initViewer();
      });
    },

    // Обновление фильтров с переинициализацией viewer
    updateFiltersAndReinit() {
      this.applyCurrentFilters();
      this.$nextTick(() => {
        this.initViewer();
      });
    },

    // Применение всех активных фильтров
    applyCurrentFilters() {
      const filteredImages = this.applyFilters(this.galleryOriginalImages, this.activeFilters, this.filterValues);
      this.galleryImages = filteredImages.map((img) => img.url).reverse();
    },

    initViewer() {
      if (this.$refs.viewerContainer) {
        // Уничтожаем предыдущий viewer если есть
        if (this.viewerInstance) {
          this.viewerInstance.destroy();
        }

        // Создаем новый viewer
        this.viewerInstance = new Viewer(this.$refs.viewerContainer, this.viewerOptions);

        // Добавляем кастомный input в toolbar после инициализации
        this.$nextTick(() => {
          this.addCustomToolbarInput();
        });

        this.viewerInstance.show();
      }
    },

    addCustomToolbarInput() {
      if (!this.viewerInstance || !this.activeFilters.length) return;

      // Находим toolbar
      const toolbar = document.querySelector('.viewer-toolbar');
      if (!toolbar) return;

      // Удаляем предыдущие фильтры если есть
      const existingInputs = toolbar.querySelector('.custom-filters-container');
      if (existingInputs) {
        existingInputs.remove();
      }

      // Создаем контейнер для всех фильтров
      const filtersContainer = document.createElement('div');
      filtersContainer.className = 'custom-filters-container';
      filtersContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        margin: auto;
        margin-bottom: 20px;
        flex-wrap: wrap;
        justify-content: center;
      `;

      // Создаем фильтры на основе конфигурации
      this.activeFilters.forEach(filterConfig => {
        const filterElement = this.createDynamicFilter(filterConfig);
        if (filterElement) {
          filtersContainer.appendChild(filterElement);
        }
      });

      // Добавляем контейнер в начало toolbar (выше кнопок)
      toolbar.insertBefore(filtersContainer, toolbar.firstChild);
    },

    // Универсальный метод создания фильтра
    createDynamicFilter(filterConfig) {
      if (filterConfig.inputType === 'select') {
        return this.createSelectFilter(filterConfig);
      } else if (filterConfig.inputType === 'number') {
        return this.createNumberFilter(filterConfig);
      }
      return null;
    },

    // Создание числового фильтра
    createNumberFilter(filterConfig) {
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      const input = document.createElement('input');
      input.type = 'number';
      input.placeholder = filterConfig.label;
      input.value = this.filterValues[filterConfig.type] || '';
      input.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 12px;
        text-align: center;
        color: #333;
        width: ${filterConfig.width};
      `;

      input.addEventListener('input', (e) => {
        this.filterValues[filterConfig.type] = e.target.value;
        // Проверяем minLength для числовых полей
        if (!filterConfig.minLength || e.target.value.length >= filterConfig.minLength || e.target.value === '') {
          this.updateFiltersAndReinit();
        }
      });

      input.addEventListener('focus', () => {
        input.style.background = 'rgba(255, 255, 255, 1)';
        input.style.boxShadow = '0 0 0 2px #007bff';
      });

      input.addEventListener('blur', () => {
        input.style.background = 'rgba(255, 255, 255, 0.9)';
        input.style.boxShadow = 'none';
      });

      container.appendChild(input);
      return container;
    },

    // Создание select фильтра
    createSelectFilter(filterConfig) {
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      const select = document.createElement('select');
      select.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 12px;
        color: #333;
        width: ${filterConfig.width};
      `;

      // Добавляем опции
      filterConfig.options.forEach((option) => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        optionElement.style.color = option.color;
        if (this.filterValues[filterConfig.type] === option.value) {
          optionElement.selected = true;
        }
        select.appendChild(optionElement);
      });

      select.addEventListener('change', (e) => {
        this.filterValues[filterConfig.type] = e.target.value;
        this.updateFiltersAndReinit();

        // Меняем цвет select в зависимости от выбранной опции
        const selectedOption = filterConfig.options.find((o) => o.value === e.target.value);
        if (selectedOption) {
          select.style.color = selectedOption.color;
          select.style.fontWeight = selectedOption.value ? 'bold' : 'normal';
        }
      });

      select.addEventListener('focus', () => {
        select.style.background = 'rgba(255, 255, 255, 1)';
        select.style.boxShadow = '0 0 0 2px #007bff';
      });

      select.addEventListener('blur', () => {
        select.style.background = 'rgba(255, 255, 255, 0.9)';
        select.style.boxShadow = 'none';
      });

      container.appendChild(select);
      return container;
    },


    closeGallery() {
      if (this.viewerInstance) {
        this.viewerInstance.destroy();
        this.viewerInstance = null;
      }
      this.galleryVisible = false;
      this.galleryImages = [];
      this.galleryOriginalImages = [];
      this.filterValues = {};
      this.activeFilters = [];
      
      // Уведомляем родительский компонент о закрытии
      this.$emit('gallery-closed');
    },


    // Функция для применения всех фильтров
    applyFilters(items, filters, filterValues) {
      let filteredItems = [...items];
      
      filters.forEach(filterConfig => {
        const value = filterValues[filterConfig.type];
        if (value && value !== '') {
          // Проверяем minLength для числовых полей
          if (filterConfig.inputType === 'number' && filterConfig.minLength) {
            if (value.toString().length < filterConfig.minLength) {
              return; // Пропускаем фильтрацию если не достигнута минимальная длина
            }
          }
          
          filteredItems = filterConfig.filterFunction(filteredItems, value);
        }
      });
      
      return filteredItems;
    }
  },
  beforeDestroy() {
    // Очищаем viewer при уничтожении компонента
    if (this.viewerInstance) {
      this.viewerInstance.destroy();
      this.viewerInstance = null;
    }
  },
};
</script>

<style lang="scss">
/* Стили для галереи */
.gallery-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.9);
}

/* Стили для v-viewer */
.viewer-container {
  z-index: 10001 !important;
}

/* Стили для кастомного input в toolbar */
.custom-price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 10px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toolbar-price-input {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  width: 80px;
  text-align: center;
  color: #333;
}

.toolbar-price-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 2px #007bff;
}

.toolbar-counter {
  color: white;
  font-size: 11px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Простое исправление - убираем aria-hidden с toolbar */
.viewer-toolbar {
  pointer-events: auto;
}

.custom-price-filter {
  pointer-events: auto;
}

/* Настраиваем размер кнопок навигации в галерее */
.viewer-toolbar .viewer-button {
  width: 80px !important;
  height: 80px !important;
  font-size: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
}

.viewer-toolbar .viewer-prev,
.viewer-toolbar .viewer-next {
  width: 80px !important;
  height: 80px !important;
  font-size: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
}
</style>
