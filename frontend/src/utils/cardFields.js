import { uiStore } from '../stores/uiStore';

const DATE_KEYS = ['createdDate', 'updatedDate', 'openedDate'];

/**
 * Эффективные поля карточки: персональный override объекта,
 * если он задан, иначе глобальные настройки graphFields.
 */
export function cardFieldsFor(objectId) {
  return uiStore.cardFieldOverrides[objectId] || uiStore.graphFields;
}

export function cardFieldChecked(objectId, key) {
  const fields = cardFieldsFor(objectId);
  if (key === 'dates') {
    return DATE_KEYS.every((dateKey) => fields[dateKey]);
  }
  return Boolean(fields[key]);
}

export function setCardField(objectId, key, value) {
  const fields = { ...cardFieldsFor(objectId) };
  if (key === 'dates') {
    DATE_KEYS.forEach((dateKey) => { fields[dateKey] = value; });
  } else {
    fields[key] = value;
  }
  uiStore.cardFieldOverrides = {
    ...uiStore.cardFieldOverrides,
    [objectId]: fields,
  };
}

export function toggleCardField(objectId, key) {
  setCardField(objectId, key, !cardFieldChecked(objectId, key));
}
