const { mainDb } = require('./knexfile'); // Configurações do Knex 
const logAction = async (userId, userName, action, tableName) => {
    try {
      await mainDb('historico_logs').insert({
        user_id: userId,
        user_name: userName,
        action,
        table_name: tableName,
      });
      console.log(`Log registrado: ${userName} ${action} ${tableName}`);
    } catch (err) {
      console.error("Erro ao registrar log:", err);
    }
  };

  module.exports = {logAction}