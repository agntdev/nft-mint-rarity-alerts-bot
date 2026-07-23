import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "📋 Subscriptions", data: "subscriptions:show", order: 20 });

const composer = new Composer<Ctx>();

composer.command("subscriptions", async (ctx) => {
  await showSubscriptions(ctx);
});

composer.callbackQuery("subscriptions:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSubscriptions(ctx, true);
});

composer.callbackQuery(/^sub:toggle/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const parts = ctx.callbackQuery.data.split(":"); const id = parts[2]; const ntype = parts[3];
  const subs = ctx.session.subscriptions ?? [];
  const sub = subs.find((s) => s.id === id);
  if (sub) {
    const idx = sub.notificationTypes.indexOf(ntype);
    if (idx >= 0) sub.notificationTypes.splice(idx, 1);
    else sub.notificationTypes.push(ntype);
  }
  await showSubscriptions(ctx, true);
});

composer.callbackQuery(/^sub:remove/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.callbackQuery.data.split(":")[2];
  ctx.session.subscriptions = (ctx.session.subscriptions ?? []).filter((s) => s.id !== id);
  await showSubscriptions(ctx, true);
});

composer.callbackQuery("alert:test", async (ctx) => {
  await ctx.answerCallbackQuery();
  const subs = ctx.session.subscriptions ?? [];
  if (subs.length === 0) {
    await ctx.reply("Add a subscription first.");
    return;
  }
  const sub = subs[0];
  const ref = describeSub(sub);
  const text = "🔔 early mint for ✅ Verified " + ref;
  await ctx.reply(text);
});

async function showSubscriptions(ctx: Ctx, edit = false) {
  const subs = ctx.session.subscriptions ?? [];
  if (subs.length === 0) {
    const msg = "No subscriptions yet — tap ➕ Follow to add one.";
    const kb = inlineKeyboard([
      [inlineButton("➕ Follow project", "follow:start"), inlineButton("⬅️ Back to menu", "menu:main")],
    ]);
    if (edit && ctx.callbackQuery?.message) {
      await ctx.editMessageText(msg, { reply_markup: kb });
    } else {
      await ctx.reply(msg, { reply_markup: kb });
    }
    return;
  }
  let text = "Your subscriptions (tap to toggle):\n\n";
  const rows: ReturnType<typeof inlineButton>[][] = [];
  const typeShort: Record<string, string> = { mint: "mint", rarity: "rarity", whitelist: "wl", floor_change: "floor", rare_sale: "sale" };
  subs.forEach((sub) => {
    text += describeSub(sub) + "\n";
    const trow: ReturnType<typeof inlineButton>[] = [];
    for (const [full, short] of Object.entries(typeShort)) {
      const on = sub.notificationTypes.includes(full);
      trow.push(inlineButton((on ? "✅" : "⬜") + short, `sub:toggle:${sub.id}:${full}`));
    }
    rows.push(trow);
    rows.push([inlineButton("🗑 Remove", `sub:remove:${sub.id}`)]);
  });
  text += "\nTest delivery includes ✅ Verified tag.";
  rows.push([inlineButton("🧪 Test alert", "alert:test"), inlineButton("⬅️ Back to menu", "menu:main")]);
  const kb = inlineKeyboard(rows);
  if (edit && ctx.callbackQuery?.message) {
    await ctx.editMessageText(text, { reply_markup: kb });
  } else {
    await ctx.reply(text, { reply_markup: kb });
  }
}

function describeSub(s: { target: string; chain?: string; type: string }): string {
  return s.target + (s.chain ? " (" + s.chain + ")" : "");
}

export default composer;
