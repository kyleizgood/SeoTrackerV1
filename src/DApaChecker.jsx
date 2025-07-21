import React, { useState } from 'react';

function DApaChecker({ darkMode, setDarkMode }) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // You can get a free API key at https://www.domcop.com/openpagerank/
  // For demo, we'll use a public test key (replace with your own for production)
  const OPR_API_KEY = '5i04v6v6w4o4k4g4g4g4w4o4k4g4g4g4';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const domain = url.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');
      const response = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?domains%5B0%5D=${encodeURIComponent(domain)}`, {
        headers: {
          'API-OPR': OPR_API_KEY
        }
      });
      const data = await response.json();
      if (data.status_code === 200 && data.response && data.response[0]) {
        setResult({
          domain: data.response[0].domain,
          page_rank: data.response[0].page_rank_integer,
        });
      } else {
        setError('Could not fetch PageRank. Try another domain.');
      }
    } catch (err) {
      setError('Error fetching PageRank.');
    }
    setLoading(false);
  };

  return (
    <section className="dapachecker-page" style={{ background: darkMode ? '#181a1b' : '#f7f6f2', minHeight: '100vh' }}>
      <h1>PageRank Checker (Open PageRank)</h1>
      <form className="dapachecker-form" onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter website URL (e.g. https://example.com)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading || !url}>
          {loading ? 'Checking...' : 'Check PageRank'}
        </button>
      </form>
      {error && <div className="dapachecker-error">{error}</div>}
      {result && (
        <div className="dapachecker-result">
          <div><strong>Domain:</strong> {result.domain}</div>
          <div><strong>Open PageRank Score:</strong> {result.page_rank}</div>
        </div>
      )}
      <div className="hero-note" style={{marginTop: '1.5rem', textAlign: 'center'}}>
        Powered by <a href="https://www.domcop.com/openpagerank/" target="_blank" rel="noopener noreferrer">Open PageRank</a>.<br/>
        For production, get your own free API key from their website.
      </div>
    </section>
  );
}

export default DApaChecker; 