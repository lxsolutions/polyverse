





import { NextApiRequest, NextApiResponse } from 'next';
import { createEvent, signEvent, generateKeyPair } from '@polyverse/pvp-sdk-js';

const DEMO_USER_DID = "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdCIHv";

// Pre-generated key pair for demo purposes
// In production, each user would have their own keys
const DEMO_USER_KEYS = {
  publicKey: "0e1a6c73f45d2b957c5f98f2b3ed7b8c9e1a6c73f45d2b957c5f98f2b3ed7b8c",
  privateKey: "0e1a6c73f45d2b957c5f98f2b3ed7b8c9e1a6c73f45d2b957c5f98f2b3ed7b8c"
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { content } = req.body;

    try {
      // Create and sign the event
      const unsignedEvent = createEvent("post", DEMO_USER_DID, {
        text: content
      });

      const signedEvent = await signEvent(unsignedEvent, DEMO_USER_KEYS.privateKey);

      console.log('Created signed event:', signedEvent);

      const response = await fetch('http://localhost:8080/pvp/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedEvent)
      });

      if (response.ok) {
        const data = await response.json();
        res.status(201).json({ status: "Post created", event_id: data.event_id });
      } else {
        const errorData = await response.json();
        console.error('Relay error:', errorData);
        res.status(response.status).json(errorData);
      }
    } catch (error) {
      console.error("Error posting event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;




