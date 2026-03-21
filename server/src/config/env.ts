import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    DATABASE_URL: z.string(),

    REDIS_URL: z.string().default('redis://localhost:6380'),

    JWT_SECRET: z.string().min(32),
    JWT_EXPIRY: z.string().default('24h'),

    WA_PHONE_NUMBER_ID: z.string().default(''),
    WA_ACCESS_TOKEN: z.string().default(''),
    WA_VERIFY_TOKEN: z.string().default('chatboot-verify-token'),
    WA_APP_SECRET: z.string().default(''),
    WA_API_VERSION: z.string().default('v21.0'),

    ANTHROPIC_API_KEY: z.string().default(''),
    CLAUDE_CLASSIFIER_MODEL: z.string().default('claude-haiku-4-5-20251001'),
    CLAUDE_RESPONSE_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
    CLAUDE_TIMEOUT_MS: z.coerce.number().default(30_000),

    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().default(''),
    GOOGLE_PRIVATE_KEY: z.string().default(''),
    GOOGLE_SHEET_ID: z.string().default(''),
    GOOGLE_CALENDAR_ID: z.string().default(''),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_USER: z.string().default(''),
    SMTP_PASS: z.string().default(''),

    IMAP_HOST: z.string().default(''),
    IMAP_PORT: z.coerce.number().default(993),
    IMAP_USER: z.string().default(''),
    IMAP_PASS: z.string().default(''),
    EMAIL_POLL_INTERVAL_MS: z.coerce.number().default(180_000),
    EMAIL_AUTO_RESPONDER_ENABLED: z
      .string()
      .transform((v) => v === 'true')
      .default('false'),

    INTERNAL_EMAIL_KEY: z.string().default(''),

    ALERT_EMAIL: z.string().default(''),

    FRONTEND_URL: z.string().default('http://localhost:5173'),

    ALLOWED_ORIGINS: z.string().default('*'),

    PRISMA_POOL_SIZE: z.coerce.number().default(10),

    SIMULATOR_MODE: z
      .string()
      .transform((v) => v === 'true')
      .default('true'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.ANTHROPIC_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ANTHROPIC_API_KEY is required in production',
          path: ['ANTHROPIC_API_KEY'],
        });
      }
      if (!data.SIMULATOR_MODE && !data.WA_ACCESS_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'WA_ACCESS_TOKEN is required in production (unless SIMULATOR_MODE=true)',
          path: ['WA_ACCESS_TOKEN'],
        });
      }
      if (data.ALLOWED_ORIGINS === '*') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ALLOWED_ORIGINS cannot be "*" in production — set explicit origins',
          path: ['ALLOWED_ORIGINS'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
