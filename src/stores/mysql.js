const pool = require('../utils/connection');

/** Determina el nombre de la PK según la tabla */
function getIdField(table) {
  if (table === 'bodegas') return 'id_bodega';
  if (table === 'bodega_items') return 'id_bodega_item';
  // por defecto:
  return 'id';
}

/* ----------------- SELECT ALL ----------------- */
function list(table) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `SELECT * FROM ${table}`;
      conn.query(sql, (qErr, rows) => {
        conn.release();
        return qErr ? reject(qErr) : resolve(rows);
      });
    });
  });
}

/* ----------------- SELECT BY ID ----------------- */
function get(table, id) {
  const idField = getIdField(table);

  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `SELECT * FROM ${table} WHERE ${idField} = ?`;
      conn.query(sql, [id], (qErr, rows) => {
        conn.release();
        return qErr ? reject(qErr) : resolve(rows[0]);
      });
    });
  });
}

/* ----------------- INSERT ----------------- */
/**
 * Formatos soportados:
 * 1) { data, params }         -> respeta lo que mande msApiCubicaje
 * 2) { campo1: v1, ... }      -> objeto plano
 *    - en bodegas: usuario_id -> id_usuario
 */
function insert(table, body) {
  let data;
  let params;

  if (body && body.data && body.params) {
    // Formato antiguo explícito
    data = { ...body.data };
    params = body.params;
  } else if (body && typeof body === 'object') {
    // Objeto plano: clonamos y ajustamos
    data = { ...body };

    // Normalización específica por tabla
    if (table === 'bodegas') {
      // si viene usuario_id desde la API, lo usamos como id_usuario (columna real)
      if (data.usuario_id && !data.id_usuario) {
        data.id_usuario = data.usuario_id;
      }
      delete data.usuario_id; // la tabla no tiene esta columna
    }

    params = Object.keys(data).join(',');
  } else {
    return Promise.reject(
      new Error('insert(): formato inválido, se esperaba {data, params} u objeto plano.')
    );
  }

  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `INSERT INTO ${table} (${params}) VALUES (?)`;
      const values = Object.values(data);

      conn.query(sql, [values], (qErr, rows) => {
        conn.release();
        return qErr ? reject(qErr) : resolve(rows);
      });
    });
  });
}

/* ----------------- UPDATE ----------------- */
/**
 * Espera data con la PK adecuada:
 *  - bodegas: id_bodega
 *  - otras: id
 * En bodegas: mapea usuario_id -> id_usuario si llega.
 */
function update(table, data) {
  if (!data || typeof data !== 'object') {
    return Promise.reject(new Error('update(): data inválido.'));
  }

  const idField = getIdField(table);
  const id = data[idField];

  if (!id) {
    return Promise.reject(
      new Error(`update(): falta campo PK '${idField}' en data para tabla '${table}'.`)
    );
  }

  const copy = { ...data };

  if (table === 'bodegas') {
    if (copy.usuario_id && !copy.id_usuario) {
      copy.id_usuario = copy.usuario_id;
    }
    delete copy.usuario_id;
  }

  // sacamos la PK del objeto para no setearla en el SET
  delete copy[idField];

  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `UPDATE ${table} SET ? WHERE ${idField} = ?`;
      conn.query(sql, [copy, id], (qErr, rows) => {
        conn.release();
        return qErr ? reject(qErr) : resolve(rows);
      });
    });
  });
}

/* ----------------- DELETE ----------------- */
function remove(table, id) {
  const idField = getIdField(table);

  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `DELETE FROM ${table} WHERE ${idField} = ?`;
      conn.query(sql, [id], (qErr, rows) => {
        conn.release();
        return qErr ? reject(qErr) : resolve(rows);
      });
    });
  });
}

module.exports = {
  list,
  get,
  insert,
  update,
  remove,
};
