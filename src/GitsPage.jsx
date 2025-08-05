import React, { useState, useEffect } from 'react';
import { getGits, saveGits } from './firestoreHelpers';
import { toast } from 'sonner';

export default function GitsPage({ darkMode }) {
  const [gitServers, setGitServers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({ label: '', ip: '' });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGitData, setNewGitData] = useState({ label: '', ip: '' });

  useEffect(() => {
    getGits().then(gits => {
      setGitServers(gits);
      setLoading(false);
    }).catch(error => {
      setLoading(false);
    });
  }, []);

  const copyToClipboard = (ip, idx) => {
    navigator.clipboard.writeText(ip);
    setTimeout(() => {
      // setCopiedIdx(null); // This state was removed, so this line is removed.
    }, 1200);
  };

  const handleEdit = (idx) => {
    setEditingIndex(idx);
    setEditData({ label: gitServers[idx].label, ip: gitServers[idx].ip });
  };

  const handleEditSave = async (idx) => {
    try {
      const updatedServers = [...gitServers];
      updatedServers[idx] = { ...updatedServers[idx], ...editData };
      setGitServers(updatedServers);
      await saveGits(updatedServers);
      setEditingIndex(null);
      setEditData({ label: '', ip: '' });
      toast.success('Git server updated successfully');
    } catch (error) {
      toast.error(`Error updating git server: ${error.message}`);
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditData({ label: '', ip: '' });
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setNewGitData({ label: '', ip: '' });
  };

  const handleAddSave = async () => {
    if (!newGitData.label.trim() || !newGitData.ip.trim()) {
      toast.error('Please fill in both label and IP address');
      return;
    }

    try {
      const updatedServers = [...gitServers, newGitData];
      setGitServers(updatedServers);
      await saveGits(updatedServers);
      setShowAddForm(false);
      setNewGitData({ label: '', ip: '' });
      toast.success('Git server added successfully');
    } catch (error) {
      toast.error(`Error adding git server: ${error.message}`);
    }
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
    setNewGitData({ label: '', ip: '' });
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

        {/* Add New Git Server Button */}
        <button 
          onClick={handleAddNew}
          style={{
            background: 'linear-gradient(90deg, #1976d2 60%, #1565c0 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '1.1em',
            padding: '0.8em 1.5em',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(25, 118, 210, 0.3)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 12px rgba(25, 118, 210, 0.3)';
          }}
        >
          <span style={{ fontSize: '1.2em' }}>➕</span>
          Add New Git Server
        </button>

        {/* Add New Git Server Form */}
        {showAddForm && (
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: 16,
            padding: '1.5em',
            border: '2px solid #dee2e6',
            width: '100%',
            maxWidth: 500,
            marginBottom: 16,
          }}>
            <h3 style={{ margin: '0 0 1em 0', color: '#495057', fontSize: '1.3em' }}>Add New Git Server</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: '#495057' }}>Label:</label>
                <input
                  type="text"
                  value={newGitData.label}
                  onChange={e => setNewGitData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Git 5"
                  style={{
                    width: '100%',
                    padding: '0.6em',
                    border: '1px solid #ced4da',
                    borderRadius: 8,
                    fontSize: '1em',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: '#495057' }}>IP Address:</label>
                <input
                  type="text"
                  value={newGitData.ip}
                  onChange={e => setNewGitData(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="e.g., 192.168.1.100"
                  style={{
                    width: '100%',
                    padding: '0.6em',
                    border: '1px solid #ced4da',
                    borderRadius: 8,
                    fontSize: '1em',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={handleAddSave}
                  style={{
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '1em',
                    padding: '0.6em 1.2em',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleAddCancel}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '1em',
                    padding: '0.6em 1.2em',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}