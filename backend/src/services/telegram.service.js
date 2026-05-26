import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (message) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] BOT_TOKEN or CHAT_ID not configured — skipping");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Telegram] Failed to send message:", errorBody);
    }
  } catch (error) {
    console.error("[Telegram] Error sending message:", error.message);
  }
};

export const notifyNewOrder = (username, productTitle, amount, transactionId) => {
  const msg = [
    "\u{1F6D2} <b>\u0110\u01a0N M\u1edaI</b>",
    `\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014`,
    `\u{1F464} User: <b>${username}</b>`,
    `\u{1F4E6} S\u1EA3n ph\u1EA9m: ${productTitle}`,
    `\u{1F4B5} S\u1ED1 ti\u1EC1n: <b>${amount.toLocaleString("vi-VN")}\u0111</b>`,
    `\u{1F4CB} M\u00E3 GD: <code>${transactionId}</code>`,
  ].join("\n");
  return sendTelegramMessage(msg);
};

export const notifyNewDeposit = (username, method, amount) => {
  const methodLabel =
    method === "bank" ? "Chuy\u1EC3n kho\u1EA3n" : "Th\u1EBB c\u00E0o";
  const msg = [
    `\u{1F4B0} <b>N\u1EA0P M\u1edaI</b>`,
    `\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014`,
    `\u{1F464} User: <b>${username}</b>`,
    `\u{1F4B3} Ph\u01B0\u01A1ng th\u1EE9c: ${methodLabel}`,
    `\u{1F4B5} S\u1ED1 ti\u1EC1n: <b>${amount.toLocaleString("vi-VN")}\u0111</b>`,
    `\u{23F3} Tr\u1EA1ng th\u00E1i: Ch\u1EDD x\u1EED l\u00FD`,
  ].join("\n");
  return sendTelegramMessage(msg);
};

export const notifyDepositSuccess = (username, amount, newBalance) => {
  const msg = [
    `\u{2705} <b>N\u1EA0P OK</b>`,
    `\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014`,
    `\u{1F464} User: <b>${username}</b>`,
    `\u{1F4B5} S\u1ED1 ti\u1EC1n: <b>${amount.toLocaleString("vi-VN")}\u0111</b>`,
    `\u{1F4B0} S\u1ED1 d\u01B0 m\u1EDBi: <b>${newBalance.toLocaleString("vi-VN")}\u0111</b>`,
  ].join("\n");
  return sendTelegramMessage(msg);
};

export const notifyNewUser = (username, email) => {
  const msg = [
    `\u{1F464} <b>USER M\u1EDA</b>`,
    `\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014`,
    `\u{1F44B} Username: <b>${username}</b>`,
    `\u{1F4E7} Email: ${email}`,
  ].join("\n");
  return sendTelegramMessage(msg);
};
