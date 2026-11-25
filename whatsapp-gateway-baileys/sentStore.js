// Keeps the content of messages the gateway sent, so Baileys can re-send them when the
// customer's phone asks for a retry (it couldn't decrypt the first copy — common right after
// the gateway is re-linked with a new QR). Without this, such messages stay on a single tick
// and the customer sees "Waiting for this message".
const fs = require('fs');
const path = require('path');
const { BufferJSON, proto } = require('@whiskeysockets/baileys');

const FILE = path.join(__dirname, 'sent_messages.json');
const MAX = 1000;
let store = new Map();
let saveTimer = null;

try {
  if (fs.existsSync(FILE)) {
    const obj = JSON.parse(fs.readFileSync(FILE, 'utf8'), BufferJSON.reviver);
    store = new Map(Object.entries(obj));
  }
} catch (e) { console.error('sentStore: could not load', e.message); }

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(FILE, JSON.stringify(Object.fromEntries(store), BufferJSON.replacer)); }
    catch (e) { console.error('sentStore: could not save', e.message); }
  }, 1000);
}

function remember(msg) {
  if (!msg?.key?.id || !msg.message) return;
  store.set(msg.key.id, msg.message);
  while (store.size > MAX) store.delete(store.keys().next().value);
  scheduleSave();
}

async function getMessage(key) {
  const m = store.get(key?.id);
  if (!m) return undefined;
  console.log(`🔁 Re-sending message ${key.id} on the recipient's retry request`);
  return proto.Message.fromObject(m);
}

// Minimal cache for Baileys' retry counters (get/set/del/flushAll).
const retryCounter = new Map();
const msgRetryCounterCache = {
  get: (k) => retryCounter.get(k),
  set: (k, v) => { retryCounter.set(k, v); if (retryCounter.size > 5000) retryCounter.clear(); },
  del: (k) => retryCounter.delete(k),
  flushAll: () => retryCounter.clear(),
};

module.exports = { remember, getMessage, msgRetryCounterCache };
