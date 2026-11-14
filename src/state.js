// State management
/**
 * Xotiradagi vaqtinchalik holat (bot qayta ishga tushsa tozalanadi).
 * Doimiy ma'lumotlar SQLite da saqlanadi — bu yerda faqat chat "oynalari".
 */
const { PENDING_TTL_MS } = require('./config');

// Bo'lim tanlashni kutayotgan xabarlar:
//   "userId:xabarId" -> { item, promptId, origId, ts }
const pendings = new Map();

// Bo'lim nomini yozishni kutish holati:
//   userId -> { pendingKey, promptId }
const states = new Map();

// Foydalanuvchi hozir ko'rib turgan "oyna" (bot chiqargan xabarlar):
//   userId -> { listId, navId, catId, name, items: Map(itemId -> messageId) }
const views = new Map();

/** Eskirgan (tanlanmay qolgan) xabarlarni vaqti-vaqti bilan xotiradan tozalaydi. */
function startPendingCleanup() {
  setInterval(() => {
    const limit = Date.now() - PENDING_TTL_MS;
    for (const [key, value] of pendings) {
      if (value.ts < limit) pendings.delete(key);
    }
  }, 60 * 60 * 1000).unref();
}

module.exports = { pendings, states, views, startPendingCleanup };