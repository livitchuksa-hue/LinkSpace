# Linkspace

Настольное приложение для организации информации в едином интерактивном графе.

Пользователь может добавлять заметки, локальные файлы и папки, а также интернет-ссылки. Каждый объект отображается как узел графа: узлы можно перемещать, связывать и визуально группировать в тематические области. Данные хранятся локально в SQLite и восстанавливаются после перезапуска.

## Технологии

| Слой | Стек |
|------|------|
| Frontend | HTML5, CSS3, JavaScript, Vue 3, Vite |
| Desktop | Electron (Main Process, Preload, IPC) |
| Backend | Java 21, Spring Boot 3.x, Maven, REST API |
| Database | SQLite + SQLite JDBC + Spring JDBC |

## Требования к окружению

- **Node.js** 18+ и **npm**
- **Java JDK 21+** (проект компилируется под Java 21; более новые JDK могут работать, но для стабильной проверки лучше использовать 21)
- Maven Wrapper уже включён в `backend/` — отдельная установка Maven не обязательна

## Структура проекта

```text
Linkspace/
├── frontend/   # Vue 3 + Vite + Electron
├── backend/    # Spring Boot + SQLite
└── docs/       # Архитектура и API
```

## Установка зависимостей

```powershell
cd frontend
npm install
```

Зависимости backend Maven скачиваются автоматически при первой сборке или запуске через `backend/mvnw.cmd`.

## Запуск приложения

### Рекомендуемый способ: Electron + Vite + backend автоматически

```powershell
cd frontend
npm run electron:dev
```

Команда:

1. запускает Vite dev-сервер на `http://127.0.0.1:5173`;
2. запускает Electron;
3. автоматически поднимает Spring Boot backend, если он ещё не запущен;
4. при закрытии окна останавливает backend, если его запустил сам Electron.

В режиме разработки backend запускается через Maven Wrapper, поэтому изменения в Java-коде подхватываются после перезапуска `electron:dev`.

### Production-режим Electron

Сначала соберите frontend и backend:

```powershell
cd backend
.\mvnw.cmd -DskipTests package

cd ..\frontend
npm run build
npm run electron
```

В этом режиме Electron использует собранный `backend/target/linkspace-backend-0.1.0-SNAPSHOT.jar`, если он существует.

### Только frontend в браузере

```powershell
cd frontend
npm run dev
```

Затем в отдельном терминале запустите backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Frontend по умолчанию обращается к `http://127.0.0.1:8080/api`.

## Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Vite dev-сервер |
| `npm run build` | Сборка frontend в `dist/` |
| `npm run electron` | Electron против собранного `dist/` |
| `npm run electron:dev` | Vite + Electron + автоматический backend |
| `.\mvnw.cmd spring-boot:run` | Backend вручную |
| `.\mvnw.cmd -DskipTests package` | Сборка backend JAR |

## Данные

SQLite-файл создаётся здесь:

```text
backend/data/linkspace.db
```

В базе хранятся объекты, связи, области, координаты узлов, настройки отображения графа и дата последнего открытия объекта.

## Текущий статус MVP

Реализовано:

- интерактивный SVG-граф с панорамированием, масштабированием и перетаскиванием узлов;
- заметки, локальные файлы, папки и ссылки;
- создание, редактирование, удаление и перемещение объектов;
- связи между узлами с названиями;
- полигональные визуальные области с названием и монохромной заливкой;
- диалоги выбора файлов/папок и drag-and-drop;
- открытие файлов, папок и URL через Electron IPC;
- индикация отсутствующих файлов;
- правая панель свойств, левая панель статистики и экран настроек;
- сохранение вида графа и видимых полей узлов в SQLite;
- автоматический запуск backend из Electron.
