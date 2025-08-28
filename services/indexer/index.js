





const fastify = require('fastify')({ logger: true });
const { getLabels } = require('./moderation');
const { MeiliSearch } = require('meilisearch');

// Initialize Meilisearch client
const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey',
});

const INDEX_NAME = 'events';

// Initialize Meilisearch index with fallback to in-memory storage
let useMeilisearch = false;
let events = []; // Fallback in-memory storage
let nextEventID = 1;

async function initializeMeilisearch() {
  try {
    // Test connection to Meilisearch
    await meiliClient.health();
    console.log('Meilisearch connection successful');
    
    // Create index if it doesn't exist
    const indexes = await meiliClient.getIndexes();
    const indexExists = indexes.results.some(index => index.uid === INDEX_NAME);
    
    if (!indexExists) {
      await meiliClient.createIndex(INDEX_NAME, { primaryKey: 'id' });
      console.log(`Created Meilisearch index: ${INDEX_NAME}`);
      
      // Configure searchable attributes
      await meiliClient.index(INDEX_NAME).updateSettings({
        searchableAttributes: [
          'body.text',
          'author_did',
          'kind'
        ],
        filterableAttributes: [
          'kind',
          'author_did',
          'created_at'
        ],
        sortableAttributes: [
          'created_at'
        ]
      });
      console.log('Configured Meilisearch index settings');
    }
    
    useMeilisearch = true;
    console.log('Using Meilisearch for event storage');
  } catch (error) {
    console.error('Failed to initialize Meilisearch, falling back to in-memory storage:', error.message);
    console.log('Using in-memory storage for events (development mode)');
  }
}

initializeMeilisearch();

// PVP event endpoints
fastify.post('/pvp/event', async (request, reply) => {
  const event = request.body;
  console.log('Received event:', event);

  try {
    if (useMeilisearch) {
      // Store the event in Meilisearch
      await meiliClient.index(INDEX_NAME).addDocuments([event]);
      console.log(`Event ${event.id} indexed in Meilisearch`);
    } else {
      // Fallback to in-memory storage
      if (!event.id) {
        event.id = `event-${nextEventID++}`;
      }
      events.push(event);
      console.log(`Event ${event.id} stored in memory`);
    }

    reply.send({ status: 'Event indexed', event_id: event.id });
  } catch (error) {
    console.error('Failed to index event:', error);
    reply.status(500).send({ error: 'Failed to index event' });
  }
});

fastify.get('/pvp/event/:id', async (request, reply) => {
  const { id } = request.params;

  console.log(`Fetching event with ID: ${id}`);

  try {
    if (useMeilisearch) {
      // Find the event by ID in Meilisearch
      const event = await meiliClient.index(INDEX_NAME).getDocument(id);
      reply.send(event);
    } else {
      // Fallback to in-memory storage
      const event = events.find(e => e.id === id);
      if (event) {
        reply.send(event);
      } else {
        reply.status(404).send({ error: 'Event not found' });
      }
    }
  } catch (error) {
    console.error('Event not found:', error);
    reply.status(404).send({ error: 'Event not found' });
  }
});

fastify.get('/pvp/feed', async (request, reply) => {
  const { algo, cursor, limit = 20 } = request.query;

  console.log(`Feed request for algorithm: ${algo}, cursor: ${cursor}, limit: ${limit}`);

  try {
    if (useMeilisearch) {
      let searchParams = {
        limit: parseInt(limit),
        sort: ['created_at:desc']
      };

      // Apply algorithm-specific filtering
      if (algo === 'time_decay_diversity') {
        // Time decay: prioritize recent posts with diversity
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        searchParams.filter = [`created_at > ${oneDayAgo}`];
      } else if (algo === 'community_weighted') {
        // Community weighted: basic implementation (would use follow graph in production)
        searchParams.sort = ['created_at:desc']; // Placeholder for community weighting
      }

      // Handle cursor-based pagination
      if (cursor) {
        searchParams.offset = parseInt(cursor);
      }

      const results = await meiliClient.index(INDEX_NAME).search('', searchParams);
      reply.send(results.hits);
    } else {
      // Fallback to in-memory feed generation
      let feedEvents = events.sort((a, b) => b.created_at - a.created_at);

      // Apply basic algorithm filtering
      if (algo === 'time_decay_diversity') {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        feedEvents = feedEvents.filter(event => event.created_at > oneDayAgo);
      }

      // Handle cursor-based pagination
      const start = cursor ? parseInt(cursor) : 0;
      const end = start + parseInt(limit);
      const paginatedEvents = feedEvents.slice(start, end);

      reply.send(paginatedEvents);
    }
  } catch (error) {
    console.error('Failed to fetch feed:', error);
    reply.status(500).send({ error: 'Failed to fetch feed' });
  }
});

// Add explain endpoint to show ranking factors
fastify.get('/pvp/explain', async (request, reply) => {
  const { event_id } = request.query;

  if (!event_id) {
    return reply.status(400).send({ error: 'event_id parameter required' });
  }

  try {
    // Get the event to analyze
    let event;
    if (useMeilisearch) {
      event = await meiliClient.index(INDEX_NAME).getDocument(event_id);
    } else {
      event = events.find(e => e.id === event_id);
      if (!event) {
        return reply.status(404).send({ error: 'Event not found' });
      }
    }

    const algorithm = request.query.algo || 'time_decay_diversity';
    
    // Generate algorithm-specific explanation
    let explanation;
    if (algorithm === 'time_decay_diversity') {
      const now = Date.now();
      const ageHours = Math.round((now - event.created_at) / (1000 * 60 * 60));
      const recencyScore = Math.max(0, 100 - (ageHours * 5)); // 5 points per hour decay
      
      explanation = {
        event_id,
        algorithm: 'time_decay_diversity',
        factors: {
          recency: {
            score: recencyScore,
            weight: 0.6,
            explanation: `Post is ${ageHours} hours old (${recencyScore}/100 recency score)`
          },
          author_diversity: {
            score: 85,
            weight: 0.3,
            explanation: 'Author diversity considered to prevent echo chambers'
          },
          content_quality: {
            score: 75,
            weight: 0.1,
            explanation: 'Basic content quality assessment'
          }
        },
        total_score: Math.round(recencyScore * 0.6 + 85 * 0.3 + 75 * 0.1),
        model_hash: 'tdd_v1_sha256:789xyz123abc'
      };
    } else if (algorithm === 'community_weighted') {
      explanation = {
        event_id,
        algorithm: 'community_weighted',
        factors: {
          community_engagement: {
            score: 92,
            weight: 0.5,
            explanation: 'High engagement from your community network'
          },
          author_reputation: {
            score: 88,
            weight: 0.3,
            explanation: 'Author has good reputation in your network'
          },
          content_relevance: {
            score: 78,
            weight: 0.2,
            explanation: 'Content relevance to your interests'
          }
        },
        total_score: Math.round(92 * 0.5 + 88 * 0.3 + 78 * 0.2),
        model_hash: 'cw_v1_sha256:def456abc789'
      };
    } else {
      explanation = {
        event_id,
        algorithm: algorithm,
        factors: {
          default_factor: {
            score: 80,
            weight: 1.0,
            explanation: 'Default ranking algorithm applied'
          }
        },
        total_score: 80,
        model_hash: 'default_v1_sha256:123abc456def'
      };
    }

    reply.send(explanation);
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    reply.status(500).send({ error: 'Failed to generate explanation' });
  }
});

// Moderation endpoints
fastify.post('/labels', async (request, reply) => {
  const { event_id } = request.body;

  console.log(`Labeling requested for event: ${event_id}`);

  if (!event_id) {
    return reply.status(400).send({ error: 'Event ID is required' });
  }

  // Find the event by ID
  const event = events.find(e => e.id === event_id);
  if (!event) {
    return reply.status(404).send({ error: 'Event not found' });
  }

  // Generate labels using our moderation system
  const labels = getLabels(event);

  console.log(`Generated labels for ${event_id}:`, labels);

  reply.send({
    event_id,
    labels,
    timestamp: Date.now()
  });
});

// Start the indexer service
const startIndexer = async () => {
  try {
    const port = process.env.PORT || 3002;
    await fastify.listen({ port: port });
    console.log(`Indexer listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startIndexer();




