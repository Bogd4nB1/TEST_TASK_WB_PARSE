# Wildberries Tariffs API Project

Проект для автоматического сбора тарифов Wildberries и экспорта их в Google Таблицы.

## 📋 Содержание
1. [Требования](#-требования)
2. [Настройка Google Sheets API](#-настройка-google-sheets-api)
3. [Настройка проекта](#-настройка-проекта)
4. [Запуск в Docker](#-запуск-в-docker)
5. [Ручной запуск](#-ручной-запуск)
6. [Структура проекта](#-структура-проекта)
7. [Расписание задач](#-расписание-задач)

## 🌟 Требования

- Node.js 18+
- Docker и Docker Compose
- PostgreSQL 13+
- Аккаунт Google с доступом к Google Sheets API

## 🔧 Настройка Google Sheets API

1. **Создайте новый проект** в [Google Cloud Console](https://console.cloud.google.com/)
2. **Включите Google Sheets API**:
   - Перейдите в "APIs & Services" → "Library"
   - Найдите "Google Sheets API" и включите его
3. **Создайте сервисный аккаунт**:
   - "APIs & Services" → "Credentials" → "Create Credentials" → "Service account"
   - Заполните необходимые данные
4. **Скачайте JSON-ключ**:
   - В настройках сервисного аккаунта перейдите в "Keys"
   - Создайте новый ключ типа JSON и скачайте его
5. **Создайте Google Таблицу**:
   - Создайте новую таблицу в Google Sheets
   - Дайте доступ сервисному аккаунту (email из JSON-ключа) с правами редактора
   - Добавьте в .env id таблицы (пример из url таблицы: 
        https://docs.google.com/spreadsheets/d/1epwm2PW6IUF77Pq78cM0MHDncC_zw-aNRU2aIYyeVcE/edit?gid=1481016110#gid=1481016110
        Нужно взять id между d и edit => 1epwm2PW6IUF77Pq78cM0MHDncC_zw-aNRU2aIYyeVcE
   )

## 🛠 Настройка проекта

1. Скопируйте файл credentials.json в корень проекта:
   ```bash
   cp credentials.json
   ```
2. Заполните `.env`:
   ```
   API_KEY=ваш_ключ_wildberries
   SPREADSHEET_ID=ID_вашей_таблицы
   ```

## 🐳 Запуск в Docker

1. Соберите и запустите контейнеры:
   ```bash
   docker-compose up --build
   ```
2. Проект автоматически:
   - Поднимет PostgreSQL
   - Создаст структуру БД
   - Начнет собирать данные каждые 5 минут
   - Будет экспортировать данные в Google Таблицу

## 💻 Ручной запуск

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Запустите миграции:
   ```bash
   npm run migrate
   ```
3. Запустите приложение:
   ```bash
   npm start
   ```

## 📂 Структура проекта

```
├── src/
│   ├── db/
│   │   ├── migrations/    # Миграции базы данных
│   │   ├── db.js          # Подключение к БД
│   │   └── knexfile.js    # Конфиг Knex.js
│   ├── services/
│   │   ├── crontab.js     # Планировщик задач
│   │   ├── google.js      # Работа с Google Sheets
│   │   └── parse_wb.js    # Парсинг Wildberries API
│   └── index.js           # Основной файл приложения
├── .env                   # Переменные окружения
├── credentials.json       # Ключи Google API
├── docker-compose.yml     # Конфиг Docker
└── Dockerfile             # Конфиг образа приложения
```

## ⏰ Расписание задач

Приложение выполняет следующие автоматические задачи:
- **Каждый час в 0 минут**: Обновление тарифов с Wildberries API
- **После каждого обновления**: Экспорт данных в Google Таблицу
- **Автоматическая сортировка** данных по коэффициенту доставки
