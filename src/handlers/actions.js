// Action (callback) handlers
/**
 * Inline tugmalar bosilganda ishlaydigan handlerlar (callback_data formatlari
 * src/keyboards.js faylining boshida yozilgan).
 */
const { SELECT_TEXT } = require('../config');
const Q = require('../db/queries');
const { pendings, states } = require('../state');
const { safeDelete, removeMessage, flash } = require('../utils/helpers');
const { selectionKeyboard, cancelKeyboard } = require('../keyboards');
const { clearView, showCategoryList, showCategory } = require('../services/view');

module.exports = function registerActions(bot) {
  // ── s:<bo'limId>:<xabarId> — bo'limni tanlab saqlash (tanlash xabari DARHOL o'chadi)
  bot.action(/^s:(\d+):(\d+)$/, async (ctx) => {
    const { telegram } = ctx;
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const promptMsgId = ctx.callbackQuery.message.message_id;
    const catId = Number(ctx.match[1]);
    const origId = Number(ctx.match[2]);
    const key = `${userId}:${origId}`;

    const pending = pendings.get(key);
    if (!pending) {
      ctx.answerCbQuery("Bu so'rov eskirgan. Xabarni qaytadan yuboring.", { show_alert: true }).catch(() => {});
      return removeMessage(telegram, chatId, promptMsgId);
    }

    const cat = Q.getCat.get(catId, userId);
    if (!cat) {
      return ctx.answerCbQuery("Bunday bo'lim topilmadi.", { show_alert: true }).catch(() => {});
    }

    // Ikki marta bosilishdan himoya: avval pending'ni olib tashlaymiz
    pendings.delete(key);
    Q.saveItem(userId, cat.id, pending.item);

    ctx.answerCbQuery().catch(() => {});
    await Promise.all([
      removeMessage(telegram, chatId, promptMsgId), // "Qaysi bo'limga saqlaymiz?" + tugmalar
      safeDelete(telegram, chatId, origId), // foydalanuvchining asl xabari
    ]);
    await flash(telegram, chatId, `✅ ${cat.name} ga muvaffaqiyatli saqlandi!`);
  });

  // ── n:<xabarId> — tanlash paytida "➕ Yangi bo'lim" bosildi
  bot.action(/^n:(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const origId = Number(ctx.match[1]);
    const key = `${userId}:${origId}`;
    const promptMsgId = ctx.callbackQuery.message.message_id;

    if (!pendings.has(key)) {
      ctx.answerCbQuery("Bu so'rov eskirgan.", { show_alert: true }).catch(() => {});
      return removeMessage(ctx.telegram, chatId, promptMsgId);
    }
    ctx.answerCbQuery().catch(() => {});

    // Boshqa ochiq nom so'rash oynasi qolgan bo'lsa — o'chiramiz
    const old = states.get(userId);
    if (old && old.promptId !== promptMsgId) await removeMessage(ctx.telegram, chatId, old.promptId);

    states.set(userId, { pendingKey: key, promptId: promptMsgId });
    await ctx
      .editMessageText("✏️ Yangi bo'lim nomini yuboring (xabaringiz shu bo'limga saqlanadi):", cancelKeyboard(origId))
      .catch(() => {});
  });

  // ── x:<xabarId> — bekor qilish
  bot.action(/^x:(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const origId = Number(ctx.match[1]);
    ctx.answerCbQuery().catch(() => {});
    states.delete(userId);

    if (origId !== 0 && pendings.has(`${userId}:${origId}`)) {
      // Saqlash kutayotgan xabar bor — tanlash oynasini qaytaramiz (ma'lumot yo'qolmaydi)
      return ctx.editMessageText(SELECT_TEXT, selectionKeyboard(userId, origId)).catch(() => {});
    }
    return removeMessage(ctx.telegram, chatId, ctx.callbackQuery.message.message_id);
  });

  // ── c:<bo'limId> — bo'limni ochish (ro'yxat o'chadi, faqat shu bo'lim qoladi)
  bot.action(/^c:(\d+)$/, async (ctx) => {
    const { telegram } = ctx;
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const clickedMsgId = ctx.callbackQuery.message.message_id;

    const cat = Q.getCat.get(Number(ctx.match[1]), userId);
    ctx.answerCbQuery().catch(() => {});

    // Bosilgan ro'yxat xabari har holda o'chadi (eskirgan bo'lsa ham)
    await safeDelete(telegram, chatId, clickedMsgId);
    if (!cat) {
      await clearView(telegram, chatId, userId);
      return flash(telegram, chatId, "⚠️ Bo'lim topilmadi.");
    }
    await showCategory(telegram, chatId, userId, cat); // ichida eski oyna tozalanadi
  });

  // ── b — "⬅️ Bo'limlar": bo'lim ichidan ro'yxatga qaytish
  bot.action('b', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    await safeDelete(ctx.telegram, ctx.chat.id, ctx.callbackQuery.message.message_id);
    await showCategoryList(ctx.telegram, ctx.chat.id, ctx.from.id);
  });

  // ── z — "❌ Yopish": ko'rilayotgan hamma narsani tozalash
  bot.action('z', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    await safeDelete(ctx.telegram, ctx.chat.id, ctx.callbackQuery.message.message_id);
    await clearView(ctx.telegram, ctx.chat.id, ctx.from.id);
  });
};