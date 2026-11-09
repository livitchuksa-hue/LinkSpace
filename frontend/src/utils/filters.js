import { tagKey, parseTags } from './tags';

export const OBJECT_TYPES = ['NOTE', 'FILE', 'FOLDER', 'LINK'];

export const DATE_FIELDS = [
  { value: 'createdAt', label: 'Создан' },
  { value: 'updatedAt', label: 'Изменён' },
  { value: 'lastOpenedAt', label: 'Открыт' },
];

export function createDefaultFilter() {
  return {
    types: [],
    tags: [],
    disks: [],
    dateField: 'updatedAt',
    dateFrom: '',
    dateTo: '',
  };
}

function normalizeFilter(value) {
  const fallback = createDefaultFilter();
  if (!value || typeof value !== 'object') return fallback;
  let types = Array.isArray(value.types)
    ? value.types.filter((type) => OBJECT_TYPES.includes(type))
    : [];
  if (types.length === OBJECT_TYPES.length) types = [];
  return {
    types,
    tags: Array.isArray(value.tags)
      ? value.tags.map((tag) => String(tag).toLowerCase()).filter(Boolean)
      : [],
    disks: Array.isArray(value.disks)
      ? value.disks.map((disk) => String(disk).trim()).filter(Boolean)
      : [],
    dateField: DATE_FIELDS.some((field) => field.value === value.dateField)
      ? value.dateField
      : fallback.dateField,
    dateFrom: typeof value.dateFrom === 'string' ? value.dateFrom.slice(0, 10) : '',
    dateTo: typeof value.dateTo === 'string' ? value.dateTo.slice(0, 10) : '',
  };
}

/** Фильтр по типам активен, когда выбрана часть типов (пусто или все = без ограничений). */
function typeFilterActive(filter) {
  const types = filter?.types || [];
  return types.length > 0 && types.length < OBJECT_TYPES.length;
}

/** Активен ли фильтр вообще (есть хоть одно реальное ограничение). */
export function filterActive(filter) {
  if (!filter) return false;
  if (typeFilterActive(filter)) return true;
  if (filter.tags.length) return true;
  if (filter.disks?.length) return true;
  if (filter.dateFrom || filter.dateTo) return true;
  return false;
}

/** Сколько групп критериев активно — для бейджа в UI. */
export function activeCriteriaCount(filter) {
  if (!filter) return 0;
  let count = 0;
  if (typeFilterActive(filter)) count += 1;
  if (filter.tags.length) count += 1;
  if (filter.disks?.length) count += 1;
  if (filter.dateFrom || filter.dateTo) count += 1;
  return count;
}

function objectDateValue(object, field) {
  const value = object?.[field];
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

/**
 * Подходит ли объект под фильтр.
 * Критерии внутри групп — ИЛИ (теги), между группами — И.
 */
export function objectMatchesFilter(object, filter) {
  if (!filterActive(filter)) return true;
  if (!object) return false;

  const types = filter.types || [];
  if (types.length > 0 && types.length < OBJECT_TYPES.length && !types.includes(object.type)) {
    return false;
  }

  if (filter.tags.length) {
    const keys = new Set(parseTags(object.tags).map((tag) => tagKey(tag?.name)));
    if (!filter.tags.some((tag) => keys.has(tag))) return false;
  }

  if (filter.disks?.length && !filter.disks.includes(object.disk)) {
    return false;
  }

  if (filter.dateFrom || filter.dateTo) {
    const date = objectDateValue(object, filter.dateField);
    if (!date) return false;
    if (filter.dateFrom && date < filter.dateFrom) return false;
    if (filter.dateTo && date > filter.dateTo) return false;
  }

  return true;
}

export { normalizeFilter };
