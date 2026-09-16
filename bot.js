/**
 * Bot Telegram Serbaguna - Node.js (Telegraf)
 * ============================================
 * Fitur:
 *  - /start   -> menu utama (inline button)
 *  - /help    -> daftar perintah
 *  - /quote   -> kutipan acak
 *  - /joke    -> lelucon acak
 *  - /sticker -> ubah foto (reply ke foto) jadi stiker
 *  - /tebak   -> game tebak angka (1-100)
 *  - /stats   -> jumlah pesan yang sudah kamu kirim (disimpan di memori)
 *  - Auto-reply untuk kata kunci tertentu (halo, makasih, dll)
 *
 * NOTE: Data disimpan di memori (RAM) -> akan hilang saat bot di-restart.
 * Kalau butuh data permanen, tinggal bilang, nanti saya tambahkan database (SQLite).
 *
 * Cara pakai:
 *  1. Buat bot lewat @BotFather di Telegram, dapatkan TOKEN.
 *  2. npm init -y
 *  3. npm install telegraf sharp node-fetch
 *  4. Ganti "PASTE_YOUR_TOKEN_HERE" di bawah dengan token botmu.
 *  5. node bot.js
 */

const { Telegraf, Markup } = require("telegraf");
const sharp = require("sharp");
const fetch = require("node-fetch");

const BOT_TOKEN = "8616635222:AAHJ9Z8umuAE_rfW2UCEEB_t-bW1MiJiEXU";
const bot = new Telegraf(BOT_TOKEN);

// ------------------------------
// "Database" sederhana di memori
// ------------------------------
const userStats = {}; // { userId: { name, messageCount } }
const guessGame = {}; // { userId: { target, tries } }

function trackUser(ctx) {
  const id = ctx.from.id;
  const name = ctx.from.first_name || "User";
  if (!userStats[id]) userStats[id] = { name, messageCount: 0 };
  userStats[id].messageCount++;
}

// ------------------------------
// Data konten (quotes & jokes)
// ------------------------------
const quotes = [
  "Hidup itu seperti sepeda, agar tetap seimbang kamu harus terus bergerak.",
  "Kesuksesan adalah kumpulan dari usaha-usaha kecil yang diulang setiap hari.",
  "Jangan takut gagal, takutlah tidak pernah mencoba.",
  "Waktu terbaik untuk menanam pohon adalah 20 tahun lalu. Waktu terbaik kedua adalah sekarang.",
  "Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih bijaksana.",
];

const jokes = [
  "Kenapa komputer sering kedinginan? Karena banyak jendelanya kebuka (windows).",
  "Kenapa programmer suka gelap? Karena mereka takut bug muncul di terang.",
  "Apa bedanya kamu sama update software? Update aja ditunggu, kamu enggak.",
  "Kenapa laptop gak pernah sakit hati? Karena dia punya banyak folder rahasia.",
];

// ------------------------------
// Menu utama
// ------------------------------
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("💬 Quote", "menu_quote"), Markup.button.callback("😂 Joke", "menu_joke")],
    [Markup.button.callback("🎯 Tebak Angka", "menu_tebak"), Markup.button.callback("📊 Statistik", "menu_stats")],
    [Markup.button.callback("❓ Bantuan", "menu_help")],
  ]);
}

// ------------------------------
// Commands
// ------------------------------
bot.start((ctx) => {
  trackUser(ctx);
  ctx.reply(
    `Halo ${ctx.from.first_name}! 👋\nAku bot serbaguna, pilih fitur di bawah ini atau ketik /help.`,
    mainMenu()
  );
});

bot.help((ctx) => {
  ctx.reply(
    "📋 Daftar perintah:\n" +
      "/start - menu utama\n" +
      "/quote - kutipan acak\n" +
      "/joke - lelucon acak\n" +
      "/sticker - reply ke foto lalu ketik ini untuk dijadikan stiker\n" +
      "/tebak - main tebak angka 1-100\n" +
      "/stats - lihat jumlah pesanmu"
  );
});

bot.command("quote", (ctx) => {
  trackUser(ctx);
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💬 "${q}"`);
});

bot.command("joke", (ctx) => {
  trackUser(ctx);
  const j = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(`😂 ${j}`);
});

bot.command("stats", (ctx) => {
  trackUser(ctx);
  const data = userStats[ctx.from.id];
  ctx.reply(`📊 Kamu sudah mengirim ${data.messageCount} pesan sejak bot berjalan.`);
});

// Game tebak angka
bot.command("tebak", (ctx) => {
  trackUser(ctx);
  const target = Math.floor(Math.random() * 100) + 1;
  guessGame[ctx.from.id] = { target, tries: 0 };
  ctx.reply("🎯 Aku sudah memilih angka 1-100. Coba tebak! Ketik angkanya langsung di chat.");
});

// Sticker maker: reply ke foto dengan /sticker
bot.command("sticker", async (ctx) => {
  trackUser(ctx);
  const replied = ctx.message.reply_to_message;
  if (!replied || !replied.photo) {
    return ctx.reply("⚠️ Reply ke sebuah foto dulu, baru ketik /sticker.");
  }
  try {
    const fileId = replied.photo[replied.photo.length - 1].file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());

    const webp = await sharp(buffer)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp()
      .toBuffer();

    await ctx.replyWithSticker({ source: webp });
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal membuat stiker, coba lagi.");
  }
});

// ------------------------------
// Inline button handlers (menu)
// ------------------------------
bot.action("menu_quote", (ctx) => {
  ctx.answerCbQuery();
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💬 "${q}"`);
});

bot.action("menu_joke", (ctx) => {
  ctx.answerCbQuery();
  const j = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(`😂 ${j}`);
});

bot.action("menu_tebak", (ctx) => {
  ctx.answerCbQuery();
  const target = Math.floor(Math.random() * 100) + 1;
  guessGame[ctx.from.id] = { target, tries: 0 };
  ctx.reply("🎯 Aku sudah memilih angka 1-100. Coba tebak! Ketik angkanya langsung di chat.");
});

bot.action("menu_stats", (ctx) => {
  ctx.answerCbQuery();
  const data = userStats[ctx.from.id] || { messageCount: 0 };
  ctx.reply(`📊 Kamu sudah mengirim ${data.messageCount} pesan sejak bot berjalan.`);
});

bot.action("menu_help", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    "📋 Daftar perintah:\n/quote /joke /sticker /tebak /stats\nAtau pakai menu tombol di /start."
  );
});

// ------------------------------
// Pesan teks biasa (auto-reply + game tebak angka + counter)
// ------------------------------
bot.on("text", (ctx) => {
  trackUser(ctx);
  const text = ctx.message.text.toLowerCase().trim();

  // Cek kalau lagi main tebak angka
  const game = guessGame[ctx.from.id];
  if (game && /^\d+$/.test(text)) {
    const guess = parseInt(text, 10);
    game.tries++;
    if (guess === game.target) {
      ctx.reply(`🎉 Benar! Angkanya ${game.target}. Kamu menebak dalam ${game.tries} kali percobaan.`);
      delete guessGame[ctx.from.id];
    } else if (guess < game.target) {
      ctx.reply("⬆️ Lebih besar dari itu!");
    } else {
      ctx.reply("⬇️ Lebih kecil dari itu!");
    }
    return;
  }

  // Auto-reply sederhana berdasarkan kata kunci
  if (text.includes("halo") || text.includes("hai")) {
    ctx.reply(`Halo juga, ${ctx.from.first_name}! 👋`);
  } else if (text.includes("makasih") || text.includes("terima kasih")) {
    ctx.reply("Sama-sama! 😊");
  } else if (text.includes("bot kamu siapa") || text.includes("kamu siapa")) {
    ctx.reply("Aku bot serbaguna buatan kamu sendiri! 🤖");
  }
  // Kalau tidak cocok kata kunci apa pun, bot diam saja (tidak spam balasan)
});

// ------------------------------
// Error handler
// ------------------------------
bot.catch((err, ctx) => {
  console.error(`Error untuk ${ctx.updateType}:`, err);
});

// ------------------------------
// Jalankan bot
// ------------------------------
if (BOT_TOKEN === "PASTE_YOUR_TOKEN_HERE") {
  console.log("⚠️  Jangan lupa ganti BOT_TOKEN dengan token dari @BotFather!");
}

bot.launch().then(() => console.log("✅ Bot berjalan..."));

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
