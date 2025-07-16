/**
 * @module services/tariffsUpdater
 * @description Модуль для обновления тарифов из API Wildberries и сохранения в БД
 * @requires dotenv
 * @requires ../db/db
 * @requires axios
 * @requires ./google
 */

require('dotenv').config();
const knex = require('../db/db');
const axios = require('axios');
const { exportToGoogleSheet } = require('./google');

/**
 * Обновляет тарифы из API Wildberries и сохраняет в базу данных
 * @async
 * @function updateTariffs
 * @description Выполняет следующие действия:
 * 1. Получает текущие тарифы из API Wildberries
 * 2. Преобразует данные к нужному формату
 * 3. Обновляет существующие или добавляет новые записи в БД
 * 4. Экспортирует обновленные данные в Google Sheets
 * 
 * @throws {Error} Если произошла ошибка в процессе обновления
 * @returns {Promise<void>}
 * 
 * @example
 * // Пример использования
 * updateTariffs()
 *   .then(() => console.log('Tariffs updated successfully'))
 *   .catch(err => console.error('Failed to update tariffs:', err));
 */
async function updateTariffs() {
    try {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const response = await axios.get(`https://common-api.wildberries.ru/api/v1/tariffs/box?date=${formattedDate}`, {
            headers: {
                'Authorization': process.env.API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const dtTillMax = response.data.response.data.dtTillMax;
        const warehouseList = response.data.response.data.warehouseList;
    
        const existingRecords = await knex('tariffs')
            .where(knex.raw('DATE(created_at) = ?', [formattedDate]))
            .select('*');
        
        for (const warehouse of warehouseList) {
            const warehouseName = warehouse.warehouseName;
            
            /**
             * Преобразует строковые значения в числа
             * @function parseNumber
             * @param {string} str - Строковое значение для преобразования
             * @returns {number|null} Числовое значение или null, если строка равна '-'
             */
            const parseNumber = (str) => {
                if (str === '-') return null;
                return parseFloat(str.replace(',', '.'));
            };
            
            const tariffData = {
                warehouse_name: warehouseName,
                delivery_expr: parseNumber(warehouse.boxDeliveryAndStorageExpr),
                delivery_base: parseNumber(warehouse.boxDeliveryBase),
                delivery_liter: parseNumber(warehouse.boxDeliveryLiter),
                storage_base: parseNumber(warehouse.boxStorageBase),
                storage_liter: parseNumber(warehouse.boxStorageLiter),
                dtTillMax: dtTillMax,
                updated_at: today
            };
            
            const existingRecord = existingRecords.find(r => r.warehouse_name === warehouseName);
            
            if (!existingRecord) {
                tariffData.created_at = today;
                await knex('tariffs').insert(tariffData);
                console.log(`Added new record for warehouse: ${warehouseName}`);
            } else {
                await knex('tariffs')
                    .where({ id: existingRecord.id })
                    .update(tariffData);
                console.log(`Updated record for warehouse: ${warehouseName}`);
            }
        }
        
        console.log(`Tariffs update completed for date: ${today}`);
        
        // Экспорт
        await exportToGoogleSheet();
        
    } catch (error) {
        console.error('Error in update process:', error);
        throw error;
    }
}

module.exports = { 
    /**
     * Функция обновления тарифов
     * @type {function}
     * @see module:services/tariffsUpdater~updateTariffs
     */
    updateTariffs 
};