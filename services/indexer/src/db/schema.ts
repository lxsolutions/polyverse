

import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  author_did: text('author_did').notNull(),
  signature: text('signature').notNull(),
  created_at: timestamp('created_at').notNull(),
  content: text('content').notNull(),
  refs: jsonb('refs').$type<string[]>().default([]),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

