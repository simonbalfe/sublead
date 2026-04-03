import { relations } from 'drizzle-orm'
import { boolean, index, integer, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

// ── better-auth tables ──

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// ── sublead tables ──

export const icps = pgTable(
  'icp',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    website: text('website'),
    description: text('description').notNull().default(''),
    painPoints: text('pain_points').notNull().default(''),
    keywords: jsonb('keywords').$type<string[]>().notNull().default([]),
    subreddits: jsonb('subreddits').$type<string[]>().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    seeded: boolean('seeded').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('icp_userId_idx').on(table.userId)],
)

export const redditPosts = pgTable(
  'reddit_post',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    icpId: text('icp_id')
      .notNull()
      .references(() => icps.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    redditId: text('reddit_id').notNull(),
    title: text('title').notNull(),
    selftext: text('selftext').notNull().default(''),
    url: text('url').notNull(),
    subreddit: text('subreddit').notNull(),
    author: text('author').notNull().default(''),
    redditCreatedAt: timestamp('reddit_created_at'),
    productFitScore: integer('product_fit_score').notNull(),
    intentScore: integer('intent_score').notNull(),
    authorityScore: integer('authority_score').notNull(),
    totalScore: integer('total_score').notNull(),
    productFitJustification: text('product_fit_justification'),
    intentJustification: text('intent_justification'),
    authorityJustification: text('authority_justification'),
    painPoints: text('pain_points_extracted'),
    overallAssessment: text('overall_assessment'),
    status: text('status').notNull().default('new'),
    generatedReply: text('generated_reply'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('reddit_post_icpId_idx').on(table.icpId),
    index('reddit_post_userId_idx').on(table.userId),
    unique('reddit_post_icp_reddit_unique').on(table.icpId, table.redditId),
  ],
)

export const processedPosts = pgTable(
  'processed_post',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    icpId: text('icp_id')
      .notNull()
      .references(() => icps.id, { onDelete: 'cascade' }),
    redditId: text('reddit_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('processed_post_icpId_idx').on(table.icpId),
    unique('processed_post_icp_reddit_unique').on(table.icpId, table.redditId),
  ],
)

export const usageTracking = pgTable(
  'usage_tracking',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    qualifiedLeads: integer('qualified_leads').notNull().default(0),
    repliesGenerated: integer('replies_generated').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('usage_tracking_userId_idx').on(table.userId),
    unique('usage_tracking_user_month_year').on(table.userId, table.month, table.year),
  ],
)

// ── relations ──

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  icps: many(icps),
  redditPosts: many(redditPosts),
  usageTracking: many(usageTracking),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const icpRelations = relations(icps, ({ one, many }) => ({
  user: one(user, { fields: [icps.userId], references: [user.id] }),
  redditPosts: many(redditPosts),
  processedPosts: many(processedPosts),
}))

export const redditPostRelations = relations(redditPosts, ({ one }) => ({
  icp: one(icps, { fields: [redditPosts.icpId], references: [icps.id] }),
  user: one(user, { fields: [redditPosts.userId], references: [user.id] }),
}))

export const processedPostRelations = relations(processedPosts, ({ one }) => ({
  icp: one(icps, { fields: [processedPosts.icpId], references: [icps.id] }),
}))

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(user, { fields: [usageTracking.userId], references: [user.id] }),
}))

export const schema = {
  user,
  session,
  account,
  verification,
  icps,
  redditPosts,
  processedPosts,
  usageTracking,
}
