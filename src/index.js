// Main entry point
/**
 * Kirish fayli: botni yaratadi, handlerlarni ulaydi va ishga tushiradi.
 *   npm start
 */
const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');
const db = require('./db/database');
const { startPendingCleanup } = require('./state');
const registerHandlers = require('./handlers');

const bot = new Telegraf(BOT_TOKEN);

registerHandlers(bot);
startPendingCleanup();

// Handler ichidagi kutilmagan xatolar botni to'xtatib qo'ymasin
bot.catch((err, ctx) => {
  console.error(`Xato (${ctx.updateType}):`, err);
});

// Telegramdagi "/" menyusi
bot.telegram
  .setMyCommands([
    { command: 'start', description: 'Botni boshlash' },
    { command: 'addcat', description: "Yangi bo'lim: /addcat <nom>" },
    { command: 'help', description: 'Yordam' },
  ])
  .catch(() => {});

bot.launch({ dropPendingUpdates: true }).catch((e) => {
  console.error("Botni ishga tushirib bo'lmadi:", e);
  process.exit(1);
});

bot.telegram
  .getMe()
  .then((me) => console.log(`🚀 Bot ishga tushdi: @${me.username}`))
  .catch(() => {});

// To'g'ri to'xtatish (Ctrl+C yoki pm2 stop)
const shutdown = (signal) => {
  bot.stop(signal);
  db.close();
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));