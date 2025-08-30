

import { pgTable, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  author_did: text('author_did').notNull(),
  signature: text('signature').notNull(),
  created_at: timestamp('created_at').notNull(),
  content: text('content').notNull(),
  refs: jsonb('refs').$type<string[]>().default([]),
});

export const authors = pgTable('authors', {
  did: text('did').primaryKey(),
  name: text('name'),
  bio: text('bio'),
  followers_count: integer('followers_count').default(0),
  posts_count: integer('posts_count').default(0),
  reputation_score: integer('reputation_score').default(50),
  is_verified: boolean('is_verified').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;

