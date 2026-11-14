// Helper functions
/**
 * Umumiy yordamchi funksiyalar: kutish, bo'lish, xabarlarni xavfsiz o'chirish.
 */
const { FLASH_MS } = require('../config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Massivni n tadan qilib bo'laklarga ajratadi (tugmalarni qatorlarga terish uchun). */
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Xabarni jimgina o'chirish (xato bo'lsa e'tibor bermaydi). */
const safeDelete = (telegram, chatId, msgId) =>
  msgId ? telegram.deleteMessage(chatId, msgId).catch(() => {}) : Promise.resolve();

/**
 * Bot xabarini ishonchli o'chirish.
 * O'chmasa (masalan 48 soatdan eski), kamida tugmalarini olib tashlab,
 * matnini "✅" ga almashtiradi.
 */
async function removeMessage(telegram, chatId, msgId) {
  if (!msgId) return;
  try {
    await telegram.deleteMessage(chatId, msgId);
  } catch (e) {
    try {
      await telegram.editMessageText(chatId, msgId, undefined, '✅');
    } catch (_) {
      /* xabar allaqachon yo'q bo'lishi mumkin */
    }
  }
}

/** Qisqa xabar chiqarib, FLASH_MS dan keyin avtomatik o'chiradi. */
async function flash(telegram, chatId, text) {
  try {
    const msg = await telegram.sendMessage(chatId, text);
    setTimeout(() => safeDelete(telegram, chatId, msg.message_id), FLASH_MS);
  } catch (e) {
    console.error('flash xato:', e.message);
  }
}

module.exports = { sleep, chunk, safeDelete, removeMessage, flash };