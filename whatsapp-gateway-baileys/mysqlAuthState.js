const {
  initAuthCreds,
  BufferJSON,
  proto,
} = require('@whiskeysockets/baileys');

async function useMySQLAuthState(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_auth (
      auth_key VARCHAR(255) PRIMARY KEY,
      auth_value LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const read = async (key) => {
    try {
      const [rows] = await pool.execute(
        'SELECT auth_value FROM whatsapp_auth WHERE auth_key = ?', [key]
      );
      if (!rows.length) return null;
      return JSON.parse(rows[0].auth_value, BufferJSON.reviver);
    } catch { return null; }
  };

  const write = async (key, data) => {
    const value = JSON.stringify(data, BufferJSON.replacer);
    await pool.execute(
      'INSERT INTO whatsapp_auth (auth_key, auth_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE auth_value = ?',
      [key, value, value]
    );
  };

  const remove = async (key) => {
    await pool.execute('DELETE FROM whatsapp_auth WHERE auth_key = ?', [key]);
  };

  const creds = (await read('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(ids.map(async (id) => {
            let value = await read(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }));
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              tasks.push(value ? write(`${category}-${id}`, value) : remove(`${category}-${id}`));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => write('creds', creds),
  };
}

module.exports = { useMySQLAuthState };
