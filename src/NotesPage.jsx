import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getNotesPaginated, saveNote, deleteNote, getTrash, saveTrash, saveHistoryLog, loadHistoryLog, clearHistoryLog } from './firestoreHelpers';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './NotesPage.css';

const mockNotes = [
  {
    id: '1',
    title: 'Online Courses Schedule',
    content: 'Store all online courses that are free during coronavirus outbreak, prioritize ✔️ and schedule, keep progress, store notes',
    type: 'reminder',
    reminderDate: '2024-06-10T21:44:00',
    createdAt: '2024-06-01T12:00:00',
    updatedAt: '2024-06-01T12:00:00',
    isCompleted: false,
    priority: 'high',
  },
  {
    id: '2',
    title: 'Code',
    content: 'Object code & its portability.',
    type: 'note',
    createdAt: '2024-06-02T09:00:00',
    updatedAt: '2024-06-02T09:00:00',
  },
  {
    id: '3',
    title: 'Year Goals',
    content: '2024 Notes & Goals. January-February: ...',
    type: 'note',
    createdAt: '2024-06-03T10:00:00',
    updatedAt: '2024-06-03T10:00:00',
  },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatReminderDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function NotesPage({ darkMode, setDarkMode }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [trashNotes, setTrashNotes] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();


  // LocalStorage cache key
  const NOTES_CACHE_KEY = 'notes_cache_v1';

  // --- History Log State ---
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set());
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  // History entry structure
  const createHistoryEntry = (noteId, title, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    noteId,
    title,
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
    setRecentChanges(prev => new Set([...prev, entry.noteId]));
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.noteId);
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
      setNotes(prev => prev.map(n => n.id === historyEntry.noteId ? { ...n, [field]: value } : n));
      await saveNote({ ...notes.find(n => n.id === historyEntry.noteId), [field]: value });
      const revertEntry = createHistoryEntry(
        historyEntry.noteId,
        historyEntry.title,
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

  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('notes');
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('notes', history).catch(err => {
        // console.error('Error saving history:', err);
      });
    }
  }, [history]);

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('notes');
    setClearHistoryModal(false);
  };

  // Fetch paginated notes (initial or more)
  const fetchNotes = async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      let startAfterDoc = loadMore ? lastDoc : null;
      const { notes: fetched, lastDoc: newLastDoc, hasMore: more } = await getNotesPaginated(20, startAfterDoc);
      setNotes(prev => loadMore ? [...prev, ...fetched] : fetched);
      setLastDoc(newLastDoc);
      setHasMore(more);
      // Cache in localStorage
      if (!loadMore) localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify({ notes: fetched, lastDocId: newLastDoc?.id || null, ts: Date.now() }));
    } catch (e) {
      // Optionally handle error
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // On mount: try cache, then fetch
  useEffect(() => {
    const cache = localStorage.getItem(NOTES_CACHE_KEY);
    if (cache) {
      const { notes: cachedNotes, lastDocId, ts } = JSON.parse(cache);
      if (Array.isArray(cachedNotes) && Date.now() - ts < 1000 * 60 * 30) { // 30 min cache to reduce Firestore reads
        setNotes(cachedNotes);
        setLoading(false);
        // Still fetch latest in background with longer delay
        setTimeout(() => {
          fetchNotes(false);
        }, 5000); // 5 second delay for background fetch
        return;
      }
    }
    fetchNotes(false);
  }, []);

  const selectedNote = notes.find(n => n.id === selectedId);

  // Fetch trash notes from meta/trash (unified array)
  async function fetchTrash() {
    const trash = await getTrash();
    setTrashNotes(trash.filter(item => item.type === 'note'));
  }

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleAdd = () => {
    setModalData({ title: '', content: '', type: 'note', reminderDate: '', priority: 'medium' });
    setShowModal(true);
  };
  const handleEdit = (note) => {
    setModalData(note);
    setShowModal(true);
  };
  // In handleModalSave, add to history on add/edit
  const handleModalSave = async (data) => {
    const noteWithPriority = { ...data, priority: data.priority || 'medium' };
    let newNote = null;
    if (noteWithPriority.id) {
      setNotes(notes => notes.map(n => n.id === noteWithPriority.id ? { ...n, ...noteWithPriority, updatedAt: new Date().toISOString() } : n));
      newNote = { ...noteWithPriority, updatedAt: new Date().toISOString() };
      // Add to history for edit
      const oldNote = notes.find(n => n.id === noteWithPriority.id);
      if (oldNote) {
        if (oldNote.title !== noteWithPriority.title) addToHistory(createHistoryEntry(noteWithPriority.id, oldNote.title, 'title', oldNote.title, noteWithPriority.title));
        if (oldNote.content !== noteWithPriority.content) addToHistory(createHistoryEntry(noteWithPriority.id, oldNote.title, 'content', oldNote.content, noteWithPriority.content));
        if (oldNote.reminderDate !== noteWithPriority.reminderDate) addToHistory(createHistoryEntry(noteWithPriority.id, oldNote.title, 'reminderDate', oldNote.reminderDate, noteWithPriority.reminderDate));
        if (oldNote.priority !== noteWithPriority.priority) addToHistory(createHistoryEntry(noteWithPriority.id, oldNote.title, 'priority', oldNote.priority, noteWithPriority.priority));
      }
    } else {
      newNote = {
        ...noteWithPriority,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes(notes => [newNote, ...notes]);
      // Add to history for add
      addToHistory(createHistoryEntry(newNote.id, newNote.title, 'created', '', 'Note created'));
    }
    setShowModal(false);
    try {
      await saveNote(newNote);
      toast.success('Note saved successfully');

    } catch (err) {
      alert('Failed to save note. Please try again.');
      setNotes(notes => notes.filter(n => n.id !== newNote.id));
    }
  };
  const handleDelete = async (id) => {
    setConfirmDeleteId(id);
  };
  const confirmDelete = async () => {
    const id = confirmDeleteId;
    const note = notes.find(n => n.id === id);
    if (!note) {
      setConfirmDeleteId(null);
      return;
    }
    setNotes(notes => notes.filter(n => n.id !== id));
    setConfirmDeleteId(null); // Instantly close modal
    try {
      // Add to meta/trash array
      const trash = await getTrash();
      const trashedNote = { ...note, type: 'note' };
      await saveTrash([trashedNote, ...trash]);
      // Remove from notes collection
      await deleteNote(note.id);
              await fetchTrash();
        if (selectedId === id) setSelectedId(notes[0]?.id || null);
        toast.success('Note deleted successfully');

    } catch (err) {
      // Optionally show an error, but do not delay UI
    }
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  return (
    <div className={`notes-modern${darkMode ? ' dark' : ''}`}>
      {/* Sidebar */}
      <aside className="notes-sidebar">
        <div className="notes-sidebar-header">
          <span>All notes</span>
          <button
            onClick={handleAdd}
            className="notes-add-button"
            title="Add note/reminder"
          >+
          </button>
        </div>
        {/* Search bar */}
        <div className="notes-search-container">
          <div className="notes-search-wrapper">
            <span className="notes-search-icon">🔍</span>
            <input
              type="text"
              name="noteSearch"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchFocused ? '' : 'Search notes...'}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="notes-search-input"
            />
          </div>
        </div>
        <div className="notes-list">
          {loading ? (
            <div className="notes-loading">Loading notes...</div>
          ) : notes.filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase())).map(note => (
            <div
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={`notes-item${selectedId === note.id ? ' selected' : ''}${note.type === 'reminder' && note.reminderDate && isOverdue(note.reminderDate) ? ' overdue' : ''}${note.type === 'reminder' && note.reminderDate ? ' reminder' : ''}`}
            >
              <div className="notes-item-content">
                <div className="notes-item-title">{note.title}</div>
                <div className="notes-item-text">{note.content}</div>
                <div className="notes-item-date">📅 {formatFullDate(note.createdAt)}</div>
                {note.type === 'reminder' && note.reminderDate && (
                  <div className={`notes-item-reminder${isOverdue(note.reminderDate) ? ' overdue' : ' active'}`}>
                    {isOverdue(note.reminderDate) ? '🚨' : '⏰'} Due: {formatReminderDate(note.reminderDate)}
                  </div>
                )}
              </div>
              {note.priority && note.priority.trim() && (
                <span className={`notes-priority-badge ${note.priority}`}>
                  {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
                </span>
              )}
            </div>
          ))}
          {/* Load more button */}
          {hasMore && !loading && (
            <button onClick={() => fetchNotes(true)} disabled={loadingMore} className="notes-load-more">
              {loadingMore ? 'Loading...' : 'Load more notes'}
            </button>
          )}
        </div>
      </aside>
      {/* Main content */}
      <main className="notes-main">
        {/* Header with History Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`notes-history-button${showHistory ? ' active' : ''}`}
        >
          📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
        </button>
        {/* History Panel */}
        {showHistory && (
          <div className="notes-history-panel">
            {/* Clear History button */}
            <button
              onClick={() => setClearHistoryModal(true)}
              title="Clear History"
              className="notes-history-clear"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <div style={{ paddingRight: '40px' }}>
              <h3 className="notes-history-title">History Log</h3>
            </div>
            <div className="notes-history-content">
              {history.length === 0 ? (
                <p className="notes-history-empty">
                  No history entries yet
                </p>
              ) : (
                <div>
                  {history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`notes-history-entry${entry.action === 'reverted' ? ' reverted' : ''}`}
                    >
                      <div className="notes-history-info">
                        <div className="notes-history-header">
                          <span className="notes-history-note-title">
                            {entry.title}
                          </span>
                          <span className="notes-history-field">
                            {entry.field}
                          </span>
                        </div>
                        <div className="notes-history-changes">
                          <span style={{ whiteSpace: 'nowrap' }}>{entry.field}:</span>
                          <span className="notes-history-old-value">{entry.oldValue}</span>
                          <span className="notes-history-arrow">→</span>
                          <span className="notes-history-new-value">{entry.newValue}</span>
                          {entry.action === 'reverted' && (
                            <span className="notes-history-reverted">
                              <span style={{ fontSize: '1.1em', lineHeight: 1 }}>🔄</span> Reverted
                            </span>
                          )}
                        </div>
                        <div className="notes-history-timestamp">
                          <span style={{ fontSize: '0.9em' }}>🕒</span>
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      {entry.action !== 'reverted' && (
                        <button
                          onClick={() => revertChange(entry)}
                          className="notes-history-revert-button"
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
        {selectedNote ? (
          <div className="notes-details">
            <div className="notes-details-header">
              <div className="notes-details-title">
                {selectedNote.title}
                {selectedNote.priority && selectedNote.priority.trim() && (
                  <span className={`notes-priority-badge ${selectedNote.priority}`}>
                    {selectedNote.priority.charAt(0).toUpperCase() + selectedNote.priority.slice(1)} Priority
                  </span>
                )}
              </div>
              <div className="notes-details-actions">
                <button onClick={() => handleEdit(selectedNote)} className="notes-action-button" title="Edit note/reminder">✏️</button>
                <button onClick={() => handleDelete(selectedNote.id)} className="notes-action-button delete" title="Delete note/reminder">🗑️</button>
              </div>
            </div>
            <div className="notes-details-content">{selectedNote.content}</div>
            
            {/* Reminder Alert */}
            {selectedNote.type === 'reminder' && selectedNote.reminderDate && (
              <div className={`notes-reminder-alert${isOverdue(selectedNote.reminderDate) ? ' overdue' : ''}`}>
                <div className="notes-reminder-icon">
                  {isOverdue(selectedNote.reminderDate) ? '🚨' : '⏰'}
                </div>
                <div className="notes-reminder-text">
                  <div className={`notes-reminder-status${isOverdue(selectedNote.reminderDate) ? ' overdue' : ' active'}`}>
                    {isOverdue(selectedNote.reminderDate) ? 'OVERDUE' : 'REMINDER SET'}
                  </div>
                  <div className="notes-reminder-date">
                    Due: {formatReminderDate(selectedNote.reminderDate)}
                  </div>
                </div>
              </div>
            )}

            <div className="notes-details-footer">
              <div className="notes-details-field">📅 Created: {formatFullDate(selectedNote.createdAt)}</div>
              <div style={{ fontSize: '0.94em' }}>📝 Updated: {formatDate(selectedNote.updatedAt)}</div>
              {selectedNote.priority && selectedNote.priority.trim() && <div style={{ fontSize: '0.94em' }}>⭐ Priority: {selectedNote.priority}</div>}
            </div>
          </div>
        ) : (
          <div className="notes-empty-details">Select a note or reminder to view details.</div>
        )}
      </main>
      {/* Modal for add/edit */}
      {showModal && (
        <div className="notes-modal-overlay">
          <div className="notes-modal">
            <div className="notes-modal-title">{modalData?.id ? 'Edit' : 'Add'} Note/Reminder</div>
            <div className="notes-modal-form">
              <label className="notes-form-label">
                Title
                <input
                  type="text"
                  name="noteTitle"
                  placeholder="Title"
                  value={modalData?.title || ''}
                  onChange={e => setModalData(d => ({ ...d, title: e.target.value }))}
                  className="notes-form-input"
                  autoFocus
                />
              </label>
              <label className="notes-form-label">
                Content
                <textarea
                  name="noteContent"
                  placeholder="Content"
                  value={modalData?.content || ''}
                  onChange={e => setModalData(d => ({ ...d, content: e.target.value }))}
                  rows={5}
                  className="notes-form-textarea"
                />
              </label>
              <div className="notes-form-row">
                <label className="notes-form-label" style={{ marginBottom: 0 }}>
                  Type
                  <select
                    value={modalData?.type || 'note'}
                    onChange={e => setModalData(d => ({ ...d, type: e.target.value }))}
                    className="notes-form-select"
                  >
                    <option value="note">Note</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </label>
                {modalData?.type === 'reminder' && (
                  <label className="notes-form-label notes-datepicker-wrapper" style={{ marginBottom: 0 }}>
                    Set Reminder
                    <DatePicker
                      selected={modalData?.reminderDate ? new Date(modalData.reminderDate) : null}
                      onChange={date => setModalData(d => ({ ...d, reminderDate: date ? date.toISOString() : '' }))}
                      dateFormat="MMMM d, yyyy"
                      placeholderText="Type: MM/DD/YYYY or click to pick"
                      className="notes-datepicker-input"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={15}
                      scrollableYearDropdown
                      popperPlacement="bottom"
                    />
                  </label>
                )}
                <label className="notes-form-label" style={{ marginBottom: 0 }}>
                  Priority
                  <select
                    value={modalData?.priority || 'medium'}
                    onChange={e => setModalData(d => ({ ...d, priority: e.target.value }))}
                    className="notes-form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
              <div className="notes-modal-buttons">
                <button onClick={() => handleModalSave(modalData)} className="notes-modal-save">Save</button>
                <button onClick={() => setShowModal(false)} className="notes-modal-cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Delete */}
      {confirmDeleteId && (
        <div className="notes-modal-overlay" style={{ zIndex: 2000 }}>
          <div className="notes-confirm-modal">
            <div className="notes-confirm-title">Delete Note?</div>
            <div className="notes-confirm-desc">Are you sure you want to delete this note? This will move it to the trash.</div>
            <div className="notes-confirm-buttons">
              <button onClick={confirmDelete} className="notes-confirm-delete">Delete</button>
              <button onClick={cancelDelete} className="notes-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {clearHistoryModal && (
        <div className="notes-modal-overlay" style={{ zIndex: 2000 }}>
          <div className="notes-confirm-modal">
            <div className="notes-confirm-title">Clear History?</div>
            <div className="notes-confirm-desc">Are you sure you want to clear all history entries? This action cannot be undone.</div>
            <div className="notes-confirm-buttons">
              <button onClick={handleClearHistory} className="notes-confirm-delete">Clear</button>
              <button onClick={() => setClearHistoryModal(false)} className="notes-confirm-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 