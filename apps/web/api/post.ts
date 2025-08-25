





import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { content } = req.body;

    // Create a new post event
    const event = {
      kind: "post",
      created_at: Date.now(),
      author_did: "did:key:example", // TODO: Use actual user DID
      body: { text: content },
      refs: [],
      sig: "" // TODO: Sign the event
    };

    try {
      const response = await fetch('http://localhost:8080/pvp/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        const data = await response.json();
        res.status(201).json({ status: "Post created", event_id: data.event_id });
      } else {
        const errorData = await response.json();
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




