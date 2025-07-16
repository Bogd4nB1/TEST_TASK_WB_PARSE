/**
 * @module services/crontab
 * @description Модуль для настройки и управления cron-заданиями приложения
 * @requires ../db/db - Подключение к базе данных
 * @requires ./parse_wb - Модуль для обновления тарифов Wildberries
 * @requires node-cron - Планировщик задач
 */

const knex = require('../db/db');
const { updateTariffs } = require('./parse_wb');
const cron = require('node-cron');

/**
 * Настраивает и запускает cron-задания приложения
 * @function setupCronJobs
 * @description Настраивает периодическое выполнение задачи обновления тарифов
 * 
 * @example
 * setupCronJobs();
 * 
 * @listens cron#schedule
 * 
 * @returns {void}
 */
function setupCronJobs() {
    // Запуск каждый час в начале часа (0 * * * *)
    cron.schedule('*/5 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] Starting scheduled tariffs update...`);
        try {
            await updateTariffs();
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Scheduled update failed:`, error);
        }
    });
    
    console.log('Cron jobs have been set up');
}

/**
 * Инициализирует приложение
 * @async
 * @function initialize
 * @description Выполняет первоначальную настройку приложения:
 * 1. Проверяет подключение к БД
 * 2. Настраивает cron-задания
 * 3. Выполняет первоначальное обновление тарифов
 * 
 * @throws {Error} Если инициализация не удалась
 * @returns {Promise<void>}
 * 
 * @example
 * initialize()
 *   .then(() => console.log('App initialized'))
 *   .catch(err => console.error('Initialization failed', err));
 */
async function initialize() {
    try {
        // Проверка подключения к БД
        await knex.raw('SELECT 1');
        console.log('Database connection established');
        
        // Настройка cron-заданий
        setupCronJobs();
        
        // Первоначальное обновление тарифов
        await updateTariffs();
    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
}

module.exports = { 
    /**
     * @type {function}
     * @see module:services/crontab~initialize
     */
    initialize 
};