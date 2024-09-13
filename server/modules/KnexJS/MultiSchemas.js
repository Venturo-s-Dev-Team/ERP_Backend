require('dotenv').config();
const knex = require('knex');
// Função para criar uma conexão Knex.js dinâmica para o banco da empresa específica
const createEmpresaKnexConnection = (empresaId) => {
  return knex({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: `${empresaId}` // Nome do banco da empresa específica
    },
    pool: { min: 0, max: 7 }
  });
};

module.exports = {
  createEmpresaKnexConnection,
};