// Category service
/**
 * Bo'lim (papka) yaratish xizmati.
 * Ham "➕ Yangi bo'lim qo'shish" tugmasi, ham /addcat buyrug'i shu yerdan foydalanadi.
 */
const Q = require('../db/queries');
const { pendings, states } = require('../state');
const { safeDelete, removeMessage, flash } = require('../utils/helpers');
const { cancelKeyboard } = require('../keyboards');
const { clearView } = require('./view');

/**
 * Yangi bo'lim yaratadi.
 *  - pendingKey: agar berilsa, saqlanishi kutilayotgan xabar yangi bo'limga saqlanadi
 *  - cleanupIds: yaratilgach chatdan o'chiriladigan xabarlar
 * Muvaffaqiyatli bo'lsa true, nom noto'g'ri / band bo'lsa false qaytaradi.
 */
async function createCategoryFlow(ctx, rawName, { pendingKey = null, cleanupIds = [] } = {}) {
  const { telegram } = ctx;
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 40);

  if (!name) {
    await flash(telegram, chatId, "⚠️ Bo'lim nomi bo'sh bo'lmasligi kerak.");
    return false;
  }

  const exists = Q.cats.all(userId).some((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    await flash(telegram, chatId, `⚠️ "${name}" nomli bo'lim allaqachon bor. Boshqa nom yuboring.`);
    return false;
  }

  const catId = Number(Q.addCat.run(userId, name).lastInsertRowid);
  states.delete(userId);
  await Promise.all(cleanupIds.map((id) => safeDelete(telegram, chatId, id)));

  // Saqlanishi kutilayotgan xabar bo'lsa — o'sha yangi bo'limga saqlaymiz
  const pending = pendingKey ? pendings.get(pendingKey) : null;
  if (pending) {
    Q.saveItem(userId, catId, pending.item);
    pendings.delete(pendingKey);
    await Promise.all([
      removeMessage(telegram, chatId, pending.promptId),
      safeDelete(telegram, chatId, pending.origId),
    ]);
    await flash(telegram, chatId, `✅ ${name} ga muvaffaqiyatli saqlandi!`);
  } else {
    await flash(telegram, chatId, `✅ "${name}" bo'limi yaratildi! Endi menga xabar yuboring — saqlab beraman.`);
  }
  return true;
}

/** "Bo'lim nomini yuboring" oynasini chiqaradi (eski oynalar o'chiriladi). */
async function startNamePrompt(ctx) {
  const { telegram } = ctx;
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  const old = states.get(userId);
  if (old) await removeMessage(telegram, chatId, old.promptId);
  await clearView(telegram, chatId, userId);

  const msg = await ctx.reply("✏️ Yangi bo'lim nomini yuboring:", cancelKeyboard(0));
  states.set(userId, { pendingKey: null, promptId: msg.message_id });
}

module.exports = { createCategoryFlow, startNamePrompt };