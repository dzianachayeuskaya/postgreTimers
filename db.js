require("dotenv").config();
const bcrypt = require("bcrypt");

const { nanoid } = require("nanoid");

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  pool: {
    min: 0,
    max: 5,
  },
});

const findUserByUsername = (username) =>
  knex("users")
    .select()
    .where({ username })
    .limit(1)
    .then((results) => results[0]);

const findUserBySessionId = async (sessionId) => {
  const session = await knex("sessions").select().where({ session_id: sessionId }).limit(1);

  if (!session[0]) return;

  return knex("users")
    .select()
    .where({ id: session[0].user_id })
    .limit(1)
    .then((results) => results[0]);
};

const findTimersByUserId = async (userId) => {
  return await knex("timers").select().where({ user_id: userId });
};

const findTimerByTimerId = (timerId) => {
  return knex("timers")
    .select()
    .where({ id: timerId })
    .limit(1)
    .then((results) => results[0]);
};

const createUser = ({ username, password }) => {
  return knex("users")
    .insert({ username: username, password_hash: bcrypt.hashSync(password, 10) })
    .returning("*")
    .then((results) => results[0]);
};

const createSession = async (userId) => {
  const sessionId = nanoid();
  await knex("sessions").insert({ user_id: userId, session_id: sessionId });
  return sessionId;
};

const deleteSession = async (sessionId) => {
  await knex("sessions").where({ session_id: sessionId }).delete();
};

const createTimer = (userId, descr) => {
  return knex("timers")
    .insert({ user_id: userId, descr: descr })
    .returning("*")
    .then((results) => results[0]);
};

const stopTimer = (timerId) => {
  return knex("timers")
    .update({
      ended_at: knex.fn.now(),
      duration: knex.raw("EXTRACT(EPOCH FROM NOW() - timers.started_at) * 1000"),
      is_active: false,
    })
    .where({ id: timerId })
    .returning("*")
    .then((results) => results[0]);
};

module.exports = {
  findUserByUsername,
  findUserBySessionId,
  findTimersByUserId,
  findTimerByTimerId,
  createUser,
  createSession,
  deleteSession,
  createTimer,
  stopTimer,
};
