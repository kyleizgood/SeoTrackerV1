import React, { useState, useEffect } from 'react';
import { getGits, saveGits } from './firestoreHelpers';
import { toast } from 'sonner';

export default function GitsPage({ darkMode }) {
  const [gitServers, setGitServers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({ name: '', ip: '' });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    getGits().then(gits => {
      setGitServers(gits);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading git servers:', error);
      setLoading(false);
    });
  }, []);

  const copyToClipboard = (ip, idx) => {
    navigator.clipboard.writeText(ip);
    // setCopiedIdx(idx); // This state was removed, so this line is removed.
    setTimeout(() => {
      // setCopiedIdx(null); // This state was removed, so this line is removed.
    }, 1200);
  };

  const handleEdit = (idx) => {
    setEditingIndex(idx);
    setEditData({ name: gitServers[idx].name, ip: gitServers[idx].ip });
  };

  const handleEditSave = async (idx) => {
    try {
      const updatedServers = [...gitServers];
      updatedServers[idx] = { ...updatedServers[idx], ...editData };
      setGitServers(updatedServers);
      await saveGits(updatedServers);
      setEditingIndex(null);
      setEditData({ name: '', ip: '' });
      toast.success('Git server updated successfully');
    } catch (error) {
      console.error('Error updating git server:', error);
      alert('Error updating git server');
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditData({ name: '', ip: '' });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 60, fontSize: '1.3em', color: '#888' }}>Loading Gits...</div>;
  }

  return (
    <section className="company-tracker-page" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#181a1b' : 'linear-gradient(135deg, #f7f6f2 60%, #e0e7ef 100%)' }}>
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', justifyContent: 'center' }}>
          {gitServers.map((server, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button style={{ marginBottom: 8, background: '#fff0b2', color: '#b68c00', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.2em 0.7em', cursor: 'pointer' }} onClick={() => handleEdit(i)} title="Edit IP">✏️</button>
              <div className="gits-command-block" style={{
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
                {editingIndex === i ? (
                  <>
                    <input
                      type="text"
                      value={editData.ip}
                      onChange={e => setEditData(prev => ({ ...prev, ip: e.target.value }))}
                      style={{ fontSize: '1.1em', fontWeight: 700, color: '#1976d2', letterSpacing: '0.04em', flex: 1, border: '1px solid #b6b6d8', borderRadius: 6, padding: '0.2em 0.6em', marginRight: 8 }}
                    />
                    <button style={{ marginRight: 4, background: '#81c784', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1em', padding: '0.2em 0.7em', cursor: 'pointer' }} onClick={() => handleEditSave(i)}>Save</button>
                    <button style={{ background: '#eee', color: '#232323', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '1em', padding: '0.2em 0.7em', cursor: 'pointer' }} onClick={handleEditCancel}>Cancel</button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                {/* Removed copiedIdx state, so this block is removed. */}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}