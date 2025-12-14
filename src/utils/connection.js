const mysql = require('mysql');
const config = require('../../config');

const pool = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  port: config.mysql.port,
  connectionLimit: 10,
});

module.exports = pool;
