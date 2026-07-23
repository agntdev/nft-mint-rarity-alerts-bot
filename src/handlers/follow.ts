import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "➕ Follow", data: "follow:start", order: 10 });

const composer = new Composer<Ctx>();

composer.command("follow", async (ctx) => {
  ctx.session.step = "awaiting_follow_target";
  await ctx.reply("Send contract address, keyword or creator handle (e.g. 0x123... or azuki or @creator).", {
    reply_markup: { force_reply: true, input_field_placeholder: "0x... or keyword or @handle" },
  });
});

composer.callbackQuery("follow:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_follow_target";
  await ctx.reply("Send contract address, keyword or creator handle (e.g. 0x123... or azuki or @creator).", {
    reply_markup: { force_reply: true, input_field_placeholder: "0x... or keyword or @handle" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_follow_target") return next();
  const input = ctx.message.text.trim();
  if (input.toLowerCase() === "cancel" || input === "/cancel") {
    ctx.session.step = "idle";
    await ctx.reply("Cancelled.", { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) });
    return;
  }
  ctx.session.step = "idle";
  const sub = parseFollowInput(input);
  if (!sub) {
    await ctx.reply("Invalid. Provide 0x address (eth/base), 32+ char solana, keyword or @handle.", {
      reply_markup: inlineKeyboard([
        [inlineButton("➕ Try again", "follow:start"), inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const subs = (ctx.session.subscriptions ??= []);
  const norm = sub.target.toLowerCase();
  if (subs.some((s) => s.target.toLowerCase() === norm && s.type === sub.type)) {
    await ctx.reply("Already following that target.", {
      reply_markup: inlineKeyboard([[inlineButton("📋 Subscriptions", "subscriptions:show"), inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  const newSub = {
    id: `sub_${Date.now()}`,
    type: sub.type,
    target: sub.target,
    chain: sub.chain,
    notificationTypes: ["mint", "rarity", "whitelist", "floor_change", "rare_sale"],
    createdAt: Date.now(),
  };
  subs.push(newSub);
  await ctx.reply(`Subscribed to ${describeSub(newSub)}.\nAlerts enabled for all types.`, {
    reply_markup: inlineKeyboard([
      [inlineButton("📋 Subscriptions", "subscriptions:show")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^follow:quick:/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const target = decodeURIComponent(ctx.callbackQuery.data.split(":")[2]);
  const subs = (ctx.session.subscriptions ??= []);
  if (!subs.some((s) => s.target.toLowerCase() === target.toLowerCase())) {
    subs.push({
      id: `sub_${Date.now()}`,
      type: "keyword",
      target,
      notificationTypes: ["mint", "rarity", "whitelist", "floor_change", "rare_sale"],
      createdAt: Date.now(),
    });
  }
  await ctx.editMessageText(`Subscribed to ${target}.`, {
    reply_markup: inlineKeyboard([
      [inlineButton("📋 Subscriptions", "subscriptions:show"), inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

function parseFollowInput(input: string): { type: "contract" | "keyword" | "creator"; target: string; chain?: "ethereum" | "solana" | "base" } | null {
  const parts = input.trim().split(/\s+/);
  let t = parts[0];
  let ch: "ethereum" | "solana" | "base" | undefined;
  const c2 = (parts[1] || "").toLowerCase();
  if (c2 === "eth" || c2 === "ethereum") ch = "ethereum";
  else if (c2 === "sol" || c2 === "solana") ch = "solana";
  else if (c2 === "base") ch = "base";
  if (/^0x[0-9a-fA-F]{40}$/.test(t) && (!ch || ch === "ethereum" || ch === "base")) {
    return { type: "contract", target: t, chain: ch || "ethereum" };
  }
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) {
    return { type: "contract", target: t, chain: ch || "solana" };
  }
  if (t.startsWith("@") && t.length > 1) {
    return { type: "creator", target: t };
  }
  if (t.length >= 2) {
    return { type: "keyword", target: t, chain: ch };
  }
  return null;
}

function describeSub(s: { type: string; target: string; chain?: string }): string {
  return s.target + (s.chain ? " (" + s.chain + ")" : "");
}

export default composer;
