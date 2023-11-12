const bcrypt = require("bcrypt");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.seed = async function (knex) {
  await knex("sessions").del();

  await knex("timers").del();

  await knex("users").del();

  const users = await knex("users")
    .insert([
      { username: "user1", password_hash: bcrypt.hashSync("qwe", 10) },
      { username: "user2", password_hash: bcrypt.hashSync("pwd007", 10) },
    ])
    .returning("*");

  await knex("timers").insert([
    { user_id: users[0].id, descr: "First timer", is_active: true },
    {
      user_id: users[0].id,
      descr: "Second timer",
      started_at: knex.raw("NOW() - INTERVAL '5000 milliseconds'"),
      ended_at: knex.raw("NOW() - INTERVAL '3000 milliseconds'"),
      duration: 2000,
      is_active: false,
    },
    {
      user_id: users[1].id,
      descr: "First timer",
      started_at: knex.raw("NOW() - INTERVAL '16000 milliseconds'"),
      ended_at: knex.fn.now(),
      duration: 16000,
    },
  ]);
};
