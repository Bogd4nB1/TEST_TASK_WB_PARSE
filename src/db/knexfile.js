require('dotenv').config();
const path = require('path');

/**
 * @type {import('knex').Knex.Config}
 */
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DB_URI || 'postgres://postgres:postgres@db:5432/wb_api',
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, '/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '/seeds'),
    },
  }
};