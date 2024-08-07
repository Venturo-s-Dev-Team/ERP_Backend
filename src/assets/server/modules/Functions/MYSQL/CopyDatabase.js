const copyDatabase = async (connection, sourceDb, targetDb) => {
    const [tables] = await connection.query(`SHOW TABLES FROM ${sourceDb}`);
    const tableNames = tables.map(row => Object.values(row)[0]);
  
    for (const tableName of tableNames) {
      await connection.query(`CREATE TABLE ${targetDb}.${tableName} LIKE ${sourceDb}.${tableName}`);
      await connection.query(`INSERT INTO ${targetDb}.${tableName} SELECT * FROM ${sourceDb}.${tableName}`);
    }
  };

module.exports={copyDatabase}