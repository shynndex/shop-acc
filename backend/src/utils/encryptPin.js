import crypto from "crypto"; 

export const encryptPin = (pin) => {
  const key = Buffer.from(process.env.PIN_ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const encrypted = cipher.update(pin, "utf8", "hex") + cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

export const decryptPin = (encryptedPin, encryptionKey) => {
  try {
    const [ivHex, encrypted] = encryptedPin.split(":");
    const key = Buffer.from(encryptionKey, "hex");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
  } catch {
    return null;
  }
};
