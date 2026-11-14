// Telegram keyboards
/**
 * Barcha klaviaturalar (pastki menyu va inline tugmalar) bir joyda.
 *
 * Inline tugmalarning callback_data formatlari:
 *   s:<bo'limId>:<xabarId>  — xabarni shu bo'limga saqlash
 *   n:<xabarId>             — tanlash paytida "Yangi bo'lim"
 *   x:<xabarId>             — bekor qilish (0 — saqlanadigan xabar yo'q)
 *   c:<bo'limId>            — bo'limni ochish
 *   b                       — bo'limlar ro'yxatiga qaytish
 *   z                       — yopish (hammasini tozalash)
 */
const { Markup } = require('telegraf');
const { BTN_CATS, BTN_ADD } = require('./config');
const Q = require('./db/queries');
const { chunk } = require('./utils/helpers');

/** Pastda doim turadigan asosiy menyu. */
const mainMenu = Markup.keyboard([[BTN_CATS, BTN_ADD]]).resize();

const closeButton = () => Markup.button.callback('❌ Yopish', 'z');

/** "Qaysi bo'limga saqlaymiz?" — foydalanuvchi bo'limlari + "Yangi bo'lim". */
function selectionKeyboard(userId, origId) {
  const cats = Q.cats.all(userId);
  const buttons = cats.map((c) => Markup.button.callback(`📂 ${c.name}`, `s:${c.id}:${origId}`));
  const rows = chunk(buttons, 2);
  rows.push([Markup.button.callback("➕ Yangi bo'lim", `n:${origId}`)]);
  return Markup.inlineKeyboard(rows);
}

/** "Mening bo'limlarim" ro'yxati. */
function categoryListKeyboard(cats) {
  const buttons = cats.map((c) => Markup.button.callback(`📂 ${c.name} (${c.cnt})`, `c:${c.id}`));
  return Markup.inlineKeyboard([...chunk(buttons, 2), [closeButton()]]);
}

/** Bo'limlar yo'q bo'lganda — faqat "Yopish". */
const emptyListKeyboard = () => Markup.inlineKeyboard([[closeButton()]]);

/** Bo'lim ichida eng pastda turadigan navigatsiya. */
const navKeyboard = () =>
  Markup.inlineKeyboard([[Markup.button.callback("⬅️ Bo'limlar", 'b'), closeButton()]]);

/** Bo'lim nomini so'rash oynasidagi "Bekor qilish". */
const cancelKeyboard = (origId = 0) =>
  Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', `x:${origId}`)]]);

module.exports = {
  mainMenu,
  selectionKeyboard,
  categoryListKeyboard,
  emptyListKeyboard,
  navKeyboard,
  cancelKeyboard,
};