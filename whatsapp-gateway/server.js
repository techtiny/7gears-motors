const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app  = express();
const PORT = process.env.PORT || 9091;

app.use(express.json());

let clientReady = false;
let lastQR      = null;
let qrTimestamp = null;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// ── WhatsApp events ────────────────────────────────────────────
client.on('qr', (qr) => {
  lastQR      = qr;
  qrTimestamp = new Date().toISOString();
  console.log('\n\n========================================');
  console.log(' Scan this QR code with WhatsApp on your');
  console.log(' phone: Open WhatsApp → ⋮ → Linked Devices');
  console.log(' Or visit /qr in a browser to scan visually');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\nWaiting for scan...\n');
});

client.on('authenticated', () => {
  lastQR = null;
  console.log('✅ WhatsApp authenticated — session saved');
});

client.on('ready', () => {
  clientReady = true;
  lastQR = null;
  const info = client.info;
  console.log(`\n✅ WhatsApp ready! Connected as: ${info.pushname} (${info.wid.user})`);
  console.log(`🚀 Gateway running at http://localhost:${PORT}\n`);
});

client.on('disconnected', (reason) => {
  clientReady = false;
  console.warn('⚠️  WhatsApp disconnected:', reason);
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
});

// ── REST API ───────────────────────────────────────────────────
app.get('/status', (_req, res) => {
  res.json({
    ready: clientReady,
    qrPending: !!lastQR,
    info: clientReady ? { name: client.info.pushname, number: client.info.wid.user } : null,
  });
});

// Returns raw QR string as JSON (for programmatic use)
app.get('/qr.json', (_req, res) => {
  if (clientReady) return res.json({ status: 'connected' });
  if (!lastQR)     return res.json({ status: 'initializing' });
  res.json({ status: 'pending', qr: lastQR, generatedAt: qrTimestamp });
});

// Serves a browser page — visit this URL to scan the QR visually
app.get('/qr', (_req, res) => {
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
      <meta http-equiv="refresh" content="5">
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#fffbeb;}
      .badge{background:#f59e0b;color:white;padding:14px 32px;border-radius:12px;font-size:18px;font-weight:700;}
      p{color:#92400e;margin-top:12px;font-size:14px;}</style></head>
      <body><div class="badge">⏳ Initializing WhatsApp...</div>
      <p>Page auto-refreshes every 5 seconds. QR will appear shortly.</p></body></html>`);
  }

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>7GEARS MOTORS — Scan WhatsApp QR</title>
  <meta http-equiv="refresh" content="30">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #fff7ed; min-height: 100vh;
           display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .card { background: white; border-radius: 20px; padding: 36px 40px; text-align: center;
            box-shadow: 0 8px 40px rgba(0,0,0,0.12); max-width: 380px; width: 100%; }
    h1 { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .sub { font-size: 13px; color: #9ca3af; margin-bottom: 24px; }
    #qrcode { display: flex; justify-content: center; margin-bottom: 24px; }
    #qrcode img, #qrcode canvas { border-radius: 12px; border: 3px solid #f97316; }
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

    <div id="qrcode"></div>

    <div class="steps">
      <p>1. Open <strong>WhatsApp</strong> on your phone</p>
      <p>2. Tap <strong>⋮ Menu → Linked Devices</strong></p>
      <p>3. Tap <strong>Link a Device</strong></p>
      <p>4. <strong>Scan this QR code</strong></p>
    </div>

    <p class="refresh">QR auto-refreshes every 30 sec · Generated at ${qrTimestamp}</p>
  </div>

  <script>
    new QRCode(document.getElementById('qrcode'), {
      text: ${JSON.stringify(lastQR)},
      width: 260,
      height: 260,
      colorDark: '#111827',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  </script>
</body>
</html>`);
});

app.post('/send', async (req, res) => {
  const { to, message } = req.body;

  if (!clientReady) {
    return res.status(503).json({ error: 'WhatsApp not connected. Scan QR code first.' });
  }
  if (!to || !message) {
    return res.status(400).json({ error: 'to and message are required' });
  }

  try {
    const phone  = normalizePhone(to);
    const chatId = `${phone}@c.us`;
    const result = await client.sendMessage(chatId, message);
    console.log(`📱 Sent to +${phone} | MsgID: ${result.id.id}`);
    res.json({ success: true, messageId: result.id.id, to: phone });
  } catch (err) {
    console.error('Send failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Bulk send endpoint
app.post('/send-bulk', async (req, res) => {
  const { messages } = req.body; // [{ to, message }]
  if (!clientReady) return res.status(503).json({ error: 'WhatsApp not connected' });

  const results = [];
  for (const item of messages) {
    try {
      const phone  = normalizePhone(item.to);
      const result = await client.sendMessage(`${phone}@c.us`, item.message);
      results.push({ to: phone, success: true, messageId: result.id.id });
      await delay(500); // avoid spam detection
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
  console.log(`\n🔧 7GEARS MOTORS WhatsApp Gateway`);
  console.log(`   QR Page   → GET  /qr          (open in browser to scan)`);
  console.log(`   QR JSON   → GET  /qr.json     (raw QR data)`);
  console.log(`   Status    → GET  /status`);
  console.log(`   Send      → POST /send  { "to": "9876543210", "message": "..." }`);
  console.log(`   Bulk Send → POST /send-bulk`);
  console.log('\n⏳ Initializing WhatsApp client...\n');
});

client.initialize();
