/**
 * @module services/googleSheets
 * @description Модуль для работы с Google Sheets API: экспорт данных, управление листами
 * @requires dotenv
 * @requires googleapis
 * @requires ../db/db
 */

require('dotenv').config();
const { google } = require('googleapis');
const knex = require('../db/db');

/**
 * Настройки Google API
 * @constant {string[]} SCOPES - Права доступа
 * @constant {Object} CREDENTIALS - Учетные данные сервисного аккаунта
 * @constant {string} SPREADSHEET_ID - ID таблицы из переменных окружения
 * @constant {string} SHEET_NAME - Название листа для работы
 */
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS = require('../../credentials.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'stocks_coefs';

/**
 * Аутентификация в Google API
 * @async
 * @function getAuthClient
 * @returns {Promise<google.auth.GoogleAuth>} Авторизованный клиент
 * @throws {Error} Ошибка аутентификации
 */
async function getAuthClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: CREDENTIALS.project_id,
                private_key_id: CREDENTIALS.private_key_id,
                private_key: CREDENTIALS.private_key.replace(/\\n/g, '\n'),
                client_email: CREDENTIALS.client_email,
                client_id: CREDENTIALS.client_id,
            },
            scopes: SCOPES,
        });
        return await auth.getClient();
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

/**
 * Удаление листа по имени
 * @async
 * @function deleteSheetByName
 * @param {google.sheets_v4.Sheets} sheets - Экземпляр Google Sheets API
 * @param {string} sheetName - Название листа для удаления
 * @returns {Promise<void>}
 * @throws {Error} Ошибка при удалении листа
 */
async function deleteSheetByName(sheets, sheetName) {
    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
            fields: 'sheets.properties'
        });

        const sheetToDelete = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
        if (sheetToDelete) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [{
                        deleteSheet: {
                            sheetId: sheetToDelete.properties.sheetId
                        }
                    }]
                }
            });
            console.log(`Sheet "${sheetName}" deleted successfully`);
        }
    } catch (error) {
        console.error(`Error deleting sheet "${sheetName}":`, error);
        throw error;
    }
}

/**
 * Получение ID листа по имени
 * @async
 * @function getSheetId
 * @param {google.sheets_v4.Sheets} sheets - Экземпляр Google Sheets API
 * @param {string} sheetName - Название листа
 * @returns {Promise<number>} ID листа
 * @throws {Error} Если лист не найден
 */
async function getSheetId(sheets, sheetName) {
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: 'sheets.properties'
    });
    
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }
    return sheet.properties.sheetId;
}

/**
 * Экспорт данных в Google Sheets
 * @async
 * @function exportToGoogleSheet
 * @description Выполняет:
 * 1. Удаление стандартного листа
 * 2. Создание нужного листа (если отсутствует)
 * 3. Получение и сортировку данных из БД
 * 4. Очистку и запись данных
 * 5. Настройку автофильтра
 * @returns {Promise<void>}
 * @throws {Error} Ошибка при экспорте данных
 */
async function exportToGoogleSheet() {
    let client;
    try {
        client = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Удаляем стандартный лист
        try {
            await deleteSheetByName(sheets, 'Лист1');
        } catch (error) {
            console.log('Default sheet "Лист1" not found or already deleted');
        }

        // Проверяем и создаем нужный лист
        let sheetExists = true;
        try {
            await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1`,
            });
        } catch (e) {
            sheetExists = false;
        }

        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: SHEET_NAME
                            }
                        }
                    }]
                }
            });
            console.log(`Sheet "${SHEET_NAME}" created successfully`);
        }

        // Получаем и сортируем данные
        const data = await knex('tariffs')
            .where(knex.raw('DATE(created_at) = ?', [new Date().toISOString().split('T')[0]]))
            .orderBy('delivery_expr', 'asc')
            .select('*');

        if (!data.length) {
            console.log('No data to export');
            return;
        }

        // Подготавливаем данные
        const headers = Object.keys(data[0]);
        const values = data.map(row => 
            headers.map(header => {
                const value = row[header];
                if (value instanceof Date) return value.toLocaleString('ru-RU');
                return value !== null ? value : '';
            })
        );

        // Очищаем и записываем данные
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:Z`,
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [headers, ...values]
            }
        });

        // Настраиваем автофильтр
        const sheetId = await getSheetId(sheets, SHEET_NAME);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    setBasicFilter: {
                        filter: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: 0,
                                endRowIndex: data.length + 1,
                                startColumnIndex: 0,
                                endColumnIndex: headers.length
                            }
                        }
                    }
                }]
            }
        });

        console.log(`Data successfully exported to sheet "${SHEET_NAME}"`);
    } catch (error) {
        console.error('Error exporting to Google Sheet:', error);
        throw error;
    }
}

module.exports = { 
    /**
     * Функция экспорта данных в Google Sheets
     * @type {function}
     * @see module:services/googleSheets~exportToGoogleSheet
     */
    exportToGoogleSheet 
};