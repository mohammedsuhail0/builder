import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  MESSAGE_ENCRYPTION_KEY: z
    .string()
    .min(32, "MESSAGE_ENCRYPTION_KEY must be 32+ chars"),
});

// Avoid build-time crash when variables are absent during static analysis/compilation
const isBuildTime =
  process.env.NEXT_PHASE === "phase-production-build" ||
  (!process.env.MESSAGE_ENCRYPTION_KEY && process.env.NODE_ENV !== "production");

export const serverEnv = serverEnvSchema.parse({
  MESSAGE_ENCRYPTION_KEY:
    process.env.MESSAGE_ENCRYPTION_KEY ||
    (isBuildTime ? "dummy_encryption_key_for_build_purposes_only_32_chars" : undefined),
});


