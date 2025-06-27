import React, { useState } from 'react';

function GitsPage() {
  const gitServers = [
    '47.128.64.60',
    '13.212.52.247'
  ];
  const [copiedIdx, setCopiedIdx] = useState(null);
  const copyToClipboard = (ip, idx) => {
    navigator.clipboard.writeText(ip);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };
  return (
    <section className="company-tracker-page" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f7f6f2 60%, #e0e7ef 100%)' }}>
      <div style={{
        background: 'linear-gradient(120deg, #fff 60%, #e0e7ef 100%)',
        borderRadius: 24,
        boxShadow: '0 4px 32px #e0e7ef',
        padding: '2.5em 2.5em 2em 2.5em',
        maxWidth: 520,
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        border: '1.5px solid #e0e7ef',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 8 }}>
          <span style={{ fontSize: '2.5em', color: '#1976d2' }}>🌐</span>
          <h1 className="fancy-title" style={{ fontSize: '2.2em', fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>Git servers for this week</h1>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {gitServers.map((ip, i) => (
            <div key={i} className="gits-command-block" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              background: 'linear-gradient(90deg, #e0e7ef 60%, #f7f6f2 100%)',
              borderRadius: 16,
              padding: '1.3em 2em',
              boxShadow: '0 2px 12px #ececec',
              fontSize: '1.35em',
              fontWeight: 700,
              color: '#232323',
              border: '1.5px solid #b6b6d8',
              position: 'relative',
            }}>
              <span style={{ fontSize: '1.5em', marginRight: 12, color: '#388e3c' }}>🖥️</span>
              <code style={{ fontSize: '1.25em', fontWeight: 700, color: '#1976d2', letterSpacing: '0.04em', flex: 1 }}>{ip}</code>
              <button className="gits-copy-btn" style={{
                background: 'linear-gradient(90deg, #b6b6d8 60%, #81c784 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '1.1em',
                padding: '0.6em 1.6em',
                cursor: 'pointer',
                boxShadow: '0 1px 6px #ececec',
                transition: 'background 0.18s, color 0.18s',
                marginLeft: 12,
              }} onClick={() => copyToClipboard(ip, i)}>
                <span style={{ fontSize: '1.2em', marginRight: 6 }}>📋</span>Copy
              </button>
              {copiedIdx === i && (
                <span style={{
                  position: 'absolute',
                  right: 24,
                  top: '-2.2em',
                  background: '#81c784',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '0.25em 1.1em',
                  fontWeight: 700,
                  fontSize: '0.98em',
                  boxShadow: '0 1px 6px #ececec',
                  letterSpacing: '0.03em',
                  zIndex: 2,
                  transition: 'opacity 0.18s',
                }}>Copied!</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GitsPage; 