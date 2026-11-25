// Stores sent approval polls so customer votes can be decrypted later.
// A vote can only be decrypted with the poll's secret, so this must survive restarts:
// MySQL when DATABASE_URL is set (production), otherwise a local JSON file.
const fs = require('fs');

const FILE = process.env.POLL_STORE_PATH || './poll_store.json';
let pool = null;

async function init(dbPool) {
  pool = dbPool || null;
  if (pool) {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS whatsapp_polls (
        msg_id     VARCHAR(128) PRIMARY KEY,
        data       TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
}

function readFile() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

async function save(poll) {
  if (pool) {
    const v = JSON.stringify(poll);
    await pool.execute('INSERT INTO whatsapp_polls (msg_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?', [poll.id, v, v]);
    return;
  }
  const all = readFile();
  all[poll.id] = poll;
  // keep the file small: drop polls older than 60 days
  const cutoff = Date.now() - 60 * 86400000;
  for (const [k, p] of Object.entries(all)) if ((p.createdAt || 0) < cutoff) delete all[k];
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
}

async function get(id) {
  if (!id) return null;
  if (pool) {
    const [rows] = await pool.execute('SELECT data FROM whatsapp_polls WHERE msg_id = ?', [id]);
    return rows.length ? JSON.parse(rows[0].data) : null;
  }
  return readFile()[id] || null;
}

module.exports = { init, save, get };
