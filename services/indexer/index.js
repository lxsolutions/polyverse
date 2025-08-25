





const fastify = require('fastify')({ logger: true });

// In-memory event store for demonstration
let events = [];

// PVP event endpoints
fastify.post('/pvp/event', async (request, reply) => {
  const event = request.body;
  console.log('Received event:', event);

  // Store the event in memory (for demo purposes)
  events.push(event);

  reply.send({ status: 'Event indexed' });
});

fastify.get('/pvp/feed', async (request, reply) => {
  const { algo, cursor } = request.query;

  console.log(`Feed request for algorithm: ${algo}, cursor: ${cursor}`);

  // For demo purposes, return all events sorted by timestamp
  const feedEvents = events.sort((a, b) => b.created_at - a.created_at);

  reply.send(feedEvents);
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




