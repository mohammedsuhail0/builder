import crypto from "node:crypto";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";

function keyFromEnv() {
  return crypto.createHash("sha256").update(env.MESSAGE_ENCRYPTION_KEY).digest();
}

export function encryptText(plain: string) {
  const iv = crypto.randomBytes(12);
  const key = keyFromEnv();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptText(payload: string) {
  try {
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return payload;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const key = keyFromEnv();
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return payload;
  }
}

