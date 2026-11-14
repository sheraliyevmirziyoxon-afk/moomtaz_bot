// Menu handlers
/**
 * Pastki doimiy menyu tugmalari:
 *   📁 Mening bo'limlarim  |  ➕ Yangi bo'lim qo'shish
 */
const { BTN_CATS, BTN_ADD } = require('../config');
const { states } = require('../state');
const { safeDelete, removeMessage } = require('../utils/helpers');
const { showCategoryList } = require('../services/view');
const { startNamePrompt } = require('../services/category');

module.exports = function registerMenu(bot) {
  bot.hears(BTN_ADD, async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    await safeDelete(ctx.telegram, ctx.chat.id, ctx.message.message_id); // bosilgan tugma yozuvi
    await startNamePrompt(ctx);
  });

  bot.hears(BTN_CATS, async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const { telegram } = ctx;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    await safeDelete(telegram, chatId, ctx.message.message_id); // bosilgan tugma yozuvi

    const old = states.get(userId);
    if (old) await removeMessage(telegram, chatId, old.promptId);
    states.delete(userId);

    await showCategoryList(telegram, chatId, userId); // ichida eski oynalar tozalanadi
  });
};