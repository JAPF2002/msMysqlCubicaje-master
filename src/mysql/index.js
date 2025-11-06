// src/mysql/index.js
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');          // Cliente MySQL
const config = require('../../config');
const router = require('./network');

const app = express();
app.use(bodyParser.json());

// ===== RUTAS DE DIAGNÓSTICO BÁSICAS =====

// Estado del servicio (NO consulta la BD)
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'mysql-service',
    port: config.mysqlService.port,
  });
});

// ===== CONEXIÓN A MySQL (POOL) =====
const pool = mysql.createPool({
  host: config.mysql.host || 'localhost',
  user: config.mysql.user || 'root',
  password: config.mysql.password || '',
  database: config.mysql.database || 'cubicaje',
  waitForConnections: true,
  connectionLimit: 10,
});

// Ping a la BD (consulta neutra sin tablas)
app.get('/db-ping', (req, res) => {
  pool.query('SELECT 1 AS ok', (err, rows) => {
    if (err) {
      console.error('❌ Error al conectar a MySQL:', err);
      return res.status(500).json({ ok: false, error: err.code || err.message });
    }
    res.json({ ok: rows?.[0]?.ok === 1 });
  });
});

// ===== RUTAS DE PRUEBA CON TABLAS REALES =====
app.get('/testdb/usuarios', (req, res) => {
  pool.query('SELECT * FROM usuarios LIMIT 5', (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.code || err.message });
    res.json({ ok: true, table: 'usuarios', rows });
  });
});

app.get('/testdb/bodegas', (req, res) => {
  pool.query('SELECT * FROM bodegas LIMIT 5', (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.code || err.message });
    res.json({ ok: true, table: 'bodegas', rows });
  });
});

app.get('/testdb/items', (req, res) => {
  pool.query('SELECT * FROM items LIMIT 5', (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.code || err.message });
    res.json({ ok: true, table: 'items', rows });
  });
});

// ===== TUS RUTAS DEL SERVICIO (deben ir después de /health para no sobreescribir) =====
app.use('/', router);

// ===== LEVANTAR SERVIDOR =====
app.listen(config.mysqlService.port, function () {
  console.log('Mysql service online in port', config.mysqlService.port);
});
