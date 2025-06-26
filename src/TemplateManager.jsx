import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { getTemplates, saveTemplate, deleteTemplate, getTrash, saveTrash } from './firestoreHelpers';

const TRASH_KEY = 'company-trash';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
=======

const TEMPLATE_TRASH_KEY = 'template-trash';

const TemplateManager = () => {
  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem('templates');
    return savedTemplates ? JSON.parse(savedTemplates) : [];
  });
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '' });
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  useEffect(() => {
<<<<<<< HEAD
    getTemplates().then(setTemplates);
  }, []);

  // Trash logic
  const addToTrash = async (template) => {
    const trash = await getTrash();
    trash.push({ ...template, type: 'template' });
    await saveTrash(trash);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.content) return;
    const newT = { id: Date.now(), title: newTemplate.title, content: newTemplate.content };
    await saveTemplate(newT);
    setTemplates(await getTemplates());
=======
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  // Trash logic
  const addToTrash = (template) => {
    const trash = JSON.parse(localStorage.getItem(TEMPLATE_TRASH_KEY) || '[]');
    trash.push(template);
    localStorage.setItem(TEMPLATE_TRASH_KEY, JSON.stringify(trash));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.content) return;
    setTemplates([
      ...templates,
      {
        id: Date.now(),
        title: newTemplate.title,
        content: newTemplate.content
      }
    ]);
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
    setNewTemplate({ title: '', content: '' });
  };

  const handleEdit = (template) => {
    setIsEditing(true);
    setNewTemplate({ title: template.title, content: template.content });
    setSelectedTemplate(template.id);
  };

<<<<<<< HEAD
  const handleUpdate = async (e) => {
    e.preventDefault();
    await saveTemplate({ id: selectedTemplate, title: newTemplate.title, content: newTemplate.content });
    setTemplates(await getTemplates());
=======
  const handleUpdate = (e) => {
    e.preventDefault();
    setTemplates(templates.map(template => 
      template.id === selectedTemplate
        ? { ...template, title: newTemplate.title, content: newTemplate.content }
        : template
    ));
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
    setIsEditing(false);
    setNewTemplate({ title: '', content: '' });
    setSelectedTemplate(null);
  };

<<<<<<< HEAD
  const handleDelete = async (id) => {
    const template = templates.find(t => t.id === id);
    await deleteTemplate(id);
    await addToTrash(template);
    setTemplates(await getTemplates());
  };

=======
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    setShowCopyDialog(true);
    setTimeout(() => setShowCopyDialog(false), 1500);
  };

  // Remove logic with confirmation
  const handleRemove = (id) => {
    setConfirmRemoveId(id);
  };

  const handleRemoveConfirm = () => {
    const template = templates.find(t => t.id === confirmRemoveId);
    if (template) {
      addToTrash(template);
      setTemplates(templates.filter(t => t.id !== confirmRemoveId));
    }
    setConfirmRemoveId(null);
    // If editing or expanded, reset
    if (selectedTemplate === confirmRemoveId) setSelectedTemplate(null);
    if (isEditing && selectedTemplate === confirmRemoveId) {
      setIsEditing(false);
      setNewTemplate({ title: '', content: '' });
    }
  };

  const handleRemoveCancel = () => {
    setConfirmRemoveId(null);
  };

  const toggleDropdown = (id) => {
    setSelectedTemplate(selectedTemplate === id ? null : id);
  };

  return (
    <div className="template-manager-2col">
      {/* Left: Heading, desc, and form */}
      <div className="template-form-side">
        <h1 className="template-title">Templates</h1>
        <p className="template-desc">Manage your templates and easily copy them when needed.</p>
        <form onSubmit={isEditing ? handleUpdate : handleAdd} className="template-form">
          <input
            type="text"
            placeholder="Enter template title"
            value={newTemplate.title}
            onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Enter template content"
            value={newTemplate.content}
            onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
            required
          />
          <button type="submit">
            {isEditing ? 'Update Template' : 'Add Template'}
          </button>
          {isEditing && (
            <button type="button" onClick={() => {
              setIsEditing(false);
              setNewTemplate({ title: '', content: '' });
              setSelectedTemplate(null);
            }}>
              Cancel
            </button>
          )}
        </form>
      </div>
      {/* Right: Template list */}
      <div className="template-list-side">
        <div className="templates-list">
          {templates.length === 0 && (
            <div className="template-list-empty">No templates yet.</div>
          )}
          {templates.map(template => {
            const expanded = selectedTemplate === template.id;
            return (
              <div key={template.id} className="template-item">
                <div 
                  className="template-header"
                  onClick={() => toggleDropdown(template.id)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <span className={`template-dropdown-icon${expanded ? ' expanded' : ''}`} style={{marginRight: 8, fontSize: '1.1em', transition: 'transform 0.18s'}}>
                    {expanded ? '▲' : '▼'}
                  </span>
                  <h3 style={{margin: 0, flex: 1}}>{template.title}</h3>
                  <div className="template-actions" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(template)}>
                      Edit
                    </button>
                    <button onClick={() => handleCopy(template.content)}>
                      Copy
                    </button>
                    <button className="template-remove-btn" onClick={() => handleRemove(template.id)} title="Remove template">
                      ×
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="template-content">
                    <pre>{template.content}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showCopyDialog && (
        <div className="copy-toast-dialog">Template copied to clipboard!</div>
      )}
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
    </div>
  );
};

export default TemplateManager; 