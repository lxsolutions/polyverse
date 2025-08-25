





import { useState, useEffect } from 'react';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('time_decay_diversity');

  // Fetch events from relay based on selected algorithm
  useEffect(() => {
    fetch(`/api/events?algo=${encodeURIComponent(selectedAlgorithm)}`)
      .then(res => res.json())
      .then(data => setEvents(data));
  }, [selectedAlgorithm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPost })
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


