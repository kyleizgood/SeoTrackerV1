import React, { useState } from 'react';

function GitsPage() {
  // Git 3 and Git 4 with new IP for Git 4
  const gitServers = [
    { label: 'Git 3', ip: '47.128.64.60' },
    { label: 'Git 4', ip: '54.179.74.207' },
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
        maxWidth: 700,
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
          {gitServers.map((server, i) => (
            <div key={i} className="gits-command-block" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(90deg, #e0e7ef 60%, #f7f6f2 100%)',
              borderRadius: 16,
              padding: '0.8em 1.2em',
              boxShadow: '0 2px 12px #ececec',
              fontSize: '1.15em',
              fontWeight: 700,
              color: '#232323',
              border: '1.5px solid #b6b6d8',
              position: 'relative',
              minWidth: 260,
            }}>
              <span style={{ fontWeight: 800, color: '#1976d2', marginRight: 8 }}>{server.label}:</span>
              <code style={{ fontSize: '1.1em', fontWeight: 700, color: '#1976d2', letterSpacing: '0.04em', flex: 1 }}>{server.ip}</code>
              <button className="gits-copy-btn" style={{
                background: 'linear-gradient(90deg, #b6b6d8 60%, #81c784 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '1em',
                padding: '0.4em 1.1em',
                cursor: 'pointer',
                boxShadow: '0 1px 6px #ececec',
                transition: 'background 0.18s, color 0.18s',
                marginLeft: 8,
              }} onClick={() => copyToClipboard(server.ip, i)}>
                <span style={{ fontSize: '1.1em', marginRight: 4 }}>📋</span>Copy
              </button>
              {copiedIdx === i && (
                <span style={{
                  position: 'absolute',
                  right: 18,
                  top: '-2em',
                  background: '#81c784',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '0.18em 0.8em',
                  fontWeight: 700,
                  fontSize: '0.95em',
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