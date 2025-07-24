import React, { useState, useEffect } from 'react';
import { getTrash, saveTrash, saveTemplate, saveTicket, saveCompany, getPackages, savePackages, getCategories, saveCategories } from './firestoreHelpers';

const TemplateTrash = ({ darkMode, setDarkMode }) => {
  const [trash, setTrash] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    // Fetch trash from Firestore
    getTrash()
      .then(data => setTrash(Array.isArray(data) ? data : []))
      .catch(() => setTrash([]));
  }, []);

  // Helper to refresh trash from Firestore
  const refreshTrash = async () => {
    try {
      const data = await getTrash();
      setTrash(Array.isArray(data) ? data : []);
    } catch {
      setTrash([]);
    }
  };

  const handleRestore = async (item) => {
    // Remove from trash
    const updatedTrash = trash.filter(t => t.id !== item.id && t.name !== item.name);
    await saveTrash(updatedTrash);
    // Restore to the correct collection
    if (item.type === 'template') {
      await saveTemplate({ ...item });
    } else if (item.type === 'ticket') {
      await saveTicket({ ...item });
    } else if (item.type === 'company') {
      if (item.originalPackage) {
        const packages = await getPackages();
        if (!packages[item.originalPackage]) packages[item.originalPackage] = [];
        if (!packages[item.originalPackage].some(c => c.id === item.id)) {
          packages[item.originalPackage].push({ ...item });
          await savePackages(packages);
        }
      } else {
        await saveCompany({ ...item });
      }
    } else if (item.type === 'category') {
      // Restore category to categories list
      const categories = await getCategories();
      if (!categories.includes(item.name)) {
        const updated = [item.name, ...categories];
        await saveCategories(updated);
      }
    }
    refreshTrash();
  };

  const handleDeleteForever = (template) => {
    setConfirmDeleteId(template.id);
  };

  const handleDeleteConfirm = async () => {
    const updatedTrash = trash.filter(t => t.id !== confirmDeleteId);
    await saveTrash(updatedTrash);
    setConfirmDeleteId(null);
    refreshTrash();
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null);
  };

  // Delete all logic
  const handleDeleteAll = () => {
    setShowDeleteAll(true);
  };
  const handleDeleteAllConfirm = async () => {
    await saveTrash([]);
    setShowDeleteAll(false);
    refreshTrash();
  };
  const handleDeleteAllCancel = () => {
    setShowDeleteAll(false);
  };

  // Filtered trash based on search
  const filteredTrash = Array.isArray(trash) ? trash.filter(t =>
    (t?.title?.toLowerCase?.() || '').includes(search.toLowerCase()) ||
    (t?.content?.toLowerCase?.() || '').includes(search.toLowerCase())
  ) : [];

  return (
    <section className="company-tracker-page" style={{ background: darkMode ? '#181a1b' : '#f7f6f2', minHeight: '100vh' }}>
      <h1 className="trash-header">Template Trash</h1>
      {(!Array.isArray(trash) || trash.length === 0) && (
        <div style={{ color: '#b00', margin: '1em 0', fontWeight: 600 }}>
          {trash.length === 0 ? 'Trash is empty or you are not logged in.' : 'Unable to load trash. Please log in.'}
        </div>
      )}
      <div className="table-scroll-container table-responsive">
        <div className="responsive-table-wrapper">
          <table className="company-table trash-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span>Title</span>
                    <input
                      type="text"
                      className="package-search-input"
                      style={{ minWidth: 180, marginTop: 6 }}
                      placeholder="Search trashed templates..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </th>
                <th>Content</th>
                <th style={{ minWidth: 120, textAlign: 'right' }}>
                  {trash.length > 0 && (
                    <button className="trash-action-btn delete" style={{ minWidth: 100, marginLeft: 8 }} onClick={handleDeleteAll}>
                      Delete All
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTrash.length === 0 && (
                <tr><td colSpan={3} className="trash-empty">Trash is empty.</td></tr>
              )}
              {filteredTrash.map((template, idx) => (
                <tr key={template.id || idx}>
                  <td style={{ fontWeight: 700, fontSize: '1.13rem', color: '#232323', background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #4e342e', letterSpacing: '0.02em' }}>
                    {template.title || template.subject || template.name || 'No Title'}
                  </td>
                  <td style={{ maxWidth: 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fff8f8' }}>
                    {template.content || template.company || template.ticketId || template.package || template.status || 'No Content'}
                  </td>
                  <td>
                    <button className="trash-action-btn restore" onClick={() => handleRestore(template)}>Restore</button>
                    <button className="trash-action-btn delete" onClick={() => handleDeleteForever(template)}>Delete Forever</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {confirmDeleteId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to permanently delete this template?</div>
            <div className="confirm-desc">This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleDeleteConfirm}>Yes, Delete Forever</button>
              <button className="confirm-btn cancel" onClick={handleDeleteCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAll && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to permanently delete all items in the trash?</div>
            <div className="confirm-desc">This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleDeleteAllConfirm}>Yes, Delete All</button>
              <button className="confirm-btn cancel" onClick={handleDeleteAllCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TemplateTrash; 