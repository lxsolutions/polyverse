





import { useState, useEffect } from 'react';
import KeyManager from '../components/KeyManager';

interface KeyPair {
  publicKey: string;
  privateKey: string;
  did: string;
}

interface Event {
  id: string;
  kind: string;
  created_at: number;
  author_did: string;
  body: {
    text: string;
  };
  refs: any[];
  sig: string;
}

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('time_decay_diversity');
  const [userKeys, setUserKeys] = useState<KeyPair | null>(null);

  // Fetch events from relay based on selected algorithm
  useEffect(() => {
    fetch(`/api/events?algo=${encodeURIComponent(selectedAlgorithm)}`)
      .then(res => res.json())
      .then(data => setEvents(data));
  }, [selectedAlgorithm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userKeys) {
      alert('Please generate or import keys first');
      return;
    }

    await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: newPost,
        privateKey: userKeys.privateKey,
        did: userKeys.did
      })
    });

    // Refresh events
    fetch(`/api/events?algo=${encodeURIComponent(selectedAlgorithm)}`)
      .then(res => res.json())
      .then(data => setEvents(data));

    setNewPost('');
  };

  return (
    <div>
      <h1>PolyVerse Web Client</h1>

      <KeyManager onKeyChange={setUserKeys} />

      <div className="algorithm-selection">
        <label htmlFor="algo-select">Feed Algorithm:</label>
        <select
          id="algo-select"
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
        >
          <option value="time_decay_diversity">Time Decay + Diversity</option>
          <option value="community_weighted">Community Weighted</option>
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's happening?"
        />
        <button type="submit">Post</button>
      </form>

      <div className="events">
        {events.map(event => (
          <div key={event.id} className="event">
            <p>{event.body.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;


