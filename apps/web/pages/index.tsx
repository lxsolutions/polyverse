





import { useState, useEffect } from 'react';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [newPost, setNewPost] = useState('');

  // Fetch events from relay
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPost })
    });

    // Refresh events
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data));

    setNewPost('');
  };

  return (
    <div>
      <h1>PolyVerse Web Client</h1>

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


