// Configuration settings
/**
 * Loyiha sozlamalari va doimiy qiymatlar.
 * Maxfiy ma'lumotlar (token) .env faylidan o'qiladi.
 */
const path = require('path');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN topilmadi! ".env.example" faylidan ".env" nusxa oling va tokenni yozing.');
  process.exit(1);
}

module.exports = {
  BOT_TOKEN,

  // SQLite fayl yo'li (.env da DB_PATH berilmasa, loyiha papkasidagi archive.db)
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '..', 'archive.db'),

  // Pastki doimiy menyu tugmalari
  BTN_CATS: "📁 Mening bo'limlarim",
  BTN_ADD: "➕ Yangi bo'lim qo'shish",

  // Matnlar
  SELECT_TEXT: "📂 Qaysi bo'limga saqlaymiz?",

  // Vaqt sozlamalari (millisekund)
  FLASH_MS: 3000, // "✅ saqlandi" kabi qisqa xabarlar necha ms dan keyin o'chadi
  SEND_DELAY_MS: 60, // bo'lim ichidagi elementlar orasidagi pauza (Telegram limitlari uchun)
  PENDING_TTL_MS: 24 * 60 * 60 * 1000, // tanlanmagan xabar xotirada necha soat turadi

  // Matndan tashqari qo'llab-quvvatlanadigan turlar.
  // Eslatma: GIF xabarida ham `document` bo'ladi, shuning uchun 'animation' birinchi turadi.
  MEDIA_TYPES: ['animation', 'video', 'document', 'voice', 'audio', 'video_note', 'sticker'],
};