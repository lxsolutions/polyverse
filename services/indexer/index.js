





const fastify = require('fastify')({ logger: true });
const { getLabels } = require('./moderation');

// In-memory event store for demonstration
let events = [];
let nextEventID = 1;

// PVP event endpoints
fastify.post('/pvp/event', async (request, reply) => {
  const event = request.body;
  console.log('Received event:', event);

  // Assign an ID if not present (for demo purposes)
  if (!event.id) {
    event.id = `demo-event-${nextEventID++}`;
  }

  // Store the event in memory (for demo purposes)
  events.push(event);

  reply.send({ status: 'Event indexed', event_id: event.id });
});

fastify.get('/pvp/event/:id', async (request, reply) => {
  const { id } = request.params;

  console.log(`Fetching event with ID: ${id}`);

  // Find the event by ID
  const event = events.find(e => e.id === id);
  if (event) {
    reply.send(event);
  } else {
    reply.status(404).send({ error: 'Event not found' });
  }
});

fastify.get('/pvp/feed', async (request, reply) => {
  const { algo, cursor } = request.query;

  console.log(`Feed request for algorithm: ${algo}, cursor: ${cursor}`);

  // For demo purposes, return all events sorted by timestamp
  let feedEvents = events.sort((a, b) => b.created_at - a.created_at);

  // Apply basic algorithm filtering (for demonstration)
  if (algo === 'time_decay_diversity') {
    // Simple time decay: only show recent posts
    const now = Date.now();
    feedEvents = feedEvents.filter(event =>
      event.created_at > now - 24 * 60 * 60 * 1000 // Last 24 hours
    );
  }

  reply.send(feedEvents);
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
    await fastify.listen({ port: 3001 });
    console.log('Indexer listening on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startIndexer();




