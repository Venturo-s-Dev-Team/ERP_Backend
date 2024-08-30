const { createEmpresaKnexConnection } = require("../../KnexJS/MultiSchemas");

const logActionEmpresa = async (empresaId, userId, userName, action, tableName) => {
    try {
      const connection = await createEmpresaKnexConnection(`empresa_${empresaId}`)
      if (connection) {
      await createEmpresaKnexConnection(`empresa_${empresaId}`)('historicologs').insert({
        user_id: userId,
        user_name: userName,
        action,
        table_name: tableName,
      });
      console.log(`Log registrado (Empresa_${empresaId}): ${userName} ${action} ${tableName}`);
    } else {
      console.log('Erro ao conectar com o databae: ', connection)
    }
    } catch (err) {
      console.error("Erro ao registrar log:", err);
    }
  };

  module.exports = {logActionEmpresa}