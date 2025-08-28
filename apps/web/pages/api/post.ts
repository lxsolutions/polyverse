





import { NextApiRequest, NextApiResponse } from 'next';
import { createEvent, signEvent } from '@polyverse/pvp-sdk-js';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { content, privateKey, did } = req.body;

    try {
      if (!privateKey || !did) {
        return res.status(400).json({ error: "Missing private key or DID" });
      }

      // Create and sign the event
      const unsignedEvent = createEvent("post", did, {
        text: content
      });

      const signedEvent = await signEvent(unsignedEvent, privateKey);

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




