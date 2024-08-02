const mysql = require('mysql2/promise');

// Função para criar uma conexão MySQL
const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });
};

module.exports = {
  createConnection
};
