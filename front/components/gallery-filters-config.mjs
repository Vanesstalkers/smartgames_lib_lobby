// Конфигурация фильтров для разных типов deck и групп карт

export const FILTER_TYPES = {
  PRICE: 'price',
  STARS: 'stars',
  PRICE_GROUP: 'priceGroup',
  RARITY: 'rarity',
  CATEGORY: 'category',
  LEVEL: 'level',
  TYPE: 'type',
};

export const FILTER_CONFIGS = {
  // Конфигурация для автомобильных карт
  'auto.car': {
    filters: [
      {
        type: FILTER_TYPES.PRICE,
        label: 'Цена ≤ (4 цифры)',
        inputType: 'number',
        width: '130px',
        minLength: 4,
        filterFunction: (items, value) => {
          const filterPrice = parseFloat(value);
          return items.filter((img) => img.price <= filterPrice);
        },
      },
      {
        type: FILTER_TYPES.STARS,
        label: 'Звезды',
        inputType: 'select',
        width: '90px',
        options: [
          { value: '', text: '★ - все', color: '#000000' },
          { value: '1', text: '★', color: '#ffcc00' },
          { value: '2', text: '★★', color: '#ffcc00' },
          { value: '3', text: '★★★', color: '#ffcc00' },
          { value: '4', text: '★★★★', color: '#ffcc00' },
        ],
        filterFunction: (items, value) => {
          if (!value) return items;
          const filterStars = parseInt(value);
          return items.filter((img) => img.stars === filterStars);
        },
      },
      {
        type: FILTER_TYPES.PRICE_GROUP,
        label: 'Группы цен',
        inputType: 'select',
        width: '120px',
        options: [
          { value: '', text: 'Все группы', color: '#ffffff' },
          { value: 'suv', text: 'Внедорожники', color: '#00cc00' },
          { value: 'cheap', text: 'Дешевые', color: '#3399ff' },
          { value: 'family', text: 'Семейные', color: '#ff9900' },
          { value: 'woman', text: 'Женские', color: '#ff66ff' },
          { value: 'vip', text: 'VIP', color: '#6600ff' },
        ],
        filterFunction: (items, value) => {
          if (!value) return items;
          return items.filter((img) => img.priceGroup && img.priceGroup.includes(value));
        },
      },
    ],
  },

  // Конфигурация для банковских продуктов
  'bank.product': {
    filters: [
      {
        type: FILTER_TYPES.PRICE,
        label: 'Доходность ≤',
        inputType: 'number',
        width: '100px',
        minLength: 1,
        filterFunction: (items, value) => {
          if (!value) return items;
          const filterPrice = parseFloat(value);
          return items.filter((img) => (img.cost || img.price || 0) <= filterPrice);
        },
      },
      {
        type: FILTER_TYPES.STARS,
        label: 'Звезды',
        inputType: 'select',
        width: '90px',
        options: [
          { value: '', text: '★ - все', color: '#000000' },
          { value: '0', text: 'Без звезд', color: '#ffcc00' },
          { value: '1', text: '★', color: '#ffcc00' },
          { value: '2', text: '★★', color: '#ffcc00' },
        ],
        filterFunction: (items, value) => {
          if (!value) return items;
          const filterStars = parseInt(value);
          return items.filter((img) => (img.stars || 0) === filterStars);
        },
      },
      {
        type: FILTER_TYPES.CATEGORY,
        label: 'Категория',
        inputType: 'select',
        width: '120px',
        options: [
          { value: '', text: 'Все категории', color: '#ffffff' },
          { value: ['deposit'], text: 'Депозиты', color: '#28a745' },
          { value: ['credit', 'autocredit', 'mortgage'], text: 'Кредиты', color: '#dc3545' },
          { value: ['creditcard', 'bankcard'], text: 'Карты', color: '#007bff' },
          { value: ['safebox', 'exchange'], text: 'Операции', color: '#6f42c1' },
        ],
        filterFunction: (items, value) => {
          if (!value) return items;
          return items.filter((img) => value.includes(img.group));
        },
      },
    ],
  },
};
