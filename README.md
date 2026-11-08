# Linkspace

Настольное приложение для организации информации в едином интерактивном графе.

Пользователь может добавлять заметки, локальные файлы и папки, а также интернет-ссылки. Каждый объект отображается как узел графа: узлы можно перемещать, связывать и объединять в визуальные тематические области. Данные хранятся локально и восстанавливаются после перезапуска.

## Технологии

| Слой | Стек |
|------|------|
| Frontend | HTML5, CSS3, JavaScript, Vue 3, Vite |
| Desktop | Electron (Main Process, Preload, IPC) |
| Backend | Java 21, Spring Boot 3.x, Maven, REST API |
| Database | SQLite + SQLite JDBC + Spring JDBC / JdbcTemplate |

## Требования к окружению

- **Node.js** 18+ и **npm**
- **Java JDK 21+** (проект компилируется под Java 21)
- Maven Wrapper уже включён в `backend/` (отдельная установка Maven не обязательна)

## Структура проекта

```text
Linkspace/
├── frontend/   # Vue 3 + Vite + Electron
├── backend/    # Spring Boot + SQLite
└── docs/       # Архитектура и API
```

Подробнее: [docs/architecture.md](docs/architecture.md), [docs/api.md](docs/api.md).

## Установка зависимостей

### Frontend

```bash
cd frontend
npm install
```

### Backend

Зависимости Maven скачиваются автоматически при первой сборке через Maven Wrapper.

## Запуск frontend (Vite)

```bash
cd frontend
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`.

Перед запуском скопируйте переменные окружения:

```bash
copy .env.example .env
```

По умолчанию API: `http://localhost:8080/api`.

## Запуск backend

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

Сервер стартует на порту **8080**. Файл БД: `backend/data/linkspace.db` (создаётся автоматически).

## Запуск Electron

Сначала убедитесь, что Vite-сервер доступен (скрипт ниже запускает его сам):

```bash
cd frontend
npm run electron:dev
```

Команда параллельно поднимает Vite и Electron. В режиме разработки окно открывает `http://localhost:5173`.

Backend в режиме разработки запускается отдельно через Maven Wrapper (см. выше). В Electron заложена точка расширения для будущего автоматического запуска Java-сервера.

## Команды сборки

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
.\mvnw.cmd clean package -DskipTests
```

JAR появится в `backend/target/`.

### Electron (production-сборка UI)

```bash
cd frontend
npm run build
npm run electron
```

Для упаковки дистрибутива (когда будет настроено):

```bash
cd frontend
npm run electron:build
```

## Полезные npm-скрипты

| Скрипт | Описание |
|--------|----------|
| `npm run dev` | Vite dev-сервер |
| `npm run build` | Сборка frontend |
| `npm run preview` | Предпросмотр сборки |
| `npm run electron` | Electron против уже собранного `dist/` |
| `npm run electron:dev` | Vite + Electron |
| `npm run electron:build` | Сборка UI и упаковка Electron |

## Текущий статус

Каркас проекта готов к дальнейшей разработке. Реализованы:

- структура каталогов;
- стартовый экран Linkspace;
- безопасный Electron preload API;
- REST-заготовки и схема SQLite;
- документация по архитектуре и API.

Пока не реализованы: полноценный интерактивный граф, полная бизнес-логика и все REST-операции.
