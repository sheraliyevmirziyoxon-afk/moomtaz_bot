// SQL queries
/**
 * Barcha SQL so'rovlar bir joyda.
 * Har bir so'rov user_id bo'yicha filtrlanadi — foydalanuvchi faqat o'z ma'lumotini ko'radi.
 */
const db = require('./database');

const cats = db.prepare(`
  SELECT c.id, c.name,
         (SELECT COUNT(*) FROM items i WHERE i.category_id = c.id) AS cnt
  FROM categories c
  WHERE c.user_id = ?
  ORDER BY c.id
`);

const getCat = db.prepare('SELECT id, name FROM categories WHERE id = ? AND user_id = ?');

const addCat = db.prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)');

const addItem = db.prepare(`
  INSERT INTO items (user_id, category_id, type, file_id, caption, text_content)
  VALUES (@user_id, @category_id, @type, @file_id, @caption, @text_content)
`);

const items = db.prepare('SELECT * FROM items WHERE category_id = ? AND user_id = ? ORDER BY id');

/** Elementni bo'limga saqlash. item = { type, file_id, caption, text_content } */
function saveItem(userId, categoryId, item) {
  addItem.run({ user_id: userId, category_id: categoryId, ...item });
}

module.exports = { cats, getCat, addCat, items, saveItem };