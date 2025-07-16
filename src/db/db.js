/**
 * @file Модуль конфигурации Knex.js для работы с базой данных
 * @module db/db
 * @requires dotenv
 * @requires knex
 * @requires ./knexfile.js
 */

require('dotenv').config();
const knex = require('knex');
const config = require('./knexfile.js');

/**
 * Текущее окружение приложения.
 * Определяется переменной окружения NODE_ENV или по умолчанию 'development'.
 * @type {string}
 * @constant
 */
const env = process.env.NODE_ENV || 'development';

/**
 * Экземпляр Knex.js, сконфигурированный для текущего окружения.
 * Использует конфигурацию из knexfile.js для выбранного окружения.
 * @type {Knex}
 * @constant
 */
const options = knex(config[env]);

/**
 * Экспортирует сконфигурированный экземпляр Knex.js.
 * @type {Knex}
 */
module.exports = options;