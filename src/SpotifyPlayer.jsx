import React, { useEffect, useState } from 'react';

const CLIENT_ID = '2b36966764ab43489cbceb6193304088';
const REDIRECT_URI = 'http://localhost:5173/callback';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
];
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';

function getTokenFromUrl() {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((acc, item) => {
      const parts = item.split('=');
      acc[parts[0]] = decodeURIComponent(parts[1]);
      return acc;
    }, {});
}

export default function SpotifyPlayer() {
  const [token, setToken] = useState(null);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [track, setTrack] = useState(null);

  // Handle Spotify auth
  useEffect(() => {
    const hash = getTokenFromUrl();
    window.location.hash = '';
    let _token = hash.access_token;
    if (!_token) {
      _token = window.localStorage.getItem('spotify_token');
    } else {
      window.localStorage.setItem('spotify_token', _token);
    }
    setToken(_token);
  }, []);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!token) return;
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'TALHUB Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });
      setPlayer(player);
      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
      });
      player.addListener('player_state_changed', state => {
        setIsPaused(state.paused);
        setTrack(state.track_window.current_track);
      });
      player.connect();
    };
    return () => {
      if (window.Spotify && player) player.disconnect();
    };
    // eslint-disable-next-line
  }, [token]);

  // Play a playlist/track (for demo, user's playback must be active)
  const play = async () => {
    if (!deviceId || !token) return;
    // You can change the URI to your favorite playlist/track
    const playlistUri = 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M';
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [playlistUri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
  };

  if (!token) {
    const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES.join('%20')}&response_type=token&show_dialog=true`;
    return (
      <div className="spotify-player-box">
        <h2>Spotify Player</h2>
        <a className="hero-cta" href={loginUrl}>Login with Spotify</a>
        <div className="hero-note">You must have a Spotify Premium account to use the Web Playback SDK.</div>
      </div>
    );
  }

  return (
    <div className="spotify-player-box">
      <h2>Spotify Player</h2>
      {track && (
        <div className="spotify-track-info">
          <img src={track.album.images[0].url} alt="album art" style={{ width: 64, borderRadius: 8, marginBottom: 8 }} />
          <div><strong>{track.name}</strong></div>
          <div style={{ color: '#888', fontSize: '0.98rem' }}>{track.artists.map(a => a.name).join(', ')}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="hero-cta" onClick={play} style={{ minWidth: 100 }}>Play Demo Playlist</button>
        <button className="hero-cta" onClick={() => player && player.togglePlay()} style={{ minWidth: 100 }}>
          {isPaused ? 'Play/Pause' : 'Pause'}
        </button>
      </div>
      <div className="hero-note" style={{ marginTop: 16 }}>
        You must have Spotify open on any device for playback to start.<br />
        (Web Playback SDK requires Spotify Premium)
      </div>
    </div>
  );
} 