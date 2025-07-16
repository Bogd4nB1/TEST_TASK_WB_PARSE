/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// migrations/20240520000000_create_tables.js
exports.up = async function (knex) {
  await knex.schema.createTable('tariffs', (table) => {
    table.increments('id').primary();
    table.string('warehouse_name').notNullable();
    table.decimal('delivery_expr', 10, 2);
    table.decimal('delivery_base', 10, 2);
    table.decimal('delivery_liter', 10, 2);
    table.decimal('storage_base', 10, 2);
    table.decimal('storage_liter', 10, 2);
    table.date('dtTillMax').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('tariffs');
};