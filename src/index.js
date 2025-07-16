/**
 * @file Основной файл приложения - точка входа
 * @module app
 * @requires dotenv - Загрузка переменных окружения
 * @requires express - Фреймворк для создания сервера
 * @requires ./services/crontab - Модуль для инициализации cron-заданий
 */

require('dotenv').config();
const express = require('express');
const { initialize } = require('./services/crontab');

/**
 * Экземпляр Express приложения
 * @type {express.Application}
 */
const app = express();

/**
 * Порт, на котором запускается сервер.
 * Используется значение из переменной окружения PORT или 8000 по умолчанию.
 * @type {number}
 */
const PORT = process.env.PORT || 8000;

// Инициализация Express
/**
 * Запускает сервер на указанном порту
 * @event
 * @listens Express#listen
 */
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

/**
 * Middleware для обработки URL-encoded данных
 * @middleware
 */
app.use(express.urlencoded({ extended: false }));

/**
 * Middleware для обработки JSON данных
 * @middleware
 */
app.use(express.json());

// Запуск приложения
/**
 * Инициализирует приложение, включая все cron-задания
 * @function initialize
 */
initialize();