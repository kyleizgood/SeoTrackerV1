import React, { useState, useEffect } from 'react';
import { getTrash, saveTrash, getResources, saveResource, deleteResource, getResourceSections, saveResourceSections } from './firestoreHelpers';

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

export default function ResourcesPage() {
  const [links, setLinks] = useState({});
  const [sections, setSections] = useState(['Site Audit', 'Keyword Research', 'Other Sheets']);
  const [loading, setLoading] = useState(true);
  const [openLink, setOpenLink] = useState({});
  const [copied, setCopied] = useState({});
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

  // Load resources from Firestore on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const loadedSections = await getResourceSections();
        setSections(loadedSections);
        // Initialize links object for all sections
        const grouped = {};
        loadedSections.forEach(s => { grouped[s] = []; });
        const resources = await getResources();
        resources.forEach(r => {
          if (grouped[r.section]) grouped[r.section].push(r);
        });
        setLinks(grouped);
      } catch (e) {
        // Optionally handle error
        console.error('Failed to load resources or sections:', e);
      }
      setLoading(false);
    })();
  }, []);

  const handleCopy = (section, url) => {
    navigator.clipboard.writeText(url);
    setCopied({ ...copied, [section]: url });
    setTimeout(() => setCopied({ ...copied, [section]: null }), 1200);
  };

  const handleModalAdd = () => {
    if (!modalTitle.trim() || !modalUrl.trim()) return;
    setPendingLink({ name: modalTitle.trim(), url: modalUrl.trim() });
    setModalStep(2);
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

  return (
    <section style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f7f6f2 60%, #e0e7ef 100%)', position: 'relative' }}>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
} 