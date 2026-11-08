# Архитектура Linkspace

## Обзор

Linkspace — локальное настольное приложение. Данные хранятся на компьютере пользователя; облачные сервисы на текущем этапе не используются.

Проект разделён на три независимые части:

1. **Frontend** — Vue 3 + Vite (Renderer Process)
2. **Electron** — оболочка рабочего стола (Main Process + Preload)
3. **Backend** — Java 21 + Spring Boot + SQLite

## Назначение слоёв

### Frontend

Отвечает за интерфейс пользователя:

- холст графа, узлы, связи и визуальные области;
- боковая панель и панель свойств;
- формы создания и редактирования объектов;
- HTTP-обращения к REST API backend.

Код находится в `frontend/src/`.

### Electron

Отвечает за интеграцию с операционной системой:

- создание окна приложения;
- безопасный Preload API;
- системные диалоги выбора файлов и папок;
- открытие локальных файлов и каталогов;
- (в будущем) управление жизненным циклом Java-сервера.

Код находится в `frontend/electron/`.

### Backend

Отвечает за данные и бизнес-логику:

- REST API;
- валидация входных данных;
- доступ к SQLite через `JdbcTemplate`;
- обработка ошибок.

Код находится в `backend/src/main/java/ru/linkspace/`.

## Схемы взаимодействия

### Данные приложения

```text
Vue Renderer  →  HTTP REST API  →  Spring Boot  →  SQLite
```

### Возможности ОС

```text
Vue Renderer  →  Preload API  →  Electron Main Process  →  ОС
```

Renderer не получает прямой доступ к Node.js (`nodeIntegration: false`, `contextIsolation: true`).

## Расположение основных компонентов

| Область | Путь |
|---------|------|
| Vue entry | `frontend/src/main.js`, `frontend/src/App.vue` |
| Layout | `frontend/src/components/layout/` |
| Graph UI | `frontend/src/components/graph/` |
| Stores | `frontend/src/stores/` |
| REST-клиент | `frontend/src/services/api.js` |
| Electron main | `frontend/electron/main.js` |
| Preload | `frontend/electron/preload.js` |
| IPC filesystem | `frontend/electron/ipc/filesystem.js` |
| Spring Boot entry | `backend/.../LinkspaceApplication.java` |
| Controllers | `backend/.../controller/` |
| SQL-схема | `backend/src/main/resources/schema.sql` |

## Хранение данных

### База данных

- СУБД: **SQLite**
- Файл в разработке: `backend/data/linkspace.db`
- Доступ: Spring JDBC / `JdbcTemplate` (без JPA/Hibernate)
- Схема создаётся при старте из `schema.sql`

### Позиции узлов на графе

Координаты узлов хранятся **в таблице `information_objects`** в полях `x` и `y`.

Причины выбора:

- у каждого объекта ровно одна позиция на основном холсте;
- не требуется join с отдельной таблицей позиций на первом этапе;
- упрощает CRUD и сериализацию ответа API.

Связи хранятся в `connections`, визуальные области — в `regions` (поле `coordinates` — JSON-строка с точками полигона).

### Локальные файлы и папки

В БД сохраняются метаданные и путь (`path`) или URL (`url`). Содержимое файлов в SQLite не дублируется: открытие выполняется через Electron.

## Режим разработки и production

### Разработка

1. Backend: `./mvnw spring-boot:run` (порт 8080)
2. Frontend: Vite на порту 5173
3. Electron открывает `http://localhost:5173`

Java-сервер запускается отдельно. В `electron/main.js` предусмотрена точка расширения для будущего автозапуска backend.

### Production (план)

1. Frontend собирается в `frontend/dist/`
2. Electron загружает локальные файлы из `dist/`
3. Electron сможет стартовать упакованный JAR backend и останавливать его при выходе

Автозапуск JAR на этапе каркаса **не реализован**, чтобы не создавать фиктивный механизм для несуществующего артефакта.
