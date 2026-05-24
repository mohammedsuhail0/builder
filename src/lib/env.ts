import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

let parsedEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://dummy-supabase-url-for-build.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy_anon_key_for_build",
};

try {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (result.success) {
    parsedEnv = result.data;
  } else {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      parsedEnv.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      parsedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }
} catch (e) {
  console.warn("Client environment variables validation failed, using fallback:", e);
}

export const env = parsedEnv;
