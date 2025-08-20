import React, { useState, useEffect } from 'react';
import { getTrash, saveTrash, saveTemplate, saveTicket, saveCompany, getPackages, savePackages, getCategories, saveCategories, deleteTemplate } from './firestoreHelpers';
import { toast } from 'sonner';
import './TemplateTrash.css'; // New import for modern styles

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
    try {
      await saveTemplate(item);
      const updatedTrash = trash.filter(t => t.id !== item.id);
      setTrash(updatedTrash);
      await saveTrash(updatedTrash);
      toast.success('Template restored successfully');
    } catch (error) {
      console.error('Error restoring template:', error);
      alert('Error restoring template');
    }
  };

  const handleDeleteForever = (template) => {
    setConfirmDeleteId(template.id);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTemplate(confirmDeleteId);
      const updatedTrash = trash.filter(t => t.id !== confirmDeleteId);
      setTrash(updatedTrash);
      await saveTrash(updatedTrash);
      setConfirmDeleteId(null);
      toast.success('Template permanently deleted');
      
    } catch (error) {
      console.error('Error deleting template permanently:', error);
      alert('Error deleting template');
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null);
  };

  // Delete all logic
  const handleDeleteAll = () => {
    setShowDeleteAll(true);
  };
  const handleDeleteAllConfirm = async () => {
    try {
      // Delete all templates permanently
      for (const template of trash) {
        await deleteTemplate(template.id);
      }
      setTrash([]);
      await saveTrash([]);
      setShowDeleteAll(false);
      toast.success('All templates permanently deleted');
      
    } catch (error) {
      console.error('Error deleting all templates:', error);
      alert('Error deleting all templates');
    }
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
    <div className={`trash-modern${darkMode ? ' dark' : ''}`}>
      <h1 className="trash-header">Template Trash</h1>
      
      {(!Array.isArray(trash) || trash.length === 0) && (
        <div className="trash-empty-state">
          {trash.length === 0 ? 'Trash is empty or you are not logged in.' : 'Unable to load trash. Please log in.'}
        </div>
      )}

      {Array.isArray(trash) && trash.length > 0 && (
        <>
          {/* Search container */}
          <div className="trash-search-container">
            <div className="trash-search-wrapper">
              <span className="trash-search-icon">🔍</span>
              <input
                type="text"
                className="trash-search-input"
                placeholder="Search trashed templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table container */}
          <div className="trash-table-container">
            <table className="trash-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th style={{ textAlign: 'right' }}>
                    <button className="trash-action-btn delete-all" onClick={handleDeleteAll}>
                      Delete All
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrash.length === 0 && (
                  <tr>
                    <td colSpan={3} className="trash-empty-row">
                      {search ? 'No templates found matching your search.' : 'Trash is empty.'}
                    </td>
                  </tr>
                )}
                {filteredTrash.map((template, idx) => (
                  <tr key={template.id || idx}>
                    <td className="trash-title-cell">
                      {template.title || template.subject || template.name || 'No Title'}
                    </td>
                    <td className="trash-content-cell">
                      {template.content || template.company || template.ticketId || template.package || template.status || 'No Content'}
                    </td>
                    <td className="trash-actions-cell">
                      <div className="trash-action-buttons">
                        <button className="trash-action-btn restore" onClick={() => handleRestore(template)}>
                          Restore
                        </button>
                        <button className="trash-action-btn delete" onClick={() => handleDeleteForever(template)}>
                          Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirmation Modal for Delete */}
      {confirmDeleteId && (
        <div className="trash-modal-overlay">
          <div className="trash-modal">
            <div className="trash-modal-title">Delete Template Forever?</div>
            <div className="trash-modal-desc">Are you sure you want to permanently delete this template? This action cannot be undone.</div>
            <div className="trash-modal-buttons">
              <button className="trash-modal-btn delete" onClick={handleDeleteConfirm}>
                Yes, Delete Forever
              </button>
              <button className="trash-modal-btn cancel" onClick={handleDeleteCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete All */}
      {showDeleteAll && (
        <div className="trash-modal-overlay">
          <div className="trash-modal">
            <div className="trash-modal-title">Delete All Templates?</div>
            <div className="trash-modal-desc">Are you sure you want to permanently delete all items in the trash? This action cannot be undone.</div>
            <div className="trash-modal-buttons">
              <button className="trash-modal-btn delete" onClick={handleDeleteAllConfirm}>
                Yes, Delete All
              </button>
              <button className="trash-modal-btn cancel" onClick={handleDeleteAllCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateTrash; 