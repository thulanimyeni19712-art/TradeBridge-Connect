import { pgTable, serial, text, doublePrecision, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('TRADER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Liquidity Edge & SMC Trading Signals
export const tradingSignals = pgTable('trading_signals', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  side: text('side').notNull(), // 'BUY' | 'SELL'
  setupType: text('setup_type').notNull(), // 'TURTLE_SOUP_SWEEP' | 'JUDAS_SWING_REVERSAL' | 'FVG_MITIGATION'
  entryPrice: doublePrecision('entry_price').notNull(),
  sl: doublePrecision('sl').notNull(),
  tp: doublePrecision('tp').notNull(),
  pipsPotential: doublePrecision('pips_potential').default(0),
  liquidityPurged: text('liquidity_purged'),
  status: text('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bot Executions Table (MT5 SafeBridge executions)
export const botExecutions = pgTable('bot_executions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  ticket: integer('ticket').notNull(),
  symbol: text('symbol').notNull(),
  side: text('side').notNull(),
  lots: doublePrecision('lots').notNull(),
  openPrice: doublePrecision('open_price').notNull(),
  pnl: doublePrecision('pnl').default(0),
  botSource: text('bot_source').default('LIQUIDITY_EDGE').notNull(), // 'LIQUIDITY_EDGE' | 'AVIATOR' | 'EASYWAY'
  status: text('status').default('OPEN').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Google Workspace Export Audit Logs (Sheets, Drive, Gmail)
export const workspaceExports = pgTable('workspace_exports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  service: text('service').notNull(), // 'SHEETS' | 'DRIVE' | 'GMAIL' | 'CLASSROOM'
  title: text('title').notNull(),
  resourceUri: text('resource_uri'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  executions: many(botExecutions),
  exports: many(workspaceExports),
}));

export const botExecutionsRelations = relations(botExecutions, ({ one }) => ({
  user: one(users, {
    fields: [botExecutions.userId],
    references: [users.id],
  }),
}));
