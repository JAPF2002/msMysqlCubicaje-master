// msMysqlCubicaje-master/src/stores/mysql.js
// Capa de acceso a datos para msMysqlCubicaje.
// ÚNICO responsable de hablar con MySQL mediante el pool de ../utils/connection.

const pool = require('../utils/connection');

/** Determina el nombre de la PK según la tabla (en español) */
function getIdField(table) {
  switch (table) {
    case 'bodegas':
      return 'id_bodega';
    case 'bodega_items':
      return 'id_bodega_item';
    case 'items':
      return 'id_item';
    case 'categorias':
      return 'id_categoria';
    case 'usuarios':
      return 'id_usuario';
    default:
      return 'id';
  }
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
 * 1) { data, params }
 *    - params: string con columnas, ej: "nombre, ciudad, direccion"
 *    - data: objeto con los valores en el mismo orden lógico
 * 2) objeto plano { campo: valor }
 *    - auto genera columnas a partir de las keys del objeto
 *    - en bodegas: usuario_id -> id_usuario (normalizado)
 */
function insert(table, body) {
  let data;
  let params;

  if (body && body.data && body.params) {
    // Modo explícito
    data = { ...body.data };
    params = body.params;
  } else if (body && typeof body === 'object') {
    // Modo objeto plano
    data = { ...body };

    if (table === 'bodegas') {
      // Normalizar nombres a columnas reales
      if (data.usuario_id && !data.id_usuario) {
        data.id_usuario = data.usuario_id;
      }
      delete data.usuario_id;
    }

    const keys = Object.keys(data);
    if (!keys.length) {
      return Promise.reject(
        new Error('insert(): objeto de datos vacío.')
      );
    }

    params = keys.join(', ');
  } else {
    return Promise.reject(
      new Error(
        'insert(): formato inválido, se esperaba {data, params} u objeto plano.'
      )
    );
  }

  const values = Object.values(data);

  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `INSERT INTO ${table} (${params}) VALUES (?)`;

      conn.query(sql, [values], (qErr, rows) => {
        conn.release();
        return qErr ? reject(qErr) : resolve(rows);
      });
    });
  });
}

/* ----------------- UPDATE ----------------- */
function update(table, data) {
  if (!data || typeof data !== 'object') {
    return Promise.reject(new Error('update(): data inválido.'));
  }

  const idField = getIdField(table);
  const id = data[idField];

  if (!id) {
    return Promise.reject(
      new Error(
        `update(): falta campo PK '${idField}' en data para tabla '${table}'.`
      )
    );
  }

  const copy = { ...data };

  if (table === 'bodegas') {
    if (copy.usuario_id && !copy.id_usuario) {
      copy.id_usuario = copy.usuario_id;
    }
    delete copy.usuario_id;
  }

  delete copy[idField];

  const keys = Object.keys(copy);
  if (!keys.length) {
    return Promise.reject(
      new Error('update(): no hay campos para actualizar.')
    );
  }

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

/* ----------------- RAW QUERY OPCIONAL ----------------- */
// Por si msApiCubicaje quiere delegar queries directos sin duplicar lógica.
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);

      conn.query(sql, params, (qErr, rows) => {
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
  query,
};
