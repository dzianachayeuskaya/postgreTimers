/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("timers", (table) => {
    table.increments("id");
    table.integer("user_id").notNullable();
    table.foreign("user_id").references("users.id");
    table.string("descr").notNullable();
    table.timestamp("started_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("ended_at");
    table.integer("duration");
    table.boolean("is_active").defaultTo(true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("timers");
};
