// Message formatters
/**
 * Telegram xabari bilan ishlash:
 *  - extractItem: kelgan xabardan saqlanadigan ma'lumotni ajratib olish
 *  - sendItem:    saqlangan ma'lumotni chatga qayta yuborish
 */
const { MEDIA_TYPES } = require('../config');

/**
 * Xabardan { type, file_id, caption, text_content } ni ajratadi.
 * Qo'llab-quvvatlanmaydigan tur bo'lsa null qaytaradi.
 */
function extractItem(m) {
  if (typeof m.text === 'string') {
    return { type: 'text', file_id: null, caption: null, text_content: m.text };
  }

  const caption = m.caption || null;

  if (m.photo) {
    // Rasm bir nechta o'lchamda keladi — eng kattasi oxirgisi
    return { type: 'photo', file_id: m.photo[m.photo.length - 1].file_id, caption, text_content: null };
  }

  for (const type of MEDIA_TYPES) {
    if (m[type]) return { type, file_id: m[type].file_id, caption, text_content: null };
  }
  return null;
}

/** Saqlangan elementni chatga chiqaradi (tugmasiz, toza holda). */
async function sendItem(telegram, chatId, it) {
  const withCap = it.caption ? { caption: it.caption } : {};

  switch (it.type) {
    case 'text':
      return telegram.sendMessage(chatId, it.text_content);
    case 'photo':
      return telegram.sendPhoto(chatId, it.file_id, withCap);
    case 'video':
      return telegram.sendVideo(chatId, it.file_id, withCap);
    case 'animation':
      return telegram.sendAnimation(chatId, it.file_id, withCap);
    case 'voice':
      return telegram.sendVoice(chatId, it.file_id, withCap);
    case 'audio':
      return telegram.sendAudio(chatId, it.file_id, withCap);
    case 'video_note':
      return telegram.sendVideoNote(chatId, it.file_id);
    case 'sticker':
      return telegram.sendSticker(chatId, it.file_id);
    default:
      return telegram.sendDocument(chatId, it.file_id, withCap);
  }
}

module.exports = { extractItem, sendItem };