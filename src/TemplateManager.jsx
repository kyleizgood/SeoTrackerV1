import React, { useState, useEffect } from 'react';
import { getTemplates, saveTemplate, saveTemplateOptimistic, deleteTemplate, deleteTemplatesBulk, getTrash, saveTrash, getCategories, saveCategories } from './firestoreHelpers';
// Add paginated fetcher for templates
import { getDocs, collection, query, orderBy, limit as fsLimit, startAfter as fsStartAfter } from 'firebase/firestore';
import { db, auth } from './firebase';
import { toast } from 'sonner';
import './TemplateManager.css';

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
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(null);

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
      if (!loadMore) localStorage.setItem(TEMPLATES_CACHE_KEY, JSON.stringify({ templates: fetched, lastDocId: newLastDoc?.id || null, ts: Date.now() }));
    } catch (e) {
      console.error('Error fetching templates:', e);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // Fix existing templates with incorrect category assignments
  const fixExistingTemplates = async () => {
    try {
      const existingTemplates = templates.filter(t => 
        t.category === 'Other' && t.customCategory && t.customCategory.trim()
      );
      
      if (existingTemplates.length > 0) {
        console.log(`Found ${existingTemplates.length} templates with incorrect category assignments`);
        
        for (const template of existingTemplates) {
          const fixedTemplate = {
            ...template,
            category: template.customCategory.trim()
          };
          
          await saveTemplateOptimistic(fixedTemplate);
          console.log(`Fixed template: ${template.title} -> ${fixedTemplate.category}`);
        }
        
        fetchTemplates(false);
      }
    } catch (error) {
      console.error('Error fixing existing templates:', error);
    }
  };

  // On mount: try cache, then fetch
  useEffect(() => {
    const cache = localStorage.getItem(TEMPLATES_CACHE_KEY);
    if (cache) {
      const { templates: cachedTemplates, lastDocId, ts } = JSON.parse(cache);
      if (Array.isArray(cachedTemplates) && Date.now() - ts < 1000 * 60 * 30) {
        setTemplates(cachedTemplates);
        setLoading(false);
        fixExistingTemplates();
        setTimeout(() => {
          fetchTemplates(false);
        }, 5000);
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
    
    if (newTemplate.category === 'Other' && !newTemplate.customCategory.trim()) {
      toast.error('Please enter a custom category name');
      return;
    }

    const finalCategory = newTemplate.category === 'Other' && newTemplate.customCategory.trim() 
      ? newTemplate.customCategory.trim() 
      : newTemplate.category;

    const template = {
      ...newTemplate,
      category: finalCategory,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTemplateOptimistic(template);
      setTemplates(prev => [template, ...prev]);
      setNewTemplate({ title: '', content: '', category: DEFAULT_CATEGORIES[0], customCategory: '' });
      toast.success('Template added successfully');
    } catch (error) {
      toast.error('Error adding template');
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
    
    if (newTemplate.category === 'Other' && !newTemplate.customCategory.trim()) {
      toast.error('Please enter a custom category name');
      return;
    }

    const finalCategory = newTemplate.category === 'Other' && newTemplate.customCategory.trim() 
      ? newTemplate.customCategory.trim() 
      : newTemplate.category;

    const updatedTemplate = {
      ...newTemplate,
      category: finalCategory,
      id: selectedTemplate,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTemplateOptimistic(updatedTemplate);
      setTemplates(prev => prev.map(t => t.id === selectedTemplate ? updatedTemplate : t));
      setNewTemplate({ title: '', content: '', category: DEFAULT_CATEGORIES[0], customCategory: '' });
      setIsEditing(false);
      setSelectedTemplate(null);
      toast.success('Template updated successfully');
    } catch (error) {
      toast.error('Error updating template');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Error deleting template');
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copied to clipboard!');
  };

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
      toast.error('Error removing template');
    }
  };

  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
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
      toast.error('Error adding category');
    }
  };

  const handleDeleteCategory = (cat) => {
    setConfirmDeleteCategory(cat);
  };

  const handleDeleteCategoryConfirm = async () => {
    try {
      const templatesInCategory = (templates || []).filter(t => t.category === confirmDeleteCategory);
      
      if (templatesInCategory.length > 0) {
        console.log(`Deleting ${templatesInCategory.length} templates in category: ${confirmDeleteCategory}`);
        
        const templateIds = templatesInCategory.map(t => t.id);
        await deleteTemplatesBulk(templateIds);
        
        setTemplates(prev => prev.filter(t => t.category !== confirmDeleteCategory));
        localStorage.removeItem(TEMPLATES_CACHE_KEY);
      }
      
      const updatedCategories = categories.filter(c => c !== confirmDeleteCategory);
      await saveCategories(updatedCategories);
      setCategories(updatedCategories);
      setConfirmDeleteCategory(null);
      
      toast.success(`Category "${confirmDeleteCategory}" and ${templatesInCategory.length} templates deleted successfully`);
      
      setTimeout(() => {
        fetchTemplates(false);
      }, 1000);

    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error deleting category');
    }
  };

  const handleDeleteCategoryCancel = () => {
    setConfirmDeleteCategory(null);
  };

  // Group templates by category
  const groupedTemplates = (templates || []).reduce((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});
  
  if (!groupedTemplates['Other']) {
    groupedTemplates['Other'] = [];
  }
  
  const categoriesWithoutOther = (categories || []).filter(c => c !== 'Other');
  const allCategoriesRaw = Array.from(new Set([
    ...categoriesWithoutOther, 
    ...Object.keys(groupedTemplates).filter(cat => cat !== 'Other')
  ]));
  const allCategories = [...allCategoriesRaw.filter(c => c !== 'Other'), 'Other'];

  return (
    <div className={`template-manager-modern${darkMode ? ' dark' : ''}`}>
      <div className="template-header">
        <h1>Template Manager</h1>
        <p>Create, organize, and manage your templates with ease</p>
      </div>

      <div className="template-main-grid">
        {/* Form Section */}
        <div className="template-form-card">
          <h2 className="template-form-title">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="template-form-desc">
            {isEditing ? 'Update your template details below' : 'Add a new template to your collection'}
          </p>

          <form onSubmit={isEditing ? handleUpdate : handleAdd}>
            <label className="template-label">Template Title</label>
          <input
            type="text"
            className="template-input"
              placeholder="Enter a descriptive title"
            value={newTemplate.title}
            onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            required
          />

            <label className="template-label">Template Content</label>
          <textarea
            className="template-textarea"
              placeholder="Enter your template content here..."
            value={newTemplate.content}
            onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
            required
          />

            <label className="template-label">Category</label>
          <select
              className="template-select"
            value={newTemplate.category}
            onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value, customCategory: '' })}
          >
              {[...categoriesWithoutOther, 'Other'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
          </select>

          {newTemplate.category === 'Other' && (
              <>
                <label className="template-label">Custom Category Name</label>
            <input
              type="text"
              className="template-input"
                  placeholder="Enter custom category name"
              value={newTemplate.customCategory}
              onChange={e => setNewTemplate({ ...newTemplate, customCategory: e.target.value })}
              required
            />
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="submit"
                className="template-button template-button-primary"
              >
                {isEditing ? 'Update Template' : 'Create Template'}
            </button>
            {isEditing && (
                <button
                  type="button"
                  className="template-button template-button-secondary"
                  onClick={() => {
                setIsEditing(false);
                    setNewTemplate({ title: '', content: '', category: (categories || DEFAULT_CATEGORIES)[0], customCategory: '' });
                setSelectedTemplate(null);
                  }}
                >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

        {/* Templates Section */}
        <div className="template-templates-card">
          <div className="template-templates-header">
            <h2 className="template-templates-title">Your Templates</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!showCategoryInput && (
              <button
                  className="template-add-category-button"
                onClick={() => setShowCategoryInput(true)}
              >
                  ➕ Add Category
              </button>
            )}
            {showCategoryInput && (
                <form onSubmit={handleAddCategory} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                    className="template-input"
                    style={{ margin: 0, width: '200px' }}
                    placeholder="Category name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  autoFocus
                  />
                  <button type="submit" className="template-add-category-button">✔</button>
                  <button
                    type="button"
                    className="template-button template-button-secondary"
                    style={{ margin: 0 }}
                    onClick={() => { setShowCategoryInput(false); setNewCategoryName(""); }}
                  >
                    ✖
                  </button>
              </form>
            )}
          </div>
        </div>

          {loading ? (
            <div className="template-loading-state">
              <div>Loading templates...</div>
            </div>
          ) : allCategories.length === 0 ? (
            <div className="template-empty-state">
              <h3>No categories found</h3>
              <p>Create your first category to get started</p>
            </div>
          ) : (
            allCategories.map(cat => (
              <div key={cat} className="template-category-card">
                <div
                  className="template-category-header"
                  onClick={() => setOpenCategory(openCategory === cat ? null : cat)}
                >
                  <div className="template-category-title">
                    <span>{openCategory === cat ? '▼' : '▶'}</span>
                    <span>{cat}</span>
                    <span className="template-category-count">
                      {(groupedTemplates[cat] || []).length}
              </span>
                  </div>
              {cat !== 'Other' && (
                <button
                      className="template-delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat);
                      }}
                    >
                      Delete
                </button>
              )}
            </div>

            {openCategory === cat && (
                  <div>
                    {(groupedTemplates[cat] || []).length === 0 ? (
                      <div className="template-empty-state">
                        <p>No templates in this category</p>
                      </div>
                    ) : (
                      (groupedTemplates[cat] || []).map(template => (
                        <div key={template.id} className="template-item">
                          <div className="template-item-title">
                            {template.title || 'Untitled'}
                          </div>
                          <div className="template-item-content">
                            {(template.content || '').length > 150 
                              ? (template.content || '').slice(0, 150) + '...' 
                              : (template.content || '')}
                          </div>
                          <div className="template-action-buttons">
                            <button
                              className="template-action-button template-action-button-edit"
                              onClick={() => handleEdit(template)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="template-action-button template-action-button-copy"
                              onClick={() => handleCopy(template.content || '')}
                            >
                              📋 Copy
                            </button>
                            <button
                              className="template-action-button template-action-button-delete"
                              onClick={() => handleRemove(template.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {hasMore && !loading && (
                      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <button
                          onClick={() => fetchTemplates(true)}
                          disabled={loadingMore}
                          className="template-button template-button-primary"
                          style={{ opacity: loadingMore ? 0.6 : 1 }}
                        >
                          {loadingMore ? 'Loading...' : 'Load More Templates'}
                        </button>
                                  </div>
                            )}
                </div>
                )}
              </div>
            ))
            )}
          </div>
      </div>

      {/* Confirmation Modals */}
      {confirmRemoveId && (
        <div className="template-modal">
          <div className="template-modal-content">
            <h3 className="template-modal-title">Delete Template?</h3>
            <p className="template-modal-desc">
              Are you sure you want to delete this template? It will be moved to trash.
            </p>
            <div className="template-modal-buttons">
              <button
                className="template-button template-button-secondary"
                onClick={handleRemoveCancel}
              >
                Cancel
              </button>
              <button
                className="template-button template-action-button-delete"
                onClick={handleRemoveConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteCategory && (
        <div className="template-modal">
          <div className="template-modal-content">
            <h3 className="template-modal-title">Delete Category?</h3>
            <p className="template-modal-desc">
              Are you sure you want to delete the category <strong>{confirmDeleteCategory}</strong>? 
              {(() => {
                const templatesInCategory = (templates || []).filter(t => t.category === confirmDeleteCategory);
                return templatesInCategory.length > 0 
                  ? ` This will also delete ${templatesInCategory.length} template${templatesInCategory.length === 1 ? '' : 's'} in this category.`
                  : ' This category is empty.';
              })()}
            </p>
            <div className="template-modal-buttons">
              <button
                className="template-button template-button-secondary"
                onClick={handleDeleteCategoryCancel}
              >
                Cancel
              </button>
              <button
                className="template-button template-action-button-delete"
                onClick={handleDeleteCategoryConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager; 