const { mainDb } = require('./knexfile');

const checkIfDatabaseExists = async (databaseName) => {
    try {
      const result = await mainDb.raw(`SHOW DATABASES LIKE '${databaseName}'`);
      return result[0].length > 0;
    } catch (error) {
      console.error('Erro ao verificar a existência do banco de dados:', error);
      return false;
    }
  };

  module.exports = {checkIfDatabaseExists}