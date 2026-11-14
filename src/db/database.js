// Database connection
/**
 * SQLite ulanishi va jadvallarni yaratish.
 *
 * categories — foydalanuvchi bo'limlari (papkalari)
 * items      — bo'limlarga saqlangan xabarlar (matn yoki media file_id)
 */
const Database = require('better-sqlite3');
const { DB_PATH } = require('../config');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    category_id  INTEGER NOT NULL,
    type         TEXT    NOT NULL,   -- text, photo, video, document, voice, ...
    file_id      TEXT,               -- media uchun Telegram file_id
    caption      TEXT,               -- media izohi
    text_content TEXT,               -- oddiy matn uchun
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_cat_user ON categories(user_id);
  CREATE INDEX IF NOT EXISTS idx_item_cat ON items(category_id);
`);

module.exports = db;