const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const qrcode   = require('qrcode');
const pino     = require('pino');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 8080;

// Auth stored on persistent volume (Railway: mount /data as volume, set AUTH_PATH=/data/auth_info)
// Falls back to local ./auth_info for dev
const AUTH_PATH = process.env.AUTH_PATH || './auth_info';

try { fs.mkdirSync(AUTH_PATH, { recursive: true }); } catch (_) {}

app.use(express.json());

let sock         = null;
let clientReady  = false;
let lastQR       = null;
let qrTimestamp  = null;
let qrCount      = 0;
let connecting   = false;
let watchdogTimer = null;

const logger = pino({ level: 'silent' });

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

async function connectToWhatsApp() {
  if (connecting) return;
  connecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['7Gears Motors', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 2000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
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
        const statusCode = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output?.statusCode
          : null;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.warn('🚪 Logged out by WhatsApp — clearing auth, rescan QR.');
          try { fs.rmSync(AUTH_PATH, { recursive: true, force: true }); } catch (_) {}
          try { fs.mkdirSync(AUTH_PATH, { recursive: true }); } catch (_) {}
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
        console.log(`\n✅ WhatsApp connected: ${sock.user?.name} (${sock.user?.id})`);
        console.log(`   Auth saved to: ${AUTH_PATH}\n`);
        startWatchdog();
      }
    });

  } catch (err) {
    connecting = false;
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
    authPath: AUTH_PATH,
    info: clientReady && sock?.user
      ? { name: sock.user.name, number: sock.user.id }
      : null,
  });
});

app.get('/qr.json', (_req, res) => {
  if (clientReady)  return res.json({ status: 'connected' });
  if (!lastQR)      return res.json({ status: 'initializing' });
  res.json({ status: 'pending', qr: lastQR, generatedAt: qrTimestamp });
});

app.get('/qr', async (_req, res) => {
  if (clientReady) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>7GEARS MOTORS — WhatsApp</title>
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}
      .badge{background:#22c55e;color:white;padding:14px 32px;border-radius:12px;font-size:20px;font-weight:700;}
      p{color:#166534;margin-top:12px;font-size:15px;}</style></head>
      <body><div class="badge">✅ WhatsApp Connected</div>
      <p>Session is active and persistent. No re-scan needed.</p></body></html>`);
  }

  if (!lastQR) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>7GEARS MOTORS — WhatsApp QR</title>
      <meta http-equiv="refresh" content="3">
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#fffbeb;}
      .badge{background:#f59e0b;color:white;padding:14px 32px;border-radius:12px;font-size:18px;font-weight:700;}
      p{color:#92400e;margin-top:12px;font-size:14px;}</style></head>
      <body><div class="badge">⏳ Initializing WhatsApp...</div>
      <p>Page auto-refreshes. QR will appear shortly.</p></body></html>`);
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
    .refresh { font-size: 11px; color: #9ca3af; margin-top: 16px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%;
           background: #f59e0b; animation: blink 1.2s infinite; margin-right: 6px; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  </style>
</head>
<body>
  <div class="card">
    <h1>7GEARS MOTORS</h1>
    <p class="sub"><span class="dot"></span>WhatsApp Link — Scan to Connect</p>
    <div id="qrcode"><img src="${qrDataUrl}" width="260" height="260" /></div>
    <div class="steps">
      <p>1. Open <strong>WhatsApp</strong> on your phone</p>
      <p>2. Tap <strong>⋮ Menu → Linked Devices</strong></p>
      <p>3. Tap <strong>Link a Device</strong></p>
      <p>4. <strong>Scan this QR code</strong></p>
    </div>
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
    const phone = normalizePhone(to);
    const jid   = `${phone}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: message });
    console.log(`📱 Sent to +${phone} | MsgID: ${result.key.id}`);
    res.json({ success: true, messageId: result.key.id, to: phone });
  } catch (err) {
    console.error('Send failed:', err.message);
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
  console.log(`   Auth path → ${AUTH_PATH}`);
  console.log(`   Status    → GET  /status`);
  console.log(`   QR        → GET  /qr`);
  console.log(`   Send      → POST /send  { "to": "9876543210", "message": "..." }`);
  console.log(`   Port      → ${PORT}\n`);
  connectToWhatsApp();
});
