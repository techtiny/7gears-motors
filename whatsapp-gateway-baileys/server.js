const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const qrcode  = require('qrcode');
const pino    = require('pino');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

let sock          = null;
let clientReady   = false;
let lastQR        = null;
let qrTimestamp   = null;
let qrCount       = 0;
let connecting    = false;
let watchdogTimer = null;
let dbPool        = null;
let authState     = null;
let lastError     = null;

const logger = pino({ level: 'silent' });

// ── Auth setup ─────────────────────────────────────────────────────────────
async function getAuthState() {
  if (process.env.DATABASE_URL) {
    const mysql = require('mysql2/promise');
    const { useMySQLAuthState } = require('./mysqlAuthState');
    if (!dbPool) {
      dbPool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 5,
        ssl: { rejectUnauthorized: false },
      });
    }
    // Verify connection before proceeding
    try {
      await dbPool.execute('SELECT 1');
      console.log('🗄️  MySQL connected — session will persist across restarts');
    } catch (err) {
      console.error('❌ MySQL connection failed:', err.message);
      console.warn('⚠️  Falling back to file-based auth (session will reset on restart)');
      dbPool = null;
    }
    if (dbPool) return useMySQLAuthState(dbPool);
  }

  // file-based auth (local dev or MySQL fallback)
  const AUTH_PATH = process.env.AUTH_PATH || './auth_info';
  try { fs.mkdirSync(AUTH_PATH, { recursive: true }); } catch (_) {}
  console.log(`📁 Using file auth: ${AUTH_PATH}`);
  return useMultiFileAuthState(AUTH_PATH);
}

// ── Watchdog ───────────────────────────────────────────────────────────────
function clearWatchdog() {
  if (watchdogTimer) { clearInterval(watchdogTimer); watchdogTimer = null; }
}
function startWatchdog() {
  clearWatchdog();
  watchdogTimer = setInterval(() => {
    if (!clientReady && !connecting) {
      console.log('⚠️  Watchdog: not connected — reconnecting...');
      connectToWhatsApp();
    }
  }, 30000);
}

// ── Connect ────────────────────────────────────────────────────────────────
async function connectToWhatsApp() {
  if (connecting) return;
  connecting = true;

  try {
    authState = await getAuthState();
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: authState.state,
      logger,
      printQRInTerminal: false,
      browser: ['7Gears Motors', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 2000,
    });

    sock.ev.on('creds.update', authState.saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        lastQR      = qr;
        qrTimestamp = new Date().toISOString();
        clientReady = false;
        qrCount++;
        if (qrCount === 1) {
          console.log('\n========================================');
          console.log(' Scan QR at /qr in your browser');
          console.log('========================================\n');
        } else {
          console.log(`🔄 QR refreshed (#${qrCount}) — open /qr to scan`);
        }
      }

      if (connection === 'close') {
        clientReady = false;
        connecting  = false;
        clearWatchdog();
        const statusCode = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output?.statusCode
          : null;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.warn('🚪 Logged out by WhatsApp — clearing session, please rescan QR.');
          if (dbPool) {
            try { await dbPool.execute('DELETE FROM whatsapp_auth'); } catch (_) {}
          } else {
            const AUTH_PATH = process.env.AUTH_PATH || './auth_info';
            try { fs.rmSync(AUTH_PATH, { recursive: true, force: true }); } catch (_) {}
          }
          qrCount = 0;
          setTimeout(() => connectToWhatsApp(), 2000);
        } else {
          const delay = statusCode === 408 ? 10000 : 5000;
          console.warn(`⚠️  Disconnected (code ${statusCode}). Reconnecting in ${delay / 1000}s...`);
          setTimeout(() => connectToWhatsApp(), delay);
        }
      }

      if (connection === 'open') {
        clientReady = true;
        lastQR      = null;
        qrCount     = 0;
        connecting  = false;
        const storage = process.env.DATABASE_URL ? 'MySQL' : 'local file';
        console.log(`\n✅ WhatsApp connected: ${sock.user?.name} (${sock.user?.id})`);
        console.log(`   Session stored in: ${storage}\n`);
        startWatchdog();
      }
    });

  } catch (err) {
    connecting = false;
    lastError = err.message;
    console.error('⚠️  connectToWhatsApp error:', err.message);
    setTimeout(() => connectToWhatsApp(), 10000);
  }
}

// ── REST API ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ok', service: '7Gears WhatsApp Gateway (Baileys)' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/status', (_req, res) => {
  res.json({
    ready: clientReady,
    qrPending: !!lastQR,
    connecting,
    lastError,
    storage: dbPool ? 'mysql' : 'file',
    info: clientReady && sock?.user
      ? { name: sock.user.name, number: sock.user.id }
      : null,
  });
});

app.get('/qr.json', (_req, res) => {
  if (clientReady) return res.json({ status: 'connected' });
  if (!lastQR)     return res.json({ status: 'initializing' });
  res.json({ status: 'pending', qr: lastQR, generatedAt: qrTimestamp });
});

const CLEAR_BTN = `
  <div style="margin-top:28px;border-top:1px solid rgba(0,0,0,0.08);padding-top:20px;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;margin-bottom:10px;">Session not working? Force a fresh scan:</p>
    <button id="clearBtn" onclick="clearSession()" style="background:#ef4444;color:white;border:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      🗑️ Force Clear &amp; Rescan
    </button>
    <button id="reconnBtn" onclick="reconnect()" style="background:#f59e0b;color:white;border:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-left:10px;">
      🔄 Reconnect
    </button>
    <p id="msg" style="font-size:12px;margin-top:10px;color:#374151;"></p>
  </div>
  <script>
    async function clearSession(){
      if(!confirm('Clear session and show new QR? You will need to scan again.')) return;
      document.getElementById('clearBtn').disabled=true;
      document.getElementById('msg').textContent='Clearing...';
      try{
        const r=await fetch('/clear-session',{method:'POST'});
        const d=await r.json();
        document.getElementById('msg').textContent='✅ Cleared! Reloading...';
        setTimeout(()=>location.reload(),2000);
      }catch(e){document.getElementById('msg').textContent='Error: '+e.message;}
    }
    async function reconnect(){
      document.getElementById('reconnBtn').disabled=true;
      document.getElementById('msg').textContent='Reconnecting...';
      try{
        await fetch('/reconnect',{method:'POST'});
        document.getElementById('msg').textContent='✅ Reconnecting... reloading in 5s';
        setTimeout(()=>location.reload(),5000);
      }catch(e){document.getElementById('msg').textContent='Error: '+e.message;}
    }
  </script>`;

app.get('/qr', async (_req, res) => {
  if (clientReady) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>7GEARS MOTORS — WhatsApp</title>
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0fdf4;}
      .badge{background:#22c55e;color:white;padding:14px 32px;border-radius:12px;font-size:20px;font-weight:700;}
      p{color:#166534;margin-top:12px;font-size:15px;text-align:center;}</style></head>
      <body><div class="badge">✅ WhatsApp Connected</div>
      <p>Session is saved in MySQL — no re-scan needed on restart.</p>
      ${CLEAR_BTN}</body></html>`);
  }
  if (!lastQR) {
    const errHtml = lastError
      ? `<div style="margin-top:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:12px;color:#991b1b;max-width:340px;word-break:break-all;">
           <strong>Last error:</strong> ${lastError}
         </div>`
      : '';
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>7GEARS MOTORS — WhatsApp QR</title>
      <meta http-equiv="refresh" content="4">
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fffbeb;}
      .badge{background:#f59e0b;color:white;padding:14px 32px;border-radius:12px;font-size:18px;font-weight:700;}
      p{color:#92400e;margin-top:12px;font-size:14px;}</style></head>
      <body><div class="badge">⏳ Initializing WhatsApp...</div>
      <p>Page auto-refreshes. QR will appear shortly.</p>
      ${errHtml}${CLEAR_BTN}</body></html>`);
  }
  try {
    const qrDataUrl = await qrcode.toDataURL(lastQR, { width: 300 });
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>7GEARS MOTORS — Scan WhatsApp QR</title>
  <meta http-equiv="refresh" content="25">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #fff7ed; min-height: 100vh;
           display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .card { background: white; border-radius: 20px; padding: 36px 40px; text-align: center;
            box-shadow: 0 8px 40px rgba(0,0,0,0.12); max-width: 380px; width: 100%; }
    h1 { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .sub { font-size: 13px; color: #9ca3af; margin-bottom: 24px; }
    #qrcode { display: flex; justify-content: center; margin-bottom: 24px; }
    #qrcode img { border-radius: 12px; border: 3px solid #f97316; }
    .steps { text-align: left; background: #fff7ed; border-radius: 12px; padding: 16px 18px; }
    .steps p { font-size: 13px; color: #374151; line-height: 2; }
    .steps strong { color: #f97316; }
    .note { font-size: 12px; color: #6b7280; margin-top: 14px; background: #f0fdf4; border-radius: 8px; padding: 8px 12px; }
    .refresh { font-size: 11px; color: #9ca3af; margin-top: 12px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%;
           background: #f59e0b; animation: blink 1.2s infinite; margin-right: 6px; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  </style>
</head>
<body>
  <div class="card">
    <h1>7GEARS MOTORS</h1>
    <p class="sub"><span class="dot"></span>WhatsApp Link — Scan Once, Stay Connected</p>
    <div id="qrcode"><img src="${qrDataUrl}" width="260" height="260" /></div>
    <div class="steps">
      <p>1. Open <strong>WhatsApp</strong> on your phone</p>
      <p>2. Tap <strong>⋮ Menu → Linked Devices</strong></p>
      <p>3. Tap <strong>Link a Device</strong></p>
      <p>4. <strong>Scan this QR code</strong></p>
    </div>
    <div class="note">✅ Session saved in MySQL — no re-scan on restarts</div>
    <p class="refresh">QR auto-refreshes every 25 sec · ${qrTimestamp}</p>
  </div>
</body>
</html>`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  if (!clientReady) return res.status(503).json({ error: 'WhatsApp not connected. Scan QR code first.' });
  if (!to || !message) return res.status(400).json({ error: 'to and message are required' });
  try {
    const phone  = normalizePhone(to);
    const result = await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
    console.log(`📱 Sent to +${phone} | MsgID: ${result.key.id}`);
    res.json({ success: true, messageId: result.key.id, to: phone });
  } catch (err) {
    console.error('Send failed:', err.message);
    // Session may have been invalidated — mark as disconnected so watchdog reconnects
    clientReady = false;
    connecting  = false;
    res.status(500).json({ error: err.message });
  }
});

// Force a fresh reconnect without clearing session (useful when connection goes stale)
app.post('/reconnect', async (_req, res) => {
  console.log('🔄 Manual reconnect triggered via API');
  clientReady = false;
  connecting  = false;
  if (sock) {
    try { sock.end(); } catch (_) {}
    sock = null;
  }
  setTimeout(() => connectToWhatsApp(), 500);
  res.json({ status: 'reconnecting', message: 'Reconnect triggered. Check /status in a few seconds.' });
});

// Clear session from MySQL and force rescan (when session is fully revoked)
app.post('/clear-session', async (_req, res) => {
  console.log('🗑️  Clearing WhatsApp session...');
  clientReady = false;
  connecting  = false;
  if (sock) {
    try { sock.end(); } catch (_) {}
    sock = null;
  }
  if (dbPool) {
    try { await dbPool.execute('DELETE FROM whatsapp_auth'); } catch (e) {
      return res.status(500).json({ error: 'Failed to clear MySQL session: ' + e.message });
    }
  } else {
    const AUTH_PATH = process.env.AUTH_PATH || './auth_info';
    try { fs.rmSync(AUTH_PATH, { recursive: true, force: true }); } catch (_) {}
  }
  qrCount = 0;
  lastQR   = null;
  setTimeout(() => connectToWhatsApp(), 500);
  res.json({ status: 'cleared', message: 'Session cleared. Open /qr to scan a new QR code.' });
});

app.post('/send-document', async (req, res) => {
  const { to, fileName, pdfBase64, caption } = req.body;
  if (!clientReady) return res.status(503).json({ error: 'WhatsApp not connected.' });
  if (!to || !pdfBase64 || !fileName) return res.status(400).json({ error: 'to, fileName and pdfBase64 are required' });
  try {
    const phone  = normalizePhone(to);
    const buffer = Buffer.from(pdfBase64, 'base64');
    const result = await sock.sendMessage(`${phone}@s.whatsapp.net`, {
      document: buffer,
      mimetype: 'application/pdf',
      fileName: fileName,
      caption:  caption || '',
    });
    console.log(`📄 PDF sent to +${phone} | MsgID: ${result.key.id}`);
    res.json({ success: true, messageId: result.key.id, to: phone });
  } catch (err) {
    console.error('Document send failed:', err.message);
    clientReady = false;
    connecting  = false;
    res.status(500).json({ error: err.message });
  }
});

app.post('/send-bulk', async (req, res) => {
  const { messages } = req.body;
  if (!clientReady) return res.status(503).json({ error: 'WhatsApp not connected' });
  const results = [];
  for (const item of messages) {
    try {
      const phone  = normalizePhone(item.to);
      const result = await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: item.message });
      results.push({ to: phone, success: true, messageId: result.key.id });
      await delay(500);
    } catch (err) {
      results.push({ to: item.to, success: false, error: err.message });
    }
  }
  res.json({ results });
});

function normalizePhone(phone) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return '91' + digits;
  return digits;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔧 7GEARS MOTORS WhatsApp Gateway (Baileys)`);
  console.log(`   Storage   → ${process.env.DATABASE_URL ? 'MySQL (persistent)' : 'File (local)'}`);
  console.log(`   Status    → GET  /status`);
  console.log(`   QR        → GET  /qr`);
  console.log(`   Send      → POST /send`);
  console.log(`   Port      → ${PORT}\n`);
  connectToWhatsApp();
});
