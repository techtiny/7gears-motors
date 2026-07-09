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

const app  = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

let sock         = null;
let clientReady  = false;
let lastQR       = null;
let qrTimestamp  = null;
let reconnecting = false;

const logger = pino({ level: 'silent' });

async function connectToWhatsApp() {
  if (reconnecting) return;
  reconnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: true,
      browser: ['7Gears Motors', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        lastQR      = qr;
        qrTimestamp = new Date().toISOString();
        clientReady = false;
        console.log('\n========================================');
        console.log(' Scan QR at /qr in your browser');
        console.log('========================================\n');
      }

      if (connection === 'close') {
        clientReady  = false;
        reconnecting = false;
        const code = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output?.statusCode
          : null;
        const loggedOut = code === DisconnectReason.loggedOut;
        console.warn(`⚠️  Disconnected (code ${code}). ${loggedOut ? 'Logged out — rescan QR.' : 'Reconnecting in 5s...'}`);
        if (!loggedOut) setTimeout(() => connectToWhatsApp(), 5000);
      }

      if (connection === 'open') {
        clientReady  = true;
        lastQR       = null;
        reconnecting = false;
        console.log(`\n✅ WhatsApp ready! Connected as: ${sock.user?.name} (${sock.user?.id})\n`);
      }
    });

  } catch (err) {
    reconnecting = false;
    console.error('⚠️  connectToWhatsApp failed:', err.message);
    setTimeout(() => connectToWhatsApp(), 10000);
  }
}

// ── REST API ───────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ok', service: '7Gears WhatsApp Gateway (Baileys)' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/status', (_req, res) => {
  res.json({
    ready: clientReady,
    qrPending: !!lastQR,
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
      <p>No QR needed — already authenticated.</p></body></html>`);
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
  <meta http-equiv="refresh" content="30">
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
    <p class="refresh">QR auto-refreshes every 30 sec · ${qrTimestamp}</p>
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

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔧 7GEARS MOTORS WhatsApp Gateway (Baileys)`);
  console.log(`   Status → GET  /status`);
  console.log(`   QR     → GET  /qr`);
  console.log(`   Send   → POST /send  { "to": "9876543210", "message": "..." }`);
  console.log(`   Port   → ${PORT}\n`);
  connectToWhatsApp();
});
