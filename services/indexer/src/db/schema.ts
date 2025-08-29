

import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  author_did: text('author_did').notNull(),
  signature: text('signature').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  content: text('content').notNull(),
  refs: blob('refs', { mode: 'json' }).$type<string[]>().default([]),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

