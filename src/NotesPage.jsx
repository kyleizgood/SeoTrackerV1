import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getNotesPaginated, saveNote, deleteNote, getTrash, saveTrash } from './firestoreHelpers';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';

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
      if (Array.isArray(cachedNotes) && Date.now() - ts < 1000 * 60 * 10) { // 10 min cache
        setNotes(cachedNotes);
        setSelectedId(cachedNotes[0]?.id || null);
        setLoading(false);
        // Still fetch latest in background
        fetchNotes(false);
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
  const handleModalSave = async (data) => {
    // Ensure priority is always set
    const noteWithPriority = { ...data, priority: data.priority || 'medium' };
    let newNote = null;
    if (noteWithPriority.id) {
      setNotes(notes => notes.map(n => n.id === noteWithPriority.id ? { ...n, ...noteWithPriority, updatedAt: new Date().toISOString() } : n));
      newNote = { ...noteWithPriority, updatedAt: new Date().toISOString() };
    } else {
      newNote = {
        ...noteWithPriority,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes(notes => [newNote, ...notes]);
    }
    setShowModal(false);
    try {
      await saveNote(newNote);
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
    } catch (err) {
      // Optionally show an error, but do not delay UI
    }
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  return (
    <div style={{ display: 'flex', height: '100vh', background: darkMode ? '#181a1b' : '#f7f6f2' }} className={darkMode ? 'dark' : ''}>
      {/* Sidebar */}
      <aside style={{ width: 320, background: darkMode ? '#23272e' : '#fff', borderRight: '1.5px solid #e0e7ef', display: 'flex', flexDirection: 'column', height: '100vh', padding: '0 0 0 0', boxShadow: darkMode ? '2px 0 12px #181a1b' : '2px 0 12px #ececec', zIndex: 2, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 8px 18px', fontWeight: 800, fontSize: '1.25em', color: darkMode ? '#90caf9' : '#1976d2', borderBottom: '1.5px solid #e0e7ef' }}>
          <span>All notes</span>
          <button
            onClick={handleAdd}
            style={{
              background: darkMode ? '#1976d2' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              fontSize: '1.5em',
              boxShadow: darkMode ? '0 1px 4px #23272e' : '0 1px 4px #b3c6e7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
            title="Add note/reminder"
          >+
          </button>
        </div>
        {/* Minimalist search bar - outside scrollable notes list */}
        <div style={{ padding: '10px 18px 0 18px', background: darkMode ? '#23272e' : '#fff', flexShrink: 0 }}>
          <div style={{
            position: 'relative',
            background: darkMode ? '#23272e' : '#fff',
            border: '1.5px solid #e0e7ef',
            borderRadius: 18,
            boxShadow: darkMode ? '0 2px 8px #181a1b' : '0 2px 8px #ececec',
            marginBottom: 12,
            zIndex: 1,
          }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bdbdbd', fontSize: '1.1em' }}>🔍</span>
            <input
              type="text"
              name="noteSearch"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchFocused ? '' : 'Search notes...'}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 32px',
                borderRadius: 18,
                border: 'none',
                background: 'transparent',
                fontSize: '1em',
                outline: 'none',
                color: darkMode ? '#e3e3e3' : '#232323',
                fontWeight: 600,
              }}
            />
          </div>
        </div>
        <div className="notes-sidebar-list" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, background: darkMode ? '#23272e' : '#fff' }}>
          {loading ? (
            <div style={{ color: darkMode ? '#888' : '#888', textAlign: 'center', marginTop: 32 }}>Loading notes...</div>
          ) : notes.filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase())).map(note => (
            <div
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              style={{
                background: selectedId === note.id ? (darkMode ? '#263043' : '#e3f2fd') : (darkMode ? '#23272e' : '#fff'),
                borderLeft: selectedId === note.id ? '4px solid #1976d2' : '4px solid transparent',
                padding: '14px 18px',
                cursor: 'pointer',
                borderBottom: darkMode ? '1px solid #333' : '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background 0.18s, border 0.18s',
                whiteSpace: 'normal',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                marginRight: 0,
                color: darkMode ? '#e3e3e3' : '#232323',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.08em', color: darkMode ? '#e3e3e3' : '#232323', marginBottom: 2 }}>{note.title}</div>
                <div style={{ fontSize: '0.98em', color: darkMode ? '#bdbdbd' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{note.content}</div>
                {note.type === 'reminder' && note.reminderDate && (
                  <div style={{ fontSize: '0.92em', color: darkMode ? '#ffbdbd' : '#d32f2f', marginTop: 2 }}>⏰ {formatDate(note.reminderDate)}</div>
                )}
              </div>
              {note.priority && note.priority.trim() && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 12px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.92em',
                  marginLeft: 6,
                  background:
                    note.priority === 'high' ? (darkMode ? '#3a2323' : '#ffebee') :
                    note.priority === 'medium' ? (darkMode ? '#3a3323' : '#fff8e1') :
                    (darkMode ? '#233a23' : '#e8f5e9'),
                  color:
                    note.priority === 'high' ? '#c62828' :
                    note.priority === 'medium' ? '#ef6c00' :
                    '#2e7d32',
                  border:
                    note.priority === 'high' ? '1.5px solid #c62828' :
                    note.priority === 'medium' ? '1.5px solid #ef6c00' :
                    '1.5px solid #2e7d32',
                  letterSpacing: '0.03em',
                }}>
                  {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
                </span>
              )}
            </div>
          ))}
          {/* Load more button */}
          {hasMore && !loading && (
            <button onClick={() => fetchNotes(true)} disabled={loadingMore} style={{ margin: 18, padding: '10px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, border: 'none', fontSize: 16, cursor: 'pointer', opacity: loadingMore ? 0.6 : 1 }}>
              {loadingMore ? 'Loading...' : 'Load more notes'}
            </button>
          )}
        </div>
      </aside>
      {/* Main content */}
      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', background: darkMode ? '#181a1b' : '#f7f6f2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {selectedNote ? (
          <div style={{
            width: '100%',
            maxWidth: 900,
            background: darkMode ? '#23272e' : '#fff',
            borderRadius: 18,
            boxShadow: darkMode ? '0 2px 24px #181a1b' : '0 2px 24px #ececec',
            padding: '32px 36px',
            marginTop: 24,
            color: darkMode ? '#e3e3e3' : '#232323',
            border: darkMode ? '1.5px solid #333' : undefined,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
              <div style={{ fontWeight: 800, fontSize: '1.5em', color: darkMode ? '#90caf9' : '#1976d2', flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                {selectedNote.title}
                {selectedNote.priority && selectedNote.priority.trim() && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 16px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '0.98em',
                    marginLeft: 8,
                    background:
                      selectedNote.priority === 'high' ? (darkMode ? '#3a2323' : '#ffebee') :
                      selectedNote.priority === 'medium' ? (darkMode ? '#3a3323' : '#fff8e1') :
                      (darkMode ? '#233a23' : '#e8f5e9'),
                    color:
                      selectedNote.priority === 'high' ? '#c62828' :
                      selectedNote.priority === 'medium' ? '#ef6c00' :
                      '#2e7d32',
                    border:
                      selectedNote.priority === 'high' ? '1.5px solid #c62828' :
                      selectedNote.priority === 'medium' ? '1.5px solid #ef6c00' :
                      '1.5px solid #2e7d32',
                    letterSpacing: '0.03em',
                  }}>
                    {selectedNote.priority.charAt(0).toUpperCase() + selectedNote.priority.slice(1)} Priority
                  </span>
                )}
              </div>
              <button onClick={() => handleEdit(selectedNote)} style={{ background: 'none', border: 'none', color: darkMode ? '#90caf9' : '#1976d2', fontSize: '1.3em', cursor: 'pointer', marginRight: 6 }} title="Edit note/reminder">✏️</button>
              <button onClick={() => handleDelete(selectedNote.id)} style={{ background: 'none', border: 'none', color: '#c00', fontSize: '1.3em', cursor: 'pointer' }} title="Delete note/reminder">🗑️</button>
            </div>
            <div style={{ fontSize: '1.13em', color: darkMode ? '#bdbdbd' : '#232323', marginBottom: 18, whiteSpace: 'pre-line' }}>{selectedNote.content}</div>
            <div style={{ display: 'flex', gap: 18, color: darkMode ? '#aaa' : '#888', fontSize: '0.98em' }}>
              <div>Created: {formatDate(selectedNote.createdAt)}</div>
              <div>Updated: {formatDate(selectedNote.updatedAt)}</div>
              {selectedNote.priority && selectedNote.priority.trim() && <div>Priority: {selectedNote.priority}</div>}
            </div>
          </div>
        ) : (
          <div style={{ color: darkMode ? '#888' : '#888', fontSize: '1.2em', marginTop: 80 }}>Select a note or reminder to view details.</div>
        )}
      </main>
      {/* Modal for add/edit */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: darkMode ? 'rgba(24,26,27,0.88)' : 'rgba(44,62,80,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: darkMode ? '#23272e' : '#fff', borderRadius: 18, boxShadow: darkMode ? '0 2px 24px #181a1b' : '0 2px 24px #ececec', padding: '48px 48px 40px 48px', minWidth: 400, maxWidth: 520, width: '100%', fontFamily: 'inherit', color: darkMode ? '#e3e3e3' : '#232323' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25em', marginBottom: 32, letterSpacing: '0.01em', color: '#232323' }}>{modalData?.id ? 'Edit' : 'Add'} Note/Reminder</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Title
                <input
                  type="text"
                  name="noteTitle"
                  placeholder="Title"
                  value={modalData?.title || ''}
                  onChange={e => setModalData(d => ({ ...d, title: e.target.value }))}
                  style={{ marginTop: 10, marginBottom: 10, width: '100%', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1.08em', fontWeight: 700, background: '#23232310', color: '#232323' }}
                  autoFocus
                />
              </label>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Content
                <textarea
                  name="noteContent"
                  placeholder="Content"
                  value={modalData?.content || ''}
                  onChange={e => setModalData(d => ({ ...d, content: e.target.value }))}
                  rows={5}
                  style={{ marginTop: 10, marginBottom: 10, width: '100%', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1.08em', fontWeight: 500, resize: 'vertical', background: '#23232310', color: '#232323' }}
                />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginTop: 2, marginBottom: 2 }}>
                <label style={{ fontWeight: 600, fontSize: '1em', color: '#232323', marginBottom: 0 }}>
                  Type
                  <select
                    value={modalData?.type || 'note'}
                    onChange={e => setModalData(d => ({ ...d, type: e.target.value }))}
                    style={{ marginLeft: 12, marginTop: 6, marginBottom: 6, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1em', fontWeight: 600, padding: '0.3em 1em', background: '#f7f6f2', color: '#232323' }}
                  >
                    <option value="note">Note</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </label>
                {modalData?.type === 'reminder' && (
                  <label style={{ fontWeight: 600, fontSize: '1em', color: '#232323', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
                    Set Reminder
                    <DatePicker
                      selected={modalData?.reminderDate ? new Date(modalData.reminderDate) : null}
                      onChange={date => setModalData(d => ({ ...d, reminderDate: date ? date.toISOString() : '' }))}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      placeholderText="Select date and time"
                      className="custom-datepicker-input"
                      style={{ marginLeft: 12, marginTop: 6, marginBottom: 6, width: 200, padding: '0.3em 1em', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1em', fontWeight: 600, background: '#f7f6f2', color: '#232323' }}
                      popperPlacement="bottom"
                    />
                  </label>
                )}
                <label style={{ fontWeight: 600, fontSize: '1em', color: '#232323', marginBottom: 0 }}>
                  Priority
                  <select
                    value={modalData?.priority || 'medium'}
                    onChange={e => setModalData(d => ({ ...d, priority: e.target.value }))}
                    style={{ marginLeft: 12, marginTop: 6, marginBottom: 6, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1em', fontWeight: 600, padding: '0.3em 1em', background: '#f7f6f2', color: '#232323' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 18, justifyContent: 'flex-end' }}>
                <button onClick={() => handleModalSave(modalData)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 40px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer', boxShadow: '0 1px 4px #b3c6e7' }}>Save</button>
                <button onClick={() => setShowModal(false)} style={{ background: '#eee', color: '#232323', border: 'none', borderRadius: 8, padding: '14px 40px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Delete */}
      {confirmDeleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: darkMode ? 'rgba(24,26,27,0.88)' : 'rgba(44,62,80,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: darkMode ? '#23272e' : '#fff', borderRadius: 18, boxShadow: darkMode ? '0 2px 24px #181a1b' : '0 2px 24px #ececec', padding: 36, minWidth: 320, maxWidth: 400, color: darkMode ? '#e3e3e3' : '#232323' }}>
            <div style={{ fontWeight: 800, fontSize: '1.15em', marginBottom: 18, color: '#c00' }}>Delete Note?</div>
            <div style={{ fontSize: '1.08em', color: '#232323', marginBottom: 24 }}>Are you sure you want to delete this note? This will move it to the trash.</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={confirmDelete} style={{ background: '#c00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Delete</button>
              <button onClick={cancelDelete} style={{ background: '#eee', color: '#232323', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
.custom-datepicker-input {
  margin-left: 12px;
  margin-top: 6px;
  margin-bottom: 6px;
  width: 200px;
  padding: 0.3em 1em;
  border-radius: 8px;
  border: 1.5px solid #bdbdbd;
  font-size: 1em;
  font-weight: 600;
  background: #f7f6f2;
  color: #232323;
}
.dark .custom-datepicker-input {
  background: #23272e;
  color: #e3e3e3;
  border: 1.5px solid #444;
}
.notes-sidebar-list {
  scrollbar-width: thin;
  scrollbar-color: #444 #181a1b;
}
.notes-sidebar-list::-webkit-scrollbar {
  width: 8px;
  background: #181a1b;
}
.notes-sidebar-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 8px;
}
.notes-sidebar-list::-webkit-scrollbar-thumb:hover {
  background: #666;
}
`}</style>
    </div>
  );
} 