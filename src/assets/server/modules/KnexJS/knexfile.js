require('dotenv').config();
const knex = require('knex');

const knexConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME // Banco de dados principal
  },
  pool: { min: 0, max: 7 }
};

const mainDb = knex(knexConfig);

module.exports = { knexConfig, mainDb };
