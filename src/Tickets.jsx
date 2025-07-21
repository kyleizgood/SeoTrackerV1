import React, { useState, useEffect } from 'react';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getTicketsPaginated, saveTicket, deleteTicket, getTrash, saveTrash } from './firestoreHelpers';
import { auth } from './firebase';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function Tickets({ darkMode, setDarkMode }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'closed'

  // LocalStorage cache key
  const TICKETS_CACHE_KEY = 'tickets_cache_v1';

  // Fetch paginated tickets (initial or more)
  const fetchTickets = async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      let startAfterDoc = loadMore ? lastDoc : null;
      const { items: fetched, lastDoc: newLastDoc, hasMore: more } = await getTicketsPaginated(20, startAfterDoc);
      setTickets(prev => loadMore ? [...prev, ...fetched] : fetched);
      setLastDoc(newLastDoc);
      setHasMore(more);
      // Cache in localStorage
      if (!loadMore) localStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify({ tickets: fetched, lastDocId: newLastDoc?.id || null, ts: Date.now() }));
    } catch (e) {
      // Optionally handle error
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // On mount: try cache, then fetch
  useEffect(() => {
    const cache = localStorage.getItem(TICKETS_CACHE_KEY);
    if (cache) {
      const { tickets: cachedTickets, lastDocId, ts } = JSON.parse(cache);
      if (Array.isArray(cachedTickets) && Date.now() - ts < 1000 * 60 * 10) { // 10 min cache
        setTickets(cachedTickets);
        setSelectedId(cachedTickets[0]?.id || null);
        setLoading(false);
        // Still fetch latest in background
        fetchTickets(false);
        return;
      }
    }
    fetchTickets(false);
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedId);

  // Alerts logic
  function isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const d = new Date(dateStr);
    return d.toDateString() === today.toDateString();
  }
  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const d = new Date(dateStr);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  const todayFollowUps = tickets.filter(t => isToday(t.followUpDate) && (t.status || 'open') !== 'closed');
  const overdueFollowUps = tickets.filter(t => {
    if (!t.followUpDate) return false;
    return isOverdue(t.followUpDate) && (t.status || 'open') !== 'closed';
  });

  // Sidebar search
  const filteredTickets = tickets.filter(t => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      t.company.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.ticketId.toLowerCase().includes(q)
    );
  });

  // Split tickets by status
  const openTickets = filteredTickets.filter(t => (t.status || 'open') !== 'closed');
  const closedTickets = filteredTickets.filter(t => (t.status || 'open') === 'closed');

  // Modal logic
  const handleAdd = () => {
    setModalData({ company: '', subject: '', ticketId: '', followUpDate: '', status: 'open', priority: 'medium' });
    setShowModal(true);
  };
  const handleEdit = (ticket) => {
    setModalData(ticket);
    setShowModal(true);
  };
  const handleModalSave = async (data) => {
    const ticketWithDefaults = { ...data, priority: data.priority || 'medium', status: data.status || 'open' };
    let newTicket = null;
    if (ticketWithDefaults.id) {
      setTickets(tickets => tickets.map(t => t.id === ticketWithDefaults.id ? { ...t, ...ticketWithDefaults, updatedAt: new Date().toISOString() } : t));
      newTicket = { ...ticketWithDefaults, updatedAt: new Date().toISOString() };
    } else {
      newTicket = {
        ...ticketWithDefaults,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets(tickets => [newTicket, ...tickets]);
    }
    setShowModal(false);
    try {
      await saveTicket(newTicket);
    } catch (err) {
      alert('Failed to save ticket. Please try again.');
      setTickets(tickets => tickets.filter(t => t.id !== newTicket.id));
    }
  };
  const handleDelete = async (id) => {
    setConfirmDeleteId(id);
  };
  const confirmDelete = async () => {
    const id = confirmDeleteId;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      setConfirmDeleteId(null);
      return;
    }
    setTickets(tickets => tickets.filter(t => t.id !== id));
    setConfirmDeleteId(null);
    try {
      // Add to meta/trash array
      const trash = await getTrash();
      const trashedTicket = { ...ticket, type: 'ticket' };
      await saveTrash([trashedTicket, ...trash]);
      // Remove from tickets collection
      await deleteTicket(ticket.id);
    } catch (err) {
      // Optionally show an error, but do not delay UI
    }
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  // Sidebar ticket click
  const handleSidebarClick = (id) => setSelectedId(id);

  return (
    <div style={{ display: 'flex', height: '100vh', background: darkMode ? '#181a1b' : '#f7f6f2' }} className={darkMode ? 'dark' : ''}>
      {/* Sidebar */}
      <aside style={{ width: 320, background: darkMode ? '#23272e' : '#fff', borderRight: '1.5px solid #e0e7ef', display: 'flex', flexDirection: 'column', height: '100vh', padding: '0 0 0 0', boxShadow: darkMode ? '2px 0 12px #181a1b' : '2px 0 12px #ececec', zIndex: 2, position: 'relative' }}>
        {/* Tabs for Open/Closed */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, borderBottom: '1.5px solid #e0e7ef', background: darkMode ? '#23272e' : '#fff' }}>
          <button
            onClick={() => setActiveTab('open')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: activeTab === 'open' ? (darkMode ? '#181a1b' : '#e3f2fd') : 'transparent',
              color: activeTab === 'open' ? (darkMode ? '#90caf9' : '#1976d2') : '#888',
              border: 'none',
              borderBottom: activeTab === 'open' ? '3px solid #1976d2' : '3px solid transparent',
              fontWeight: 700,
              fontSize: '1.08em',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, border 0.18s',
            }}
          >Open</button>
          <button
            onClick={() => setActiveTab('closed')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: activeTab === 'closed' ? (darkMode ? '#181a1b' : '#e3f2fd') : 'transparent',
              color: activeTab === 'closed' ? (darkMode ? '#90caf9' : '#1976d2') : '#888',
              border: 'none',
              borderBottom: activeTab === 'closed' ? '3px solid #1976d2' : '3px solid transparent',
              fontWeight: 700,
              fontSize: '1.08em',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, border 0.18s',
            }}
          >Closed</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 8px 18px', fontWeight: 800, fontSize: '1.25em', color: darkMode ? '#90caf9' : '#1976d2', borderBottom: '1.5px solid #e0e7ef' }}>
          <span>{activeTab === 'open' ? 'All tickets' : 'Closed tickets'}</span>
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
            title="Add ticket"
          >+
          </button>
        </div>
        {/* Minimalist search bar - outside scrollable tickets list */}
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
              name="ticketSearch"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchFocused ? '' : 'Search tickets...'}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '0.7em 1.8em 0.7em 2.2em',
                border: 'none',
                borderRadius: 18,
                fontSize: '1.08em',
                background: 'none',
                color: darkMode ? '#e3e3e3' : '#232323',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'none',
              }}
            />
          </div>
        </div>
        {/* Ticket list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 18px 0', background: darkMode ? '#23272e' : '#fff' }}>
          {(activeTab === 'open' ? openTickets : closedTickets).length === 0 && (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No tickets found.</div>
          )}
          {(activeTab === 'open' ? openTickets : closedTickets).map(ticket => {
            // Determine follow-up status
            const isTodayFollowUp = isToday(ticket.followUpDate) && (ticket.status || 'open') !== 'closed';
            const isOverdueFollowUp = isOverdue(ticket.followUpDate) && (ticket.status || 'open') !== 'closed';
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                style={{
                  background: selectedId === ticket.id ? (darkMode ? '#263043' : '#e3f2fd') : (darkMode ? '#23272e' : '#fff'),
                  borderRadius: 12,
                  margin: '8px 12px',
                  padding: '14px 18px 10px 18px',
                  boxShadow: selectedId === ticket.id ? (darkMode ? '0 2px 8px #181a1b' : '0 2px 8px #b3c6e7') : 'none',
                  border: selectedId === ticket.id ? (darkMode ? '1.5px solid #1976d2' : '1.5px solid #1976d2') : '1.5px solid transparent',
                  cursor: 'pointer',
                  marginBottom: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  position: 'relative',
                  transition: 'background 0.18s, box-shadow 0.18s, border 0.18s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.08em', color: darkMode ? '#e3e3e3' : '#232323', marginBottom: 2 }}>{ticket.subject}</div>
                  {/* Alert icon for follow-up with text (only for open tickets) */}
                  {activeTab === 'open' && isTodayFollowUp && (
                    <span title="Needs follow up today" style={{ marginLeft: 4, fontSize: '1.1em', color: '#ff9800', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⏰ <span style={{ fontSize: '0.92em', fontWeight: 500, color: '#ff9800' }}>Follow up</span>
                    </span>
                  )}
                  {activeTab === 'open' && isOverdueFollowUp && (
                    <span title="Overdue follow up" style={{ marginLeft: 4, fontSize: '1.1em', color: '#c00', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⏰ <span style={{ fontSize: '0.92em', fontWeight: 500, color: '#c00' }}>Follow up</span>
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.98em', color: darkMode ? '#bdbdbd' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{ticket.company}</div>
                {/* Only show follow up date for open tickets */}
                {activeTab === 'open' && ticket.followUpDate && (
                  <div style={{ fontSize: '0.92em', color: isOverdue(ticket.followUpDate) ? (darkMode ? '#ffbdbd' : '#d32f2f') : (darkMode ? '#bdbdbd' : '#888'), marginTop: 2 }}>
                    ⏰ {formatDate(ticket.followUpDate)}
                  </div>
                )}
              </div>
            );
          })}
          {/* Load more button */}
          {hasMore && !loading && (
            <button onClick={() => fetchTickets(true)} disabled={loadingMore} style={{ margin: 18, padding: '10px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, border: 'none', fontSize: 16, cursor: 'pointer', opacity: loadingMore ? 0.6 : 1 }}>
              {loadingMore ? 'Loading...' : 'Load more tickets'}
            </button>
          )}
        </div>
      </aside>
      {/* Main content */}
      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', background: darkMode ? '#181a1b' : '#f7f6f2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Alerts/notifications - now centered at the top of main content */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          {overdueFollowUps.length > 0 && showAlert && (
            <div style={{
              background: 'linear-gradient(90deg, #fff3e0 0%, #ffeaea 100%)',
              color: '#b26a00',
              border: '1.5px solid #ffd6d6',
              borderRadius: 8,
              padding: '0.5em 1.2em',
              margin: '0 auto 0.7em auto',
              maxWidth: 480,
              fontWeight: 600,
              fontSize: '0.98em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 6px #ffeaea',
            }}>
              <span style={{ fontSize: '1em', display: 'flex', alignItems: 'center', gap: 6 }}>⚠️ <span>{`You have ${overdueFollowUps.length} ticket${overdueFollowUps.length > 1 ? 's' : ''} that needed follow up in previous days!`}</span></span>
              <button onClick={() => setShowAlert(false)} style={{
                background: 'none',
                border: 'none',
                color: '#b26a00',
                fontWeight: 700,
                fontSize: '1.1em',
                marginLeft: 12,
                cursor: 'pointer',
                borderRadius: 6,
                padding: '0.1em 0.7em',
                transition: 'background 0.18s',
                lineHeight: 1,
              }} title="Dismiss">×</button>
            </div>
          )}
          {todayFollowUps.length > 0 && showAlert && (
            <div style={{
              background: 'linear-gradient(90deg, #ffeaea 0%, #fffbe6 100%)',
              color: '#c00',
              border: '1.5px solid #ffd6d6',
              borderRadius: 8,
              padding: '0.5em 1.2em',
              margin: '0 auto 0.7em auto',
              maxWidth: 480,
              fontWeight: 600,
              fontSize: '0.98em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 6px #ffeaea',
            }}>
              <span style={{ fontSize: '1em', display: 'flex', alignItems: 'center', gap: 6 }}>⏰ <span>{`You have ${todayFollowUps.length} ticket${todayFollowUps.length > 1 ? 's' : ''} that need${todayFollowUps.length > 1 ? '' : 's'} follow up today!`}</span></span>
              <button onClick={() => setShowAlert(false)} style={{
                background: 'none',
                border: 'none',
                color: '#c00',
                fontWeight: 700,
                fontSize: '1.1em',
                marginLeft: 12,
                cursor: 'pointer',
                borderRadius: 6,
                padding: '0.1em 0.7em',
                transition: 'background 0.18s',
                lineHeight: 1,
              }} title="Dismiss">×</button>
            </div>
          )}
        </div>
        {selectedTicket ? (
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
            position: 'relative',
          }}>
            {/* Header row: subject, icons, status dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontWeight: 800, fontSize: '1.5em', color: darkMode ? '#90caf9' : '#1976d2', flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                {selectedTicket.subject}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => handleEdit(selectedTicket)} style={{ background: 'none', border: 'none', color: darkMode ? '#90caf9' : '#1976d2', fontSize: '1.3em', cursor: 'pointer', marginRight: 2 }} title="Edit ticket">✏️</button>
                <button onClick={() => handleDelete(selectedTicket.id)} style={{ background: 'none', border: 'none', color: '#c00', fontSize: '1.3em', cursor: 'pointer', marginRight: 10 }} title="Delete ticket">🗑️</button>
                <select
                  value={selectedTicket.status || 'open'}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    setTickets(tickets => tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
                    try {
                      await saveTicket({ ...selectedTicket, status: newStatus, updatedAt: new Date().toISOString() });
                      // If ticket moved out of current tab, clear selection
                      const isNowClosed = newStatus === 'closed';
                      const isNowOpen = newStatus !== 'closed';
                      if ((activeTab === 'open' && isNowClosed) || (activeTab === 'closed' && isNowOpen)) {
                        setSelectedId(null);
                      }
                    } catch (err) {
                      alert('Failed to update status.');
                    }
                  }}
                  style={{
                    padding: '0.5em 1.2em',
                    borderRadius: 8,
                    border: '1.5px solid #bdbdbd',
                    fontSize: '1.08em',
                    fontWeight: 600,
                    background: darkMode ? '#23272e' : '#f7f6f2',
                    color: darkMode ? '#e3e3e3' : '#232323',
                    boxShadow: '0 1px 4px #ececec',
                    minWidth: 120,
                  }}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            {/* Only show details if ticket is in the current tab */}
            {(activeTab === 'open' ? (selectedTicket.status !== 'closed') : (selectedTicket.status === 'closed')) && (
              <>
                <div style={{ fontSize: '1.13em', color: darkMode ? '#bdbdbd' : '#232323', marginBottom: 18, whiteSpace: 'pre-line' }}>
                  <b>Company:</b> {selectedTicket.company}<br />
                  <b>Ticket ID:</b> {selectedTicket.ticketId}<br />
                  {/* Only show follow up for open tickets */}
                  {activeTab === 'open' && <><b>Follow Up:</b> {selectedTicket.followUpDate ? formatDate(selectedTicket.followUpDate) : 'N/A'}<br /></>}
                  {/* Show status and date closed for closed tickets */}
                  {activeTab === 'closed' && <>
                    <b>Status:</b> Closed<br />
                    <b>Date Closed:</b> {selectedTicket.updatedAt ? formatDate(selectedTicket.updatedAt) : 'N/A'}<br />
                  </>}
                </div>
                <div style={{ display: 'flex', gap: 18, color: darkMode ? '#aaa' : '#888', fontSize: '0.98em' }}>
                  <div>Created: {formatDate(selectedTicket.createdAt)}</div>
                  <div>Updated: {formatDate(selectedTicket.updatedAt)}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ color: darkMode ? '#888' : '#888', fontSize: '1.2em', marginTop: 80 }}>Select a ticket to view details.</div>
        )}
      </main>
      {/* Modal for add/edit */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: darkMode ? 'rgba(24,26,27,0.88)' : 'rgba(44,62,80,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: darkMode ? '#23272e' : '#fff', borderRadius: 18, boxShadow: darkMode ? '0 2px 24px #181a1b' : '0 2px 24px #ececec', padding: '48px 48px 40px 48px', minWidth: 400, maxWidth: 520, width: '100%', fontFamily: 'inherit', color: darkMode ? '#e3e3e3' : '#232323' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25em', marginBottom: 32, letterSpacing: '0.01em', color: '#232323' }}>{modalData?.id ? 'Edit' : 'Add'} Ticket</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Company
                <input
                  type="text"
                  name="ticketCompany"
                  placeholder="Company"
                  value={modalData?.company || ''}
                  onChange={e => setModalData(d => ({ ...d, company: e.target.value }))}
                  style={{ marginTop: 10, marginBottom: 10, width: '100%', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1.08em', fontWeight: 700, background: darkMode ? '#23272e' : '#23232310', color: darkMode ? '#e3e3e3' : '#232323' }}
                  autoFocus
                />
              </label>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Subject
                <input
                  type="text"
                  name="ticketSubject"
                  placeholder="Subject"
                  value={modalData?.subject || ''}
                  onChange={e => setModalData(d => ({ ...d, subject: e.target.value }))}
                  style={{ marginTop: 10, marginBottom: 10, width: '100%', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1.08em', fontWeight: 700, background: darkMode ? '#23272e' : '#23232310', color: darkMode ? '#e3e3e3' : '#232323' }}
                />
              </label>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Ticket ID
                <input
                  type="text"
                  name="ticketId"
                  placeholder="Ticket ID"
                  value={modalData?.ticketId || ''}
                  onChange={e => setModalData(d => ({ ...d, ticketId: e.target.value }))}
                  style={{ marginTop: 10, marginBottom: 10, width: '100%', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1.08em', fontWeight: 700, background: darkMode ? '#23272e' : '#23232310', color: darkMode ? '#e3e3e3' : '#232323' }}
                />
              </label>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Follow Up Date
                <DatePicker
                  selected={modalData?.followUpDate ? new Date(modalData.followUpDate) : null}
                  onChange={date => setModalData(d => ({ ...d, followUpDate: date ? date.toISOString() : '' }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select date and time"
                  className="custom-datepicker-input styled-datepicker"
                  style={{
                    marginLeft: 0,
                    marginTop: 6,
                    marginBottom: 6,
                    width: '100%',
                    padding: '0.7em 1.2em',
                    borderRadius: 10,
                    border: '1.5px solid #bdbdbd',
                    fontSize: '1.08em',
                    fontWeight: 600,
                    background: darkMode ? '#23272e' : '#f7f6f2',
                    color: darkMode ? '#e3e3e3' : '#232323',
                    boxShadow: '0 2px 8px #ececec',
                    minHeight: 44,
                  }}
                  popperPlacement="bottom"
                />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginTop: 2, marginBottom: 2 }}>
                {/* Priority dropdown removed */}
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
            <div style={{ fontWeight: 800, fontSize: '1.15em', marginBottom: 18, color: '#c00' }}>Delete Ticket?</div>
            <div style={{ fontSize: '1.08em', color: '#232323', marginBottom: 24 }}>Are you sure you want to delete this ticket? This will move it to the trash.</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={confirmDelete} style={{ background: '#c00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Delete</button>
              <button onClick={cancelDelete} style={{ background: '#eee', color: '#232323', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;
