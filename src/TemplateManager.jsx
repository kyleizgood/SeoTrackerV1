import React, { useState, useEffect } from 'react';
import { getTemplates, saveTemplate, deleteTemplate, getTrash, saveTrash, getCategories, saveCategories } from './firestoreHelpers';
// Add paginated fetcher for templates
import { getDocs, collection, query, orderBy, limit as fsLimit, startAfter as fsStartAfter } from 'firebase/firestore';
import { db, auth } from './firebase';
import { toast } from 'sonner';

async function getTemplatesPaginated(limitCount = 20, startAfterDoc = null) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  let q = query(
    collection(db, 'users', user.uid, 'templates'),
    orderBy('createdAt', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterDoc) {
    q = query(
      collection(db, 'users', user.uid, 'templates'),
      orderBy('createdAt', 'desc'),
      fsStartAfter(startAfterDoc),
      fsLimit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  const hasMore = items.length === limitCount;
  return { items, lastDoc, hasMore };
}

const TRASH_KEY = 'company-trash';

const DEFAULT_CATEGORIES = [
  'Outreach',
  'Report',
  'SEO Audit',
  'Follow-up',
  'Client Communication',
  'Internal Note',
  'Proposal',
  'Other',
];

const TemplateManager = ({ darkMode, setDarkMode }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '', category: DEFAULT_CATEGORIES[0], customCategory: '' });
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const [openCategory, setOpenCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(null); // category name or null


  // LocalStorage cache key
  const TEMPLATES_CACHE_KEY = 'templates_cache_v1';

  // Fetch paginated templates (initial or more)
  const fetchTemplates = async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      let startAfterDoc = loadMore ? lastDoc : null;
      const { items: fetched, lastDoc: newLastDoc, hasMore: more } = await getTemplatesPaginated(20, startAfterDoc);
      setTemplates(prev => loadMore ? [...prev, ...fetched] : fetched);
      setLastDoc(newLastDoc);
      setHasMore(more);
      // Cache in localStorage
      if (!loadMore) localStorage.setItem(TEMPLATES_CACHE_KEY, JSON.stringify({ templates: fetched, lastDocId: newLastDoc?.id || null, ts: Date.now() }));
    } catch (e) {
      // Optionally handle error
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // On mount: try cache, then fetch
  useEffect(() => {
    const cache = localStorage.getItem(TEMPLATES_CACHE_KEY);
    if (cache) {
      const { templates: cachedTemplates, lastDocId, ts } = JSON.parse(cache);
      if (Array.isArray(cachedTemplates) && Date.now() - ts < 1000 * 60 * 30) { // 30 min cache to reduce Firestore reads
        setTemplates(cachedTemplates);
        setLoading(false);
        // Still fetch latest in background with longer delay
        setTimeout(() => {
          fetchTemplates(false);
        }, 5000); // 5 second delay for background fetch
        return;
      }
    }
    fetchTemplates(false);
  }, []);

  useEffect(() => {
    (async () => {
      const dbCategories = await getCategories();
      if (dbCategories && Array.isArray(dbCategories) && dbCategories.length > 0) {
        setCategories(dbCategories);
      }
    })();
  }, []);

  // Ensure form category is always valid after categories change
  React.useEffect(() => {
    if (!categories.includes(newTemplate.category)) {
      setNewTemplate(nt => ({ ...nt, category: categories[0] || 'Other', customCategory: '' }));
    }
  }, [categories]);

  // Trash logic
  const addToTrash = async (template) => {
    const trash = await getTrash();
    trash.push({ ...template, type: 'template' });
    await saveTrash(trash);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) return;

    const template = {
      ...newTemplate,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTemplate(template);
      setTemplates(prev => [template, ...prev]);
      setNewTemplate({ title: '', content: '', category: DEFAULT_CATEGORIES[0], customCategory: '' });
      toast.success('Template added successfully');

    } catch (error) {
      console.error('Error adding template:', error);
      alert('Error adding template');
    }
  };

  const handleEdit = (template) => {
    setNewTemplate({
      title: template.title,
      content: template.content,
      category: template.category || DEFAULT_CATEGORIES[0],
      customCategory: template.customCategory || ''
    });
    setIsEditing(true);
    setSelectedTemplate(template.id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) return;

    const updatedTemplate = {
      ...newTemplate,
      id: selectedTemplate,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTemplate(updatedTemplate);
      setTemplates(prev => prev.map(t => t.id === selectedTemplate ? updatedTemplate : t));
      setNewTemplate({ title: '', content: '', category: DEFAULT_CATEGORIES[0], customCategory: '' });
      setIsEditing(false);
      setSelectedTemplate(null);
      toast.success('Template updated successfully');

    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted successfully');

    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copied to clipboard!');
  };

  // Remove logic with confirmation
  const handleRemove = (id) => {
    setConfirmRemoveId(id);
  };

  const handleRemoveConfirm = async () => {
    try {
      const template = templates.find(t => t.id === confirmRemoveId);
      if (template) {
        await addToTrash(template);
      }
      await deleteTemplate(confirmRemoveId);
      setTemplates(prev => prev.filter(t => t.id !== confirmRemoveId));
      setConfirmRemoveId(null);
      toast.success('Template moved to trash successfully');

    } catch (error) {
      console.error('Error removing template:', error);
      alert('Error removing template');
    }
  };

  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
  };

  const toggleDropdown = (id) => {
    setSelectedTemplate(selectedTemplate === id ? null : id);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const updatedCategories = [...categories, newCategoryName];
      await saveCategories(updatedCategories);
      setCategories(updatedCategories);
      setNewCategoryName('');
      setShowCategoryInput(false);
      toast.success('Category added successfully');

    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category');
    }
  };

  // Replace handleDeleteCategory to show confirmation dialog
  const handleDeleteCategory = (cat) => {
    setConfirmDeleteCategory(cat);
  };

  // Confirm and cancel handlers
  const handleDeleteCategoryConfirm = async () => {
    try {
      const updatedCategories = categories.filter(c => c !== confirmDeleteCategory);
      await saveCategories(updatedCategories);
      setCategories(updatedCategories);
      setConfirmDeleteCategory(null);
      toast.success('Category deleted successfully');

    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };
  const handleDeleteCategoryCancel = () => {
    setConfirmDeleteCategory(null);
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});
  // Ensure 'Other' is always last in the categories and allCategories arrays
  const categoriesWithoutOther = categories.filter(c => c !== 'Other');
  const allCategoriesRaw = Array.from(new Set([...categoriesWithoutOther, ...Object.keys(groupedTemplates)]));
  const allCategories = [...allCategoriesRaw.filter(c => c !== 'Other'), 'Other'];

  return (
    <div className={`template-manager-2col modern-template-manager${darkMode ? ' dark' : ''}`}>
      {/* Left: Heading, desc, and form */}
      <div className="template-form-side template-card">
        <h1 className="template-title">Templates</h1>
        <p className="template-desc">Manage your templates and easily copy them when needed.</p>
        <form onSubmit={isEditing ? handleUpdate : handleAdd} className="template-form">
          <input
            type="text"
            name="templateTitle"
            className="template-input"
            placeholder="Enter template title"
            value={newTemplate.title}
            onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            required
          />
          <textarea
            name="templateContent"
            className="template-textarea"
            placeholder="Enter template content"
            value={newTemplate.content}
            onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
            required
          />
          <label style={{fontWeight: 600, marginTop: 4}}>Category</label>
          <select
            className="template-input"
            value={newTemplate.category}
            onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value, customCategory: '' })}
            style={{marginBottom: newTemplate.category === 'Other' ? 8 : 16}}
          >
            {[...categoriesWithoutOther, 'Other'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {newTemplate.category === 'Other' && (
            <input
              type="text"
              name="customCategory"
              className="template-input"
              placeholder="Enter custom category"
              value={newTemplate.customCategory}
              onChange={e => setNewTemplate({ ...newTemplate, customCategory: e.target.value })}
              required
            />
          )}
          <div className="template-form-btns">
            <button type="submit" className="template-btn primary">
              {isEditing ? 'Update Template' : 'Add Template'}
            </button>
            {isEditing && (
              <button type="button" className="template-btn secondary" onClick={() => {
                setIsEditing(false);
                setNewTemplate({ title: '', content: '', category: categories[0], customCategory: '' });
                setSelectedTemplate(null);
              }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      {/* Right: Template list grouped by category in drawers */}
      <div className="template-list-side template-card" style={{position: 'relative'}}>
        <div className="template-list-header" style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '10px',
        }}>
          <h2 className="template-list-title" style={{margin: 0, padding: 0, fontSize: '1.5rem', fontWeight: 700}}>Your Templates</h2>
          <div style={{display: 'flex', alignItems: 'center', marginLeft: 10}}>
            {!showCategoryInput && (
              <button
                className="template-btn primary"
                style={{ padding: '0.3em 0.8em', fontSize: '1.1em', border: '2px solid #1976d2', borderRadius: 6 }}
                title="Add Category"
                onClick={() => setShowCategoryInput(true)}
              >
                ➕
              </button>
            )}
            {showCategoryInput && (
              <form onSubmit={handleAddCategory} style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 0 }}>
                <input
                  type="text"
                  name="newCategoryName"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  autoFocus
                  style={{ padding: '0.3em 0.7em', fontSize: '1em', border: '1.5px solid #1976d2', borderRadius: 6, minWidth: 90 }}
                />
                <button type="submit" className="template-btn primary" style={{ padding: '0.3em 0.7em', fontSize: '1em', borderRadius: 6 }}>✔</button>
                <button type="button" className="template-btn secondary" style={{ padding: '0.3em 0.7em', fontSize: '1em', borderRadius: 6 }} onClick={() => { setShowCategoryInput(false); setNewCategoryName(""); }}>✖</button>
              </form>
            )}
          </div>
        </div>
        {allCategories.map(cat => (
          <div key={cat} className="template-category-drawer">
            <div className="template-category-header" style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{cursor: 'pointer'}} onClick={() => setOpenCategory(openCategory === cat ? null : cat)}>
                <span className="template-category-arrow">{openCategory === cat ? '\u25bc' : '\u25ba'}</span>
                <span className="template-category-title">{cat}</span>
                <span className="template-category-count">({(groupedTemplates[cat] || []).length})</span>
              </span>
              {cat !== 'Other' && (
                <button
                  className="icon-btn danger"
                  title="Delete category"
                  style={{marginLeft: 4, fontSize: '1.1em', padding: '0 0.5em'}} 
                  onClick={() => handleDeleteCategory(cat)}
                >
                  ×
                </button>
              )}
            </div>
            {openCategory === cat && (
              <>
                <div className="responsive-table-wrapper">
                  <table className="minimal-table">
                    <thead>
                      <tr>
                        <th style={{width: '30%'}}>Title</th>
                        <th style={{width: '50%'}}>Content</th>
                        <th style={{textAlign: 'right', width: '20%'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(groupedTemplates[cat] || []).length === 0 && (
                        <tr><td colSpan={3} className="template-list-empty">No templates in this category.</td></tr>
                      )}
                      {(groupedTemplates[cat] || []).map(template => {
                        const expanded = selectedTemplate === template.id;
                        return (
                          <React.Fragment key={template.id}>
                            <tr className={expanded ? 'expanded-row' : ''} onClick={() => setSelectedTemplate(expanded ? null : template.id)} style={{cursor: 'pointer'}}>
                              <td><span className="template-item-title">{template.title}</span></td>
                              <td className="muted" style={{whiteSpace: 'pre', wordBreak: 'break-word', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {!expanded ? (
                                  <span className="template-preview">{template.content.length > 80 ? template.content.slice(0, 80) + '...' : template.content}</span>
                                ) : (
                                  <span className="template-preview">{template.content.length > 80 ? template.content.slice(0, 80) + '...' : template.content}</span>
                                )}
                              </td>
                              <td style={{textAlign: 'right'}} onClick={e => e.stopPropagation()}>
                                <button className="icon-btn" title="Edit" onClick={() => handleEdit(template)}>✏️</button>
                                <button className="icon-btn" title="Copy" onClick={() => handleCopy(template.content)}>📋</button>
                                <button className="icon-btn danger" title="Remove" onClick={() => handleRemove(template.id)}>🗑️</button>
                              </td>
                            </tr>
                            {expanded && (
                              <tr className="dropdown-row">
                                <td colSpan={3} style={{background: 'var(--bg-main)', borderBottom: '1px solid var(--border)'}}>
                                  <div className="template-dropdown-content" style={{padding: '1em 0 0.5em 0', color: 'var(--text-main)'}}>
                                    <pre style={{margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{template.content}</pre>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Load more button for templates */}
                {hasMore && !loading && (
                  <button onClick={() => fetchTemplates(true)} disabled={loadingMore} style={{ margin: 18, padding: '10px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, border: 'none', fontSize: 16, cursor: 'pointer', opacity: loadingMore ? 0.6 : 1 }}>
                    {loadingMore ? 'Loading...' : 'Load more templates'}
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {confirmRemoveId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Are you sure you want to remove this template?</div>
            <div className="confirm-desc">It will be moved to Trash.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleRemoveConfirm}>Yes, Remove</button>
              <button className="confirm-btn cancel" onClick={handleRemoveCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteCategory && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-title">Delete Category?</div>
            <div className="confirm-desc">Are you sure you want to delete the category <b>{confirmDeleteCategory}</b>? This will also delete all templates in this category.</div>
            <div className="confirm-btns">
              <button className="confirm-btn delete" onClick={handleDeleteCategoryConfirm}>Yes, Delete</button>
              <button className="confirm-btn cancel" onClick={handleDeleteCategoryCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TemplateManager; 