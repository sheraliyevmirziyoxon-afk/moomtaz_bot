/**
 * Foydalanuvchi yuborgan oddiy xabarlar (matn, rasm, video, hujjat, ovoz va h.k.).
 *
 * Ikki holat bor:
 *  1) Bot bo'lim nomini kutyapti  → kelgan matn yangi bo'lim nomi bo'ladi
 *  2) Oddiy holat                 → "Qaysi bo'limga saqlaymiz?" deb so'raymiz
 */
const { SELECT_TEXT } = require('../config');
const { pendings, states } = require('../state');
const { safeDelete, flash } = require('../utils/helpers');
const { extractItem } = require('../utils/message');
const { selectionKeyboard } = require('../keyboards');
const { clearView } = require('../services/view');
const { createCategoryFlow } = require('../services/category');

const CONTENT_TYPES = ['text', 'photo', 'video', 'document', 'voice', 'audio', 'video_note', 'animation', 'sticker'];

module.exports = function registerMessages(bot) {
  bot.on(CONTENT_TYPES, async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const m = ctx.message;
    if (typeof m.text === 'string' && m.text.startsWith('/')) return; // noma'lum buyruqlar

    const { telegram } = ctx;
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const st = states.get(userId);

    // 1) Foydalanuvchi bo'lim nomini yozyapti
    if (st) {
      if (typeof m.text !== 'string') {
        await safeDelete(telegram, chatId, m.message_id);
        return flash(telegram, chatId, "⚠️ Iltimos, bo'lim nomini matn ko'rinishida yuboring.");
      }
      const ok = await createCategoryFlow(ctx, m.text, {
        pendingKey: st.pendingKey,
        cleanupIds: [st.promptId, m.message_id],
      });
      if (!ok) await safeDelete(telegram, chatId, m.message_id); // noto'g'ri nom ham chatda qolmasin
      return;
    }

    // 2) Oddiy xabar — avval eski ko'rinishlarni tozalaymiz, so'ng qaysi bo'limga saqlashni so'raymiz
    const item = extractItem(m);
    if (!item) return;

    await clearView(telegram, chatId, userId);

    const prompt = await ctx.reply(SELECT_TEXT, {
      reply_parameters: { message_id: m.message_id, allow_sending_without_reply: true },
      ...selectionKeyboard(userId, m.message_id),
    });

    pendings.set(`${userId}:${m.message_id}`, {
      item,
      promptId: prompt.message_id,
      origId: m.message_id,
      ts: Date.now(),
    });
  });
};