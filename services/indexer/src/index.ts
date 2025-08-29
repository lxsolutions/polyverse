
import fastify from 'fastify';
import cors from '@fastify/cors';
import { connect, StringCodec, JetStreamClient, JetStreamSubscription } from 'nats';
import { MeiliSearch } from 'meilisearch';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { eventV1Schema } from '@polyverse/schemas';
import { getLabels } from './moderation.js';
import { events } from './db/schema.js';
import { eq } from 'drizzle-orm';

// Environment variables
const PORT = process.env.PORT || 3002;
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || 'masterKey';
const DATABASE_URL = process.env.DATABASE_URL || 'file:./indexer.db';

// Initialize services
const app = fastify({ logger: true });
const meiliClient = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const INDEX_NAME = 'events';
let natsConnection: any = null;
let jetStreamClient: JetStreamClient | null = null;
let useMeilisearch = false;

// Initialize NATS connection
async function initializeNATS() {
  try {
    natsConnection = await connect({ servers: NATS_URL });
    jetStreamClient = natsConnection.jetstream();
    console.log('Connected to NATS server');
    
    // Create consumer for events
    const jsm = await natsConnection.jetstreamManager();
    try {
      await jsm.consumers.add('EVENTS', {
        durable_name: 'indexer-consumer',
        filter_subject: 'events.*',
        deliver_policy: 'all',
      });
    } catch (error) {
      // Consumer might already exist
      console.log('Consumer likely already exists');
    }
    
    // Subscribe to events using basic NATS subscription for now
    // TODO: Upgrade to JetStream with proper configuration
    const subscription = natsConnection.subscribe('events.*');
    const sc = StringCodec();
    
    console.log('Subscribed to NATS event stream');
    
    (async () => {
      for await (const message of subscription) {
        try {
          const event = JSON.parse(sc.decode(message.data));
          await processEvent(event);
        } catch (error) {
          console.error('Failed to process event:', error);
        }
      }
    })();
    
  } catch (error) {
    console.error('Failed to connect to NATS:', error);
  }
}

// Initialize Meilisearch
async function initializeMeilisearch() {
  try {
    await meiliClient.health();
    console.log('Meilisearch connection successful');
    
    const indexes = await meiliClient.getIndexes();
    const indexExists = indexes.results.some(index => index.uid === INDEX_NAME);
    
    if (!indexExists) {
      await meiliClient.createIndex(INDEX_NAME, { primaryKey: 'id' });
      console.log(`Created Meilisearch index: ${INDEX_NAME}`);
      
      await meiliClient.index(INDEX_NAME).updateSettings({
        searchableAttributes: ['body.text', 'author_did', 'kind'],
        filterableAttributes: ['kind', 'author_did', 'created_at'],
        sortableAttributes: ['created_at']
      });
    }
    
    useMeilisearch = true;
    console.log('Using Meilisearch for search');
  } catch (error) {
    console.error('Meilisearch unavailable, using database only:', error);
  }
}

// Process incoming event
async function processEvent(event: any) {
  try {
    // Validate event schema
    const validatedEvent = eventV1Schema.parse(event);
    
    // Store in database
    await db.insert(events).values({
      id: validatedEvent.id,
      kind: validatedEvent.kind,
      author_did: validatedEvent.author_did,
      signature: validatedEvent.sig,
      created_at: new Date(validatedEvent.created_at * 1000), // Convert from seconds to milliseconds
      content: JSON.stringify(validatedEvent.body || {}),
      refs: validatedEvent.refs.map(ref => JSON.stringify(ref))
    });
    
    // Index in Meilisearch if available
    if (useMeilisearch) {
      await meiliClient.index(INDEX_NAME).addDocuments([validatedEvent]);
    }
    
    console.log(`Processed event: ${validatedEvent.id}`);
  } catch (error) {
    console.error('Failed to process event:', error);
  }
}

// API endpoints
app.register(cors);

app.get('/healthz', async () => {
  return { status: 'ok', services: { 
    nats: !!natsConnection, 
    meilisearch: useMeilisearch,
    database: true 
  }};
});

app.get('/feed', async (request, reply) => {
  const { bundle = 'chronological', limit = 20, cursor } = request.query as any;
  
  try {
    let results;
    
    if (bundle === 'chronological') {
      results = await db.select()
        .from(events)
        .orderBy(events.created_at)
        .limit(limit)
        .offset(cursor || 0);
    } else if (bundle === 'author_weighted') {
      // TODO: Implement author weighting algorithm
      results = await db.select()
        .from(events)
        .orderBy(events.created_at)
        .limit(limit)
        .offset(cursor || 0);
    } else if (bundle.startsWith('hashtag:')) {
      const hashtag = bundle.split(':')[1];
      results = await db.select()
        .from(events)
        .where(eq(events.content, `%#${hashtag}%`))
        .orderBy(events.created_at)
        .limit(limit)
        .offset(cursor || 0);
    }
    
    reply.send(results);
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch feed' });
  }
});

app.get('/u/:authorId', async (request, reply) => {
  const { authorId } = request.params as any;
  
  try {
    const authorEvents = await db.select()
      .from(events)
      .where(eq(events.author_did, authorId))
      .orderBy(events.created_at)
      .limit(50);
    
    reply.send(authorEvents);
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch author events' });
  }
});

app.get('/post/:id', async (request, reply) => {
  const { id } = request.params as any;
  
  try {
    const event = await db.select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    
    if (event.length === 0) {
      reply.status(404).send({ error: 'Event not found' });
    } else {
      reply.send(event[0]);
    }
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch event' });
  }
});

// Start the service
async function start() {
  try {
    await initializeNATS();
    await initializeMeilisearch();
    
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
    console.log(`Indexer service running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start indexer:', error);
    process.exit(1);
  }
}

start();
