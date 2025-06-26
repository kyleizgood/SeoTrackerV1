import React, { useState, useEffect } from 'react';

const TEMPLATE_KEY = 'templates';
const TEMPLATE_TRASH_KEY = 'template-trash';

const TemplateTrash = () => {
  const [trash, setTrash] = useState(() => {
    return JSON.parse(localStorage.getItem(TEMPLATE_TRASH_KEY) || '[]');
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_TRASH_KEY, JSON.stringify(trash));
  }, [trash]);

  const handleRestore = (template) => {
    // Remove from trash
    const updatedTrash = trash.filter(t => t.id !== template.id);
    setTrash(updatedTrash);
    localStorage.setItem(TEMPLATE_TRASH_KEY, JSON.stringify(updatedTrash));
    // Restore to templates
    const saved = localStorage.getItem(TEMPLATE_KEY);
    const templates = saved ? JSON.parse(saved) : [];
    if (!templates.some(t => t.id === template.id)) {
      templates.push(template);
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
    }
  };

  const handleDeleteForever = (template) => {
    setConfirmDeleteId(template.id);
  };

  const handleDeleteConfirm = () => {
    const updatedTrash = trash.filter(t => t.id !== confirmDeleteId);
    setTrash(updatedTrash);
    localStorage.setItem(TEMPLATE_TRASH_KEY, JSON.stringify(updatedTrash));
    setConfirmDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null);
  };

  // Delete all logic
  const handleDeleteAll = () => {
    setShowDeleteAll(true);
  };
  const handleDeleteAllConfirm = () => {
    setTrash([]);
    localStorage.setItem(TEMPLATE_TRASH_KEY, JSON.stringify([]));
    setShowDeleteAll(false);
  };
  const handleDeleteAllCancel = () => {
    setShowDeleteAll(false);
  };

  // Filtered trash based on search
  const filteredTrash = trash.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="company-tracker-page">
      <h1 className="trash-header">Template Trash</h1>
      <div className="table-scroll-container table-responsive">
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
            {filteredTrash.map(template => (
              <tr key={template.id}>
                <td style={{ fontWeight: 700, fontSize: '1.13rem', color: '#232323', background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #4e342e', letterSpacing: '0.02em' }}>{template.title}</td>
                <td style={{ maxWidth: 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fff8f8' }}>{template.content}</td>
                <td>
                  <button className="trash-action-btn restore" onClick={() => handleRestore(template)}>Restore</button>
                  <button className="trash-action-btn delete" onClick={() => handleDeleteForever(template)}>Delete Forever</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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