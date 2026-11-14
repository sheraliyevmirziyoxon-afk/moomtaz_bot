// Command handlers
/**
 * Buyruqlar: /start, /help, /addcat <nom>
 */
const { states } = require('../state');
const { safeDelete, removeMessage } = require('../utils/helpers');
const { mainMenu } = require('../keyboards');
const { clearView } = require('../services/view');
const { createCategoryFlow, startNamePrompt } = require('../services/category');

module.exports = function registerCommands(bot) {
  bot.start(async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const { telegram } = ctx;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    const old = states.get(userId);
    if (old) await removeMessage(telegram, chatId, old.promptId);
    states.delete(userId);
    await clearView(telegram, chatId, userId);
    await safeDelete(telegram, chatId, ctx.message.message_id);

    return ctx.reply(
      '👋 Salom! Men sizning shaxsiy arxiv botingizman.\n\n' +
        "📝 Menga matn, rasm, video, hujjat yoki ovozli xabar yuboring — qaysi bo'limga saqlashni o'zingiz tanlaysiz.\n" +
        "📁 Saqlanganlarni \"Mening bo'limlarim\" orqali ko'rasiz.\n\n" +
        "➕ Boshlash uchun yangi bo'lim qo'shing yoki /addcat <nom> yozing.",
      mainMenu
    );
  });

  bot.help((ctx) =>
    ctx.reply(
      'ℹ️ Yordam:\n' +
        "• /addcat <nom> — yangi bo'lim ochish\n" +
        "• Istalgan xabar yuboring — bo'limni tanlab saqlang\n" +
        "• 📁 Mening bo'limlarim — saqlanganlarni ko'rish",
      mainMenu
    )
  );

  bot.command('addcat', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const { telegram } = ctx;
    const chatId = ctx.chat.id;
    const name = ctx.message.text.replace(/^\/addcat(@\w+)?\s*/i, '');

    await safeDelete(telegram, chatId, ctx.message.message_id);
    if (!name.trim()) return startNamePrompt(ctx);

    await clearView(telegram, chatId, ctx.from.id);
    await createCategoryFlow(ctx, name);
  });
};