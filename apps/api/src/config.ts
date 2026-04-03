import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

const currentDir = dirname(fileURLToPath(import.meta.url))
const rootEnvPath = resolve(currentDir, '../../../.env')

loadEnv(existsSync(rootEnvPath) ? { path: rootEnvPath } : undefined)

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  APP_URL: z.url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  PYTHON_SERVICE_URL: z.string().default('http://localhost:3002'),
  FREE_LEAD_LIMIT: z.coerce.number().default(50),
})

const parsed = serverEnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

const env = parsed.data

export const config = {
  NODE_ENV: env.NODE_ENV,
  DATABASE_URL: env.DATABASE_URL,
  BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
  APP_URL: env.APP_URL,
  OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  PYTHON_SERVICE_URL: env.PYTHON_SERVICE_URL,
  FREE_LEAD_LIMIT: env.FREE_LEAD_LIMIT,
}
