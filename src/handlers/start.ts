import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem, inlineKeyboard, inlineButton } from "../toolkit/index.js";

registerMainMenuItem({ label: "🔄 Auto-follow", data: "prefs:toggle_auto", order: 40 });

const composer = new Composer<Ctx>();

function welcomeText(auto?: boolean): string {
  const status = auto === false ? "off" : "on";
  return "NFT alerts for verified projects.\nEthereum • Solana • Base.\nAuto-follow trending: " + status + ".";
}

composer.command("start", async (ctx) => {
  await ctx.reply(welcomeText(ctx.session.autoFollowEnabled), { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(welcomeText(ctx.session.autoFollowEnabled), { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("prefs:toggle_auto", async (ctx) => {
  await ctx.answerCallbackQuery();
  const s = ctx.session;
  s.autoFollowEnabled = !(s.autoFollowEnabled ?? true);
  await ctx.editMessageText(welcomeText(s.autoFollowEnabled), { reply_markup: mainMenuKeyboard() });
});

// Fallback ensures stray callbacks never leave a spinner.
composer.on("callback_query", async (ctx, next) => {
  try { await ctx.answerCallbackQuery(); } catch {}
  await next();
});

export default composer;
