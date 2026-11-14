// Handlers exporter
/**
 * Barcha handlerlarni botga ulaydi.
 * TARTIB MUHIM: buyruqlar va menyu tugmalari umumiy xabar handleridan OLDIN turishi kerak.
 */
const registerCommands = require('./commands');
const registerMenu = require('./menu');
const registerMessages = require('./messages');
const registerActions = require('./actions');

module.exports = function registerHandlers(bot) {
  registerCommands(bot); // /start, /help, /addcat
  registerMenu(bot); // pastki menyu tugmalari
  registerMessages(bot); // matn, rasm, video, hujjat, ovoz ...
  registerActions(bot); // inline tugmalar
};