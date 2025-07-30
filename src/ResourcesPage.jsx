import React, { useState, useEffect } from 'react';
import { getTrash, saveTrash, getResourcesPaginated, saveResource, deleteResource, getResourceSections, saveResourceSections, saveHistoryLog, loadHistoryLog, clearHistoryLog } from './firestoreHelpers';
import { toast } from 'sonner';

const initialLinks = {
  'Site Audit': [
    { name: 'Sample Audit Sheet', url: 'https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F' }
  ],
  'Keyword Research': [
    { name: 'KW Research Template', url: 'https://docs.google.com/spreadsheets/d/7G8H9I0J1K2L' }
  ],
  'Other Sheets': [
    { name: 'Misc Sheet', url: 'https://docs.google.com/spreadsheets/d/3M4N5O6P7Q8R' }
  ]
};

const sectionOrder = ['Site Audit', 'Keyword Research', 'Other Sheets'];

export default function ResourcesPage({ darkMode, setDarkMode }) {
  const [links, setLinks] = useState({});
  const [sections, setSections] = useState(['Site Audit', 'Keyword Research', 'Other Sheets']);
  const [loading, setLoading] = useState(true);
  const [openLink, setOpenLink] = useState({});
  const [copied, setCopied] = useState({});
  // Pagination state per section
  const [pagination, setPagination] = useState({}); // { [section]: { lastDoc, hasMore, loadingMore } }
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: enter, 2: choose section
  const [modalTitle, setModalTitle] = useState('');
  const [modalUrl, setModalUrl] = useState('');
  const [pendingLink, setPendingLink] = useState(null);
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ open: false, section: null, idx: null, link: null });
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [deleteTableModal, setDeleteTableModal] = useState({ open: false, section: null });


  // --- History Log State ---
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set());
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  // History entry structure
  const createHistoryEntry = (resourceId, section, name, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    resourceId,
    section,
    name,
    field,
    oldValue,
    newValue,
    action
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev.slice(0, 49)]);
    setRecentChanges(prev => new Set([...prev, entry.resourceId]));
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.resourceId);
        return newSet;
      });
    }, 5000);
  };

  const revertChange = async (historyEntry) => {
    setRevertModal(historyEntry);
  };

  const confirmRevert = async () => {
    const historyEntry = revertModal;
    try {
      const field = historyEntry.field;
      const value = historyEntry.oldValue;
      setLinks(prev => {
        const newLinks = { ...prev };
        newLinks[historyEntry.section] = (newLinks[historyEntry.section] || []).map(r => r.id === historyEntry.resourceId ? { ...r, [field]: value } : r);
        return newLinks;
      });
      await saveResource({ ...links[historyEntry.section].find(r => r.id === historyEntry.resourceId), [field]: value });
      const revertEntry = createHistoryEntry(
        historyEntry.resourceId,
        historyEntry.section,
        historyEntry.name,
        historyEntry.field,
        historyEntry.newValue,
        historyEntry.oldValue,
        'reverted'
      );
      addToHistory(revertEntry);
      setRevertModal(null);
    } catch (err) {
      alert('Failed to revert change. Please try again.');
    }
  };

  // LocalStorage cache key
  const RESOURCES_CACHE_KEY = 'resources_cache_v1';

  // Fetch paginated resources for a section
  const fetchResources = async (section, loadMore = false) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), loadingMore: true }
    }));
    try {
      let startAfterDoc = loadMore && pagination[section]?.lastDoc ? pagination[section].lastDoc : null;
      const { items, lastDoc, hasMore } = await getResourcesPaginated(20, startAfterDoc);
      setLinks(prev => ({
        ...prev,
        [section]: loadMore ? [...(prev[section] || []), ...items.filter(i => i.section === section)] : items.filter(i => i.section === section)
      }));
      setPagination(prev => ({
        ...prev,
        [section]: { lastDoc, hasMore, loadingMore: false }
      }));
      // Cache in localStorage
      if (!loadMore) {
        const cache = JSON.parse(localStorage.getItem(RESOURCES_CACHE_KEY) || '{}');
        cache[section] = { items: items.filter(i => i.section === section), lastDocId: lastDoc?.id || null, ts: Date.now() };
        localStorage.setItem(RESOURCES_CACHE_KEY, JSON.stringify(cache));
      }
    } catch (e) {
      setPagination(prev => ({ ...prev, [section]: { ...(prev[section] || {}), loadingMore: false } }));
    }
    setLoading(false);
  };

  // On mount: try cache, then fetch for each section
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const loadedSections = await getResourceSections();
        setSections(loadedSections);
        const grouped = {};
        const pag = {};
        const cache = JSON.parse(localStorage.getItem(RESOURCES_CACHE_KEY) || '{}');
        for (const s of loadedSections) {
          if (cache[s] && Array.isArray(cache[s].items) && Date.now() - cache[s].ts < 1000 * 60 * 10) {
            grouped[s] = cache[s].items;
            pag[s] = { lastDoc: null, hasMore: true, loadingMore: false };
            // Still fetch latest in background
            fetchResources(s, false);
          } else {
            grouped[s] = [];
            pag[s] = { lastDoc: null, hasMore: true, loadingMore: false };
            fetchResources(s, false);
          }
        }
        setLinks(grouped);
        setPagination(pag);
      } catch (e) {
        setLoading(false);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('resources');
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('resources', history).catch(err => {
        console.error('Error saving history:', err);
      });
    }
  }, [history]);

  const handleCopy = (section, url) => {
    navigator.clipboard.writeText(url);
    setCopied({ ...copied, [section]: url });
    setTimeout(() => setCopied({ ...copied, [section]: null }), 1200);
  };

  const handleModalAdd = () => {
    if (!modalTitle.trim() || !modalUrl.trim()) return;
    
    const newResource = {
      name: modalTitle.trim(),
      url: modalUrl.trim(),
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    // Optimistically update UI
    setLinks(l => ({
      ...l,
      [pendingLink]: [...(l[pendingLink] || []), newResource]
    }));
    setModalOpen(false);
    setModalStep(1);
    setModalTitle('');
    setModalUrl('');
    setPendingLink(null);
    
    

    // Add to history for add
    addToHistory(createHistoryEntry(newResource.id, pendingLink, newResource.name, 'created', '', 'Resource created'));

    // Firestore operations in background
    (async () => {
      try {
        await saveResource(newResource);
      } catch (e) {
        // Revert optimistic update on error
        setLinks(l => ({
          ...l,
          [pendingLink]: l[pendingLink].filter(r => r.id !== newResource.id)
        }));
        alert('Failed to save resource to database. Please try again.');
        console.error('Failed to save resource:', e);
      }
    })();
  };

  const handleSectionSelect = async (section) => {
    if (!pendingLink) return;
    // Create resource object with id
    const resource = {
      id: `${Date.now()}-${section}-${pendingLink.name}`,
      name: pendingLink.name,
      url: pendingLink.url,
      section
    };
    // Optimistically update UI
    setLinks(l => ({
      ...l,
      [section]: [...(l[section] || []), resource]
    }));
    setModalOpen(false);
    setModalStep(1);
    setModalTitle('');
    setModalUrl('');
    setPendingLink(null);
    toast.success('Resource added successfully');
    // Add to history for add
    addToHistory(createHistoryEntry(resource.id, section, resource.name, 'created', '', 'Resource created'));
    // Save to Firestore in background
    saveResource(resource).catch(e => {
      // Remove from UI if save fails
      setLinks(l => ({
        ...l,
        [section]: l[section].filter(r => r.id !== resource.id)
      }));
      alert('Failed to save resource to database. Please try again.');
      console.error('Failed to save resource:', e);
    });
  };

  const handleDelete = (section, idx) => {
    const link = links[section][idx];
    setDeleteModal({ open: true, section, idx, link });
  };

  const confirmDelete = () => {
    const { section, idx, link } = deleteModal;
    if (section == null || idx == null) {
      setDeleteModal({ open: false, section: null, idx: null, link: null });
      return;
    }
    // Optimistically update UI and close modal
    setLinks(l => ({
      ...l,
      [section]: l[section].filter((_, i) => i !== idx)
    }));
    setDeleteModal({ open: false, section: null, idx: null, link: null });
    toast.success('Resource deleted successfully');
    
    // Add to history for delete
    addToHistory(createHistoryEntry(link.id, section, link.name, 'deleted', '', 'Resource deleted'));
    // Firestore operations in background
    (async () => {
      try {
        await deleteResource(link.id);
      } catch (e) {
        console.error('Failed to delete resource from Firestore:', e);
        alert('Failed to delete resource from database.');
      }
      // Add to global trash in Firestore
      const trashedItem = {
        id: `${Date.now()}-${section}-${link.name}`,
        type: 'resource',
        section,
        name: link.name,
        url: link.url
      };
      try {
        const currentTrash = await getTrash();
        await saveTrash([...(currentTrash || []), trashedItem]);
      } catch (e) {
        // Optionally show error
        console.error('Failed to update trash:', e);
        alert('Failed to update trash.');
      }
    })();
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, section: null, idx: null, link: null });
  };

  // Add new table logic
  const handleAddTable = async () => {
    const name = newTableName.trim();
    if (!name || sections.includes(name)) return;
    const updatedSections = [...sections, name];
    setSections(updatedSections);
    setLinks(l => ({ ...l, [name]: [] }));
    setShowAddTable(false);
    setNewTableName('');
    toast.success('Table added successfully');
    
    // Save to Firestore
    try {
      await saveResourceSections(updatedSections);
    } catch (e) {
      alert('Failed to save new table.');
      console.error('Failed to save new table:', e);
    }
  };

  // Delete table logic
  const handleDeleteTable = (section) => {
    setDeleteTableModal({ open: true, section });
  };

  const confirmDeleteTable = () => {
    const section = deleteTableModal.section;
    if (!section) {
      setDeleteTableModal({ open: false, section: null });
      return;
    }
    // Optimistically update UI and close modal
    const updatedSections = sections.filter(s => s !== section);
    setSections(updatedSections);
    setLinks(l => {
      const newLinks = { ...l };
      delete newLinks[section];
      return newLinks;
    });
    setDeleteTableModal({ open: false, section: null });
    toast.success('Table deleted successfully');
    
    // Firestore operations in background
    (async () => {
      try {
        await saveResourceSections(updatedSections);
      } catch (e) {
        alert('Failed to update table list.');
        console.error('Failed to update table list:', e);
      }
      // Remove all resources in this section from Firestore and move to Trash
      const resourcesToDelete = links[section] || [];
      for (const link of resourcesToDelete) {
        try {
          await deleteResource(link.id);
        } catch (e) {
          console.error('Failed to delete resource from Firestore:', e);
        }
      }
      // Add all to Trash
      if (resourcesToDelete.length > 0) {
        try {
          const currentTrash = await getTrash();
          const trashedItems = resourcesToDelete.map(link => ({
            id: `${Date.now()}-${section}-${link.name}`,
            type: 'resource',
            section,
            name: link.name,
            url: link.url
          }));
          await saveTrash([...(currentTrash || []), ...trashedItems]);
        } catch (e) {
          console.error('Failed to update trash:', e);
        }
      }
    })();
  };

  const cancelDeleteTable = () => {
    setDeleteTableModal({ open: false, section: null });
  };

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('resources');
    setClearHistoryModal(false);
  };

  return (
    <div className="resources-page" style={{ minHeight: '100vh', background: darkMode ? '#181a1b' : '#f7f6f2' }}>
      {/* Header with History Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', maxWidth: 900, width: '100%', margin: '0 auto 24px auto', paddingTop: 36 }}>
        <h1 className="fancy-title" style={{ fontSize: '2.1em', fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>Resources</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 16px',
            background: showHistory ? '#1976d2' : '#f8f9fa',
            color: showHistory ? '#ffffff' : '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
        </button>
      </div>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2000 }}>
          <div className="spinner" style={{
            border: '6px solid #e0e7ef',
            borderTop: '6px solid #1976d2',
            borderRadius: '50%',
            width: 48,
            height: 48,
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* History Panel */}
      {showHistory && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e0e7ef',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '30px',
          position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto 30px'
        }}>
          {/* Icon-only Clear History button in upper right */}
          <button
            onClick={() => setClearHistoryModal(true)}
            title="Clear History"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.18s',
              zIndex: 1
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f8d7da'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {/* Trash can SVG icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <div style={{ paddingRight: '40px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#495057' }}>History Log</h3>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '16px', marginTop: '20px' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', margin: '30px 0', fontSize: '1.1rem' }}>
                No history entries yet
              </p>
            ) : (
              <div>
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      border: '1px solid #e9ecef',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      background: entry.action === 'reverted' ? '#fff3cd' : '#ffffff',
                      borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : '4px solid #1976d2',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#495057', 
                        marginBottom: '6px', 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          flex: '1', 
                          minWidth: 0, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: '#1976d2',
                          fontWeight: '600'
                        }}>
                          {entry.name}
                        </span>
                        <span style={{ 
                          color: '#1976d2',
                          fontWeight: '500', 
                          whiteSpace: 'nowrap',
                          opacity: 0.85
                        }}>
                          {entry.section}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.95rem', 
                        color: '#6c757d', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{entry.field}:</span>
                        <span style={{ 
                          color: entry.oldValue === 'Completed' ? '#28a745' : entry.oldValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.oldValue}</span>
                        <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                        <span style={{ 
                          color: entry.newValue === 'Completed' ? '#28a745' : entry.newValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.newValue}</span>
                        {entry.action === 'reverted' && (
                          <span style={{ 
                            color: '#ffc107', 
                            marginLeft: '4px', 
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <span style={{ fontSize: '1.1em', lineHeight: 1 }}>🔄</span> Reverted
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#adb5bd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '0.9em' }}>🕒</span>
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                    {entry.action !== 'reverted' && (
                      <button
                        onClick={() => revertChange(entry)}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#6c757d',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          marginLeft: '8px',
                          alignSelf: 'center',
                          whiteSpace: 'nowrap',
                          height: '32px'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#e9ecef';
                          e.currentTarget.style.borderColor = '#ced4da';
                          e.currentTarget.style.color = '#495057';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.color = '#6c757d';
                        }}
                      >
                        <span style={{ fontSize: '1.1em', lineHeight: 1, marginRight: '1px' }}>↩️</span>
                        Revert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.18)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 4px 32px #e0e7ef',
            padding: '2em 2.5em 2em 2.5em',
            minWidth: 320,
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1em', color: '#d32f2f', marginBottom: 8 }}>Are you sure you want to delete?</div>
            <div style={{ color: '#1976d2', fontWeight: 600, fontSize: '1em', marginBottom: 8 }}>{deleteModal.link?.name}</div>
            <div style={{ display: 'flex', gap: 18 }}>
              <button
                style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.5em 1.3em', cursor: 'pointer' }}
                onClick={confirmDelete}
              >Yes, Delete</button>
              <button
                style={{ background: '#bdbdbd', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.5em 1.3em', cursor: 'pointer' }}
                onClick={cancelDelete}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete table confirmation modal */}
      {deleteTableModal.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.18)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 4px 32px #e0e7ef',
            padding: '2em 2.5em 2em 2.5em',
            minWidth: 320,
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1em', color: '#d32f2f', marginBottom: 8 }}>Are you sure you want to delete the table "{deleteTableModal.section}" and all its resources?</div>
            <div style={{ display: 'flex', gap: 18 }}>
              <button
                style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.5em 1.3em', cursor: 'pointer' }}
                onClick={confirmDeleteTable}
              >Yes, Delete Table</button>
              <button
                style={{ background: '#bdbdbd', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.5em 1.3em', cursor: 'pointer' }}
                onClick={cancelDeleteTable}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal overlay */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.18)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 4px 32px #e0e7ef',
            padding: '2.5em 2.5em 2em 2.5em',
            minWidth: 340,
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
          }}>
            <button
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}
              onClick={() => { setModalOpen(false); setModalStep(1); setModalTitle(''); setModalUrl(''); setPendingLink(null); }}
              aria-label="Close"
            >×</button>
            {modalStep === 1 && (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.25em', color: '#1976d2', marginBottom: 4 }}>Add Resource Link</div>
                <input
                  type="text"
                  name="resourceTitle"
                  placeholder="Title"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  style={{
                    border: '1.5px solid #b6b6d8',
                    borderRadius: 8,
                    padding: '0.5em 0.9em',
                    fontSize: '1em',
                    width: 220,
                  }}
                />
                <input
                  type="text"
                  name="resourceUrl"
                  placeholder="Paste link here"
                  value={modalUrl}
                  onChange={e => setModalUrl(e.target.value)}
                  style={{
                    border: '1.5px solid #b6b6d8',
                    borderRadius: 8,
                    padding: '0.5em 0.9em',
                    fontSize: '1em',
                    width: 220,
                  }}
                />
                <button
                  style={{
                    background: 'linear-gradient(90deg, #388e3c 60%, #81c784 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '1em',
                    padding: '0.5em 1.3em',
                    cursor: 'pointer',
                    marginTop: 8,
                    boxShadow: '0 1px 6px #ececec',
                  }}
                  onClick={handleModalAdd}
                >
                  Add
                </button>
              </>
            )}
            {modalStep === 2 && (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.1em', color: '#1976d2', marginBottom: 8 }}>Which section to add?</div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
                  {sections.map(section => (
                    <button
                      key={section}
                      style={{
                        background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '1em',
                        padding: '0.7em 1.5em',
                        cursor: 'pointer',
                        boxShadow: '0 1px 6px #ececec',
                      }}
                      onClick={() => handleSectionSelect(section)}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <button
                  style={{
                    background: 'linear-gradient(90deg, #388e3c 60%, #81c784 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '1em',
                    padding: '0.5em 1.3em',
                    cursor: 'pointer',
                    marginTop: 8,
                    boxShadow: '0 1px 6px #ececec',
                  }}
                  onClick={() => setShowAddTable(true)}
                >
                  + Add New Table
                </button>
                {showAddTable && (
                  <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      name="tableName"
                      placeholder="New table name"
                      value={newTableName}
                      onChange={e => setNewTableName(e.target.value)}
                      style={{
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 8,
                        padding: '0.5em 0.9em',
                        fontSize: '1em',
                        width: 220,
                      }}
                    />
                    <button
                      style={{
                        background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '1em',
                        padding: '0.5em 1.3em',
                        cursor: 'pointer',
                        marginTop: 4,
                        boxShadow: '0 1px 6px #ececec',
                      }}
                      onClick={handleAddTable}
                    >
                      Add Table
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* Hide main content while loading */}
      {!loading && (
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
          gap: 36,
          border: '1.5px solid #e0e7ef',
        }}>
          {/* Add button aligned right inside card */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              style={{
                background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '1.1em',
                padding: '0.6em 2.1em',
                cursor: 'pointer',
                boxShadow: '0 1px 6px #ececec',
              }}
              onClick={() => { setModalOpen(true); setModalStep(1); }}
            >
              Add
            </button>
          </div>
          <h1 className="fancy-title" style={{ fontSize: '2.1em', fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>Resources</h1>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sections.map(section => (
              <div key={section} style={{
                background: '#f7f6f2',
                borderRadius: 16,
                boxShadow: '0 2px 12px #ececec',
                border: '1.5px solid #e0e7ef',
                padding: '1.5em 2em',
                marginBottom: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'flex-start',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.25em', color: '#1976d2', marginBottom: 4, flex: 1 }}>{section}</span>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d32f2f',
                      fontWeight: 900,
                      fontSize: '1.2em',
                      marginLeft: 8,
                      cursor: 'pointer',
                    }}
                    title="Delete Table"
                    onClick={() => handleDeleteTable(section)}
                  >
                    ×
                  </button>
                </div>
                {/* Accordion-style list of links */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {links[section] && links[section].length > 0 ? (
                    links[section].map((link, idx) => (
                      <div key={idx} style={{ width: '100%' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: '#fff',
                            borderRadius: 8,
                            border: '1.5px solid #b6b6d8',
                            boxShadow: '0 1px 6px #ececec',
                            padding: '0.5em 1em',
                            width: '100%',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#1976d2',
                          }}
                          onClick={() => setOpenLink(o => ({ ...o, [section]: o[section] === idx ? null : idx }))}
                        >
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.name}</span>
                          <span style={{ fontSize: '1.1em', color: '#888', marginLeft: 8 }}>{openLink[section] === idx ? '▲' : '▼'}</span>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#d32f2f',
                              fontWeight: 900,
                              fontSize: '1.2em',
                              marginLeft: 8,
                              cursor: 'pointer',
                            }}
                            title="Delete"
                            onClick={e => { e.stopPropagation(); handleDelete(section, idx); }}
                          >
                            ×
                          </button>
                        </div>
                        {openLink[section] === idx && (
                          <div style={{
                            background: '#f7f6f2',
                            borderRadius: 8,
                            border: '1.5px solid #b6b6d8',
                            boxShadow: '0 1px 6px #ececec',
                            marginTop: 2,
                            marginBottom: 8,
                            padding: '0.7em 1.2em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}>
                            <span style={{ color: '#1976d2', fontWeight: 500, fontSize: '0.98em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</span>
                            <button
                              style={{
                                background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: '0.98em',
                                padding: '0.3em 1.1em',
                                cursor: 'pointer',
                                marginLeft: 8,
                              }}
                              onClick={e => { e.stopPropagation(); handleCopy(section, link.url); }}
                            >
                              {copied[section] === link.url ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#888', fontStyle: 'italic', padding: '0.5em 1em' }}>No links yet</div>
                  )}
                  {/* Load more button for section */}
                  {pagination[section]?.hasMore && !pagination[section]?.loadingMore && (
                    <button onClick={() => fetchResources(section, true)} style={{ margin: 8, padding: '6px 18px', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, border: 'none', fontSize: 15, cursor: 'pointer' }}>
                      Load more
                    </button>
                  )}
                  {pagination[section]?.loadingMore && (
                    <div style={{ color: '#888', fontStyle: 'italic', padding: '0.5em 1em' }}>Loading more...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.18)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 4px 32px #e0e7ef',
            padding: '2em 2.5em 2em 2.5em',
            minWidth: 320,
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1em', color: '#d32f2f', marginBottom: 8 }}>Are you sure you want to clear all history?</div>
            <div style={{ display: 'flex', gap: 18 }}>
              <button
                style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.5em 1.3em', cursor: 'pointer' }}
                onClick={handleClearHistory}
              >Yes, Clear</button>
              <button
                style={{ background: '#bdbdbd', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1em', padding: '0.5em 1.3em', cursor: 'pointer' }}
                onClick={() => setClearHistoryModal(false)}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 