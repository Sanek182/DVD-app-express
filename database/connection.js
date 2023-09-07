const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10),
    queueLimit: 0
};

let connection;

async function initDbConnection() {
    if (connection) return connection;

    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Connected to the MySQL server.');
      await testConnection();
      return connection;
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
}

initDbConnection();

async function testConnection() {
    try {
      const [rows] = await connection.query('SELECT DATABASE() as db');
      console.log('Connected to the database:', rows[0].db);
    } catch (error) {
      console.error('Error executing test query:', error);
    }
}

async function query(sql, params) {
    const conn = await initDbConnection();
    return conn.query(sql, params);
}
  
module.exports = {
    query,
};