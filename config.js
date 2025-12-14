module.exports = {
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: process.env.MYSQL_DB || 'cubicaje',
    port: Number(process.env.MYSQL_PORT) || 3306
  },
  mysqlService: {
    host: process.env.MYSQL_SERVER_HOST || 'localhost',
    port: Number(process.env.MYSQL_SERVER_PORT) || 3001
  }
};
