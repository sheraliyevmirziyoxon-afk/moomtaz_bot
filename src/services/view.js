// View service
/**
 * "Oyna" (view) xizmati — chatni toza saqlash uchun.
 *
 * Bot foydalanuvchiga ko'rsatgan hamma narsa (bo'limlar ro'yxati, bo'lim ichidagi
 * elementlar, navigatsiya xabari) bitta "oyna" sifatida kuzatiladi. Yangi oyna
 * ochilganda yoki foydalanuvchi boshqa harakat qilganda eskisi to'liq o'chiriladi.
 */
const { SEND_DELAY_MS } = require('../config');
const Q = require('../db/queries');
const { views } = require('../state');
const { sleep, safeDelete } = require('../utils/helpers');
const { sendItem } = require('../utils/message');
const { categoryListKeyboard, emptyListKeyboard, navKeyboard } = require('../keyboards');

const navText = (name, count) =>
  count ? `📂 ${name} — ${count} ta element` : `📂 ${name}\n\n📭 Bu bo'lim bo'sh.`;

/** Foydalanuvchi ko'rib turgan hamma xabarlarni o'chiradi. */
async function clearView(telegram, chatId, userId) {
  const view = views.get(userId);
  if (!view) return;

  // Avval xaritadan olib tashlaymiz — davom etayotgan yuborishlar buni sezib to'xtaydi
  views.delete(userId);

  const ids = [view.listId, view.navId, ...view.items.values()].filter(Boolean);
  await Promise.all(ids.map((id) => safeDelete(telegram, chatId, id)));
}

/** Bo'limlar ro'yxatini chiqaradi (oldingi hamma narsa tozalanadi). */
async function showCategoryList(telegram, chatId, userId) {
  await clearView(telegram, chatId, userId);

  const cats = Q.cats.all(userId);
  let msg;

  if (!cats.length) {
    msg = await telegram.sendMessage(
      chatId,
      "📭 Hozircha bo'limlaringiz yo'q.\n\"➕ Yangi bo'lim qo'shish\" tugmasini bosing.",
      emptyListKeyboard()
    );
  } else {
    msg = await telegram.sendMessage(chatId, "📁 Sizning bo'limlaringiz:", categoryListKeyboard(cats));
  }

  views.set(userId, { listId: msg.message_id, navId: null, catId: null, name: null, items: new Map() });
}

/** Bo'lim ichini chiqaradi: elementlar + eng pastda navigatsiya xabari. */
async function showCategory(telegram, chatId, userId, cat) {
  await clearView(telegram, chatId, userId);

  const view = { listId: null, navId: null, catId: cat.id, name: cat.name, items: new Map() };
  views.set(userId, view);
  const alive = () => views.get(userId) === view;

  const items = Q.items.all(cat.id, userId);

  for (const it of items) {
    if (!alive()) return;
    try {
      const msg = await sendItem(telegram, chatId, it);
      if (!alive()) {
        // Foydalanuvchi shu orada boshqa joyga o'tib ketdi — yangi chiqqanini ham o'chiramiz
        await safeDelete(telegram, chatId, msg.message_id);
        return;
      }
      view.items.set(it.id, msg.message_id);
    } catch (e) {
      console.error(`Element #${it.id} yuborilmadi:`, e.message);
    }
    await sleep(SEND_DELAY_MS);
  }
  if (!alive()) return;

  const nav = await telegram.sendMessage(chatId, navText(cat.name, items.length), navKeyboard());
  if (!alive()) {
    await safeDelete(telegram, chatId, nav.message_id);
    return;
  }
  view.navId = nav.message_id;
}

module.exports = { clearView, showCategoryList, showCategory };