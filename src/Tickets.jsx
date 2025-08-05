import React, { useState, useEffect } from 'react';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getTicketsPaginated, saveTicket, deleteTicket, getTrash, saveTrash, saveHistoryLog, loadHistoryLog, clearHistoryLog } from './firestoreHelpers';
import { auth, db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

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
  const [alertMessage, setAlertMessage] = useState('');
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'closed'


  // LocalStorage cache key
  const TICKETS_CACHE_KEY = 'tickets_cache_v1';

  // --- History Log State ---
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set());
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  // History entry structure
  const createHistoryEntry = (ticketId, company, subject, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ticketId,
    company,
    subject,
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
    setRecentChanges(prev => new Set([...prev, entry.ticketId]));
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.ticketId);
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
      // Update in tickets
      setTickets(prev => prev.map(t => t.id === historyEntry.ticketId ? { ...t, [field]: value } : t));
      await saveTicket({ ...tickets.find(t => t.id === historyEntry.ticketId), [field]: value });
      // Add revert entry to history
      const revertEntry = createHistoryEntry(
        historyEntry.ticketId,
        historyEntry.company,
        historyEntry.subject,
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
      
      // Handle URL parameter for specific ticket selection
      if (!loadMore) {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketParam = urlParams.get('ticket');
        if (ticketParam && fetched.find(t => t.id === ticketParam)) {
          setSelectedId(ticketParam);
        } else if (!selectedId && fetched.length > 0) {
          setSelectedId(fetched[0].id);
        }
        
        // Cache in localStorage
        localStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify({ tickets: fetched, lastDocId: newLastDoc?.id || null, ts: Date.now() }));
      }
    } catch (e) {
      // Optionally handle error
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // On mount: try cache, then fetch
  useEffect(() => {
    // Check for URL parameter to select specific ticket
    const urlParams = new URLSearchParams(window.location.search);
    const ticketParam = urlParams.get('ticket');
    
    const cache = localStorage.getItem(TICKETS_CACHE_KEY);
    if (cache) {
      const { tickets: cachedTickets, lastDocId, ts } = JSON.parse(cache);
      if (Array.isArray(cachedTickets) && Date.now() - ts < 1000 * 60 * 10) { // 10 min cache
        setTickets(cachedTickets);
        // Select specific ticket if provided in URL, otherwise first ticket
        if (ticketParam && cachedTickets.find(t => t.id === ticketParam)) {
          setSelectedId(ticketParam);
        } else {
          setSelectedId(cachedTickets[0]?.id || null);
        }
        setLoading(false);
        // Still fetch latest in background
        fetchTickets(false);
        return;
      }
    }
    fetchTickets(false);
  }, []);

  // Load history from Firestore on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('tickets');
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  // Save history to Firestore on every change
  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('tickets', history).catch(err => {
        // console.error('Error saving history:', err);
      });
    }
  }, [history]);

  // Real-time listener for tickets
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const ticketsColRef = collection(db, 'users', auth.currentUser.uid, 'tickets');
    let lastUpdate = 0;
    const THROTTLE_DELAY = 8000; // 8 seconds throttle to reduce Firestore operations
    
    const unsubscribe = onSnapshot(ticketsColRef, (snapshot) => {
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_DELAY) {
        // console.log('Tickets collection changed, refreshing...');
        // Clear cache when tickets change
        localStorage.removeItem(TICKETS_CACHE_KEY);
        // Refresh tickets with a small delay to prevent rapid refreshes
        setTimeout(() => {
          fetchTickets(false);
        }, 500);
        lastUpdate = now;
        // console.log('Tickets updated from Firestore (throttled)');
      }
    }, (error) => {
      // console.error('Error listening to tickets:', error);
      // Don't break the app on permission errors during logout
      if (error.code === 'permission-denied' && !auth.currentUser) {
        // console.log('Tickets listener permission error during logout - ignoring');
        return;
      }
    });
    
    return () => unsubscribe();
  }, [auth.currentUser]);

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
    setModalData({ company: '', subject: '', ticketId: '', followUpDate: '', description: '', status: 'open', priority: 'medium' });
    setShowModal(true);
  };
  const handleEdit = (ticket) => {
    setModalData(ticket);
    setShowModal(true);
  };
  const handleModalSave = async (data) => {
    const ticketWithDefaults = { ...data, priority: data.priority || 'medium', status: data.status || 'open' };
    let newTicket = null;
    let oldTicket = null;
    
    if (ticketWithDefaults.id) {
      oldTicket = tickets.find(t => t.id === ticketWithDefaults.id);
      setTickets(tickets => tickets.map(t => t.id === ticketWithDefaults.id ? { ...t, ...ticketWithDefaults, updatedAt: new Date().toISOString() } : t));
      newTicket = { ...ticketWithDefaults, updatedAt: new Date().toISOString() };
      
      // Add to history for edit
      if (oldTicket) {
        if (oldTicket.company !== ticketWithDefaults.company) addToHistory(createHistoryEntry(ticketWithDefaults.id, oldTicket.company, oldTicket.subject, 'company', oldTicket.company, ticketWithDefaults.company));
        if (oldTicket.subject !== ticketWithDefaults.subject) addToHistory(createHistoryEntry(ticketWithDefaults.id, oldTicket.company, oldTicket.subject, 'subject', oldTicket.subject, ticketWithDefaults.subject));
        if (oldTicket.ticketId !== ticketWithDefaults.ticketId) addToHistory(createHistoryEntry(ticketWithDefaults.id, oldTicket.company, oldTicket.subject, 'ticketId', oldTicket.ticketId, ticketWithDefaults.ticketId));
        if (oldTicket.followUpDate !== ticketWithDefaults.followUpDate) addToHistory(createHistoryEntry(ticketWithDefaults.id, oldTicket.company, oldTicket.subject, 'followUpDate', oldTicket.followUpDate, ticketWithDefaults.followUpDate));
        if (oldTicket.description !== ticketWithDefaults.description) addToHistory(createHistoryEntry(ticketWithDefaults.id, oldTicket.company, oldTicket.subject, 'description', oldTicket.description, ticketWithDefaults.description));
        if (oldTicket.status !== ticketWithDefaults.status) addToHistory(createHistoryEntry(ticketWithDefaults.id, oldTicket.company, oldTicket.subject, 'status', oldTicket.status, ticketWithDefaults.status));
        
        // Sync with packages if this is a Business Profile Claiming ticket
        if (oldTicket.taskType === 'businessProfileClaiming' && oldTicket.status !== ticketWithDefaults.status) {
          try {
            const { getPackages, savePackages } = await import('./firestoreHelpers');
            const packages = await getPackages();
            let updated = false;
            
            // Find and update the company in the correct package
            for (const [pkgName, pkgCompanies] of Object.entries(packages)) {
              const companyIndex = pkgCompanies.findIndex(c => c.ticketId === ticketWithDefaults.id);
              if (companyIndex !== -1) {
                if (ticketWithDefaults.status === 'closed') {
                  // Mark Business Profile Claiming as Completed
                  packages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Completed';
                  updated = true;
                } else if (ticketWithDefaults.status === 'open' && oldTicket.status === 'closed') {
                  // Mark Business Profile Claiming as Ticket if reopened
                  packages[pkgName][companyIndex].tasks.businessProfileClaiming = 'Ticket';
                  updated = true;
                }
                break;
              }
            }
            
            if (updated) {
              await savePackages(packages);
              toast.success(`✅ Package task updated for ${ticketWithDefaults.company}`);
            }
          } catch (error) {
            // console.error('Error syncing with packages:', error);
            toast.error('Failed to sync with package task');
          }
        }
      }
    } else {
      newTicket = {
        ...ticketWithDefaults,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets(tickets => [newTicket, ...tickets]);
      // Add to history for add
      addToHistory(createHistoryEntry(newTicket.id, newTicket.company, newTicket.subject, 'created', '', 'Ticket created'));
    }
    
    setShowModal(false);
    try {
      await saveTicket(newTicket);
      toast.success('Ticket saved successfully');
    } catch (err) {
      alert('Failed to save ticket. Please try again.');
      setTickets(tickets => tickets.filter(t => t.id !== newTicket.id));
      setAlertMessage('Error saving ticket');
      setShowAlert(true);
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
      toast.success('Ticket deleted successfully');
    } catch (err) {
      // Optionally show an error, but do not delay UI
      setAlertMessage('Error deleting ticket');
      setShowAlert(true);
    }
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  // Sidebar ticket click
  const handleSidebarClick = (id) => setSelectedId(id);

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('tickets');
    setClearHistoryModal(false);
  };

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
                  {/* Business Profile Claiming indicator */}
                  {ticket.taskType === 'businessProfileClaiming' && (
                    <span title="Business Profile Claiming Task" style={{ marginLeft: 4, fontSize: '1.1em', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🏢 <span style={{ fontSize: '0.92em', fontWeight: 500, color: '#1976d2' }}>BPC</span>
                    </span>
                  )}
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
        {/* Header with History Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', width: '100%', maxWidth: '900px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 16px',
              background: showHistory ? '#1976d2' : '#f8f9fa',
              color: showHistory ? '#ffffff' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
          </button>
        </div>
        {/* History Panel */}
        {showHistory && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e0e7ef',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '30px',
            position: 'relative',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto 30px'
          }}>
            {/* Icon-only Clear History button in upper right */}
            <button
              onClick={() => setClearHistoryModal(true)}
              title="Clear History"
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                margin: 0,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background 0.18s',
                zIndex: 1
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f8d7da'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              {/* Trash can SVG icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <div style={{ paddingRight: '40px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#495057' }}>History Log</h3>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '16px', marginTop: '20px' }}>
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', margin: '30px 0', fontSize: '1.1rem' }}>
                  No history entries yet
                </p>
              ) : (
                <div>
                  {history.map((entry, index) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        border: '1px solid #e9ecef',
                        borderRadius: '10px',
                        marginBottom: '12px',
                        background: entry.action === 'reverted' ? '#fff3cd' : '#ffffff',
                        borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : '4px solid #1976d2',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                        gap: '16px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#495057', 
                          marginBottom: '6px', 
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ 
                            flex: '1', 
                            minWidth: 0, 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            color: '#1976d2',
                            fontWeight: '600'
                          }}>
                            {entry.company} - {entry.subject}
                          </span>
                          <span style={{ 
                            color: '#1976d2',
                            fontWeight: '500', 
                            whiteSpace: 'nowrap',
                            opacity: 0.85
                          }}>
                            {entry.ticketId}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '0.95rem', 
                          color: '#6c757d', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ whiteSpace: 'nowrap' }}>{entry.field}:</span>
                          <span style={{ 
                            color: entry.oldValue === 'Closed' ? '#28a745' : entry.oldValue === 'Open' ? '#dc3545' : '#6c757d', 
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}>{entry.oldValue}</span>
                          <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                          <span style={{ 
                            color: entry.newValue === 'Closed' ? '#28a745' : entry.newValue === 'Open' ? '#dc3545' : '#6c757d', 
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}>{entry.newValue}</span>
                          {entry.action === 'reverted' && (
                            <span style={{ 
                              color: '#ffc107', 
                              marginLeft: '4px', 
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <span style={{ fontSize: '1.1em', lineHeight: 1 }}>🔄</span> Reverted
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#adb5bd',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ fontSize: '0.9em' }}>🕒</span>
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      {entry.action !== 'reverted' && (
                        <button
                          onClick={() => revertChange(entry)}
                          style={{
                            padding: '6px 12px',
                            background: '#f8f9fa',
                            color: '#6c757d',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            marginLeft: '8px',
                            alignSelf: 'center',
                            whiteSpace: 'nowrap',
                            height: '32px'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#e9ecef';
                            e.currentTarget.style.borderColor = '#ced4da';
                            e.currentTarget.style.color = '#495057';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#dee2e6';
                            e.currentTarget.style.color = '#6c757d';
                          }}
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
                    const oldStatus = selectedTicket.status || 'open';
                    setTickets(tickets => tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
                    try {
                      await saveTicket({ ...selectedTicket, status: newStatus, updatedAt: new Date().toISOString() });
                      
                      // Let the ticket listener in App.jsx handle the package sync
                      // This ensures consistent behavior and avoids duplicate sync logic
                      // console.log(`🎫 Ticket status updated to ${newStatus}, letting listener handle package sync`);
                      
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <b>Ticket ID:</b> {selectedTicket.ticketId}
                    <button
                                              onClick={() => {
                          navigator.clipboard.writeText(selectedTicket.ticketId);
                          toast.success('Ticket ID copied to clipboard!');
                        }}
                      title="Copy Ticket ID"
                      style={{
                        padding: '4px 6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderRadius: '3px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = darkMode ? '#404040' : '#f0f0f0';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      📋
                    </button>
                  </div>
                  {/* Show description if available */}
                  {selectedTicket.description && (
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                      <b>Description:</b><br />
                      <div style={{ 
                        marginLeft: '12px', 
                        marginTop: '4px', 
                        padding: '8px 12px', 
                        background: darkMode ? '#2a2a2a' : '#f8f9fa', 
                        borderRadius: '6px',
                        border: `1px solid ${darkMode ? '#404040' : '#e9ecef'}`,
                        fontSize: '0.95em',
                        lineHeight: '1.4'
                      }}>
                        {selectedTicket.description}
                      </div>
                    </div>
                  )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    name="ticketId"
                    placeholder="Ticket ID"
                    value={modalData?.ticketId || ''}
                    onChange={e => setModalData(d => ({ ...d, ticketId: e.target.value }))}
                    style={{ flex: 1, marginTop: 10, marginBottom: 10, padding: '16px 20px', borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: '1.08em', fontWeight: 700, background: darkMode ? '#23272e' : '#23232310', color: darkMode ? '#e3e3e3' : '#232323' }}
                  />
                  <button
                    type="button"
                                          onClick={() => {
                        navigator.clipboard.writeText(modalData?.ticketId || '');
                        toast.success('Ticket ID copied to clipboard!');
                      }}
                    title="Copy Ticket ID"
                    style={{
                      padding: '8px',
                      background: '#f8f9fa',
                      border: '1px solid #ced4da',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      minWidth: '36px',
                      height: '36px',
                      marginTop: '10px',
                      marginBottom: '10px'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#e9ecef';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#ced4da';
                    }}
                  >
                    📋
                  </button>
                </div>
              </label>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Follow Up Date
                <DatePicker
                  selected={modalData?.followUpDate ? new Date(modalData.followUpDate) : null}
                  onChange={date => setModalData(d => ({ ...d, followUpDate: date ? date.toISOString() : '' }))}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={20}
                  scrollableYearDropdown
                  onClickOutside={e => e.preventDefault()}
                  onInputClick={e => e.preventDefault()}
                  customInput={
                    <input
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
                        outline: 'none'
                      }}
                      placeholder="Follow Up Date"
                    />
                  }
                  renderCustomHeader={({ date, changeYear, changeMonth }) => (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '8px',
                      background: '#f8f9fa',
                      borderBottom: '1px solid #e9ecef',
                      borderRadius: '4px 4px 0 0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#495057'
                      }}>
                        <span>Quick Navigation:</span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); changeYear(date.getFullYear() - 1); }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              background: '#e9ecef',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#495057',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              minWidth: '32px'
                            }}
                            onMouseOver={e => { e.target.style.background = '#007bff'; e.target.style.color = '#fff'; }}
                            onMouseOut={e => { e.target.style.background = '#e9ecef'; e.target.style.color = '#495057'; }}
                          >
                            ←
                          </button>
                          <span style={{ fontSize: '1rem', fontWeight: '600', color: '#495057', minWidth: '60px', textAlign: 'center' }}>{date.getFullYear()}</span>
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); changeYear(date.getFullYear() + 1); }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              background: '#e9ecef',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#495057',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              minWidth: '32px'
                            }}
                            onMouseOver={e => { e.target.style.background = '#007bff'; e.target.style.color = '#fff'; }}
                            onMouseOut={e => { e.target.style.background = '#e9ecef'; e.target.style.color = '#495057'; }}
                          >
                            →
                          </button>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#fff3cd',
                        border: '2px solid #ffc107',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        color: '#856404',
                        fontWeight: '700',
                        margin: '8px 0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        📅 {date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #dee2e6'
                      }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#495057', marginBottom: '4px' }}>Quick Months:</div>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {[
                            { label: 'Jan', month: 0 },
                            { label: 'Feb', month: 1 },
                            { label: 'Mar', month: 2 },
                            { label: 'Apr', month: 3 },
                            { label: 'May', month: 4 },
                            { label: 'Jun', month: 5 },
                            { label: 'Jul', month: 6 },
                            { label: 'Aug', month: 7 },
                            { label: 'Sep', month: 8 },
                            { label: 'Oct', month: 9 },
                            { label: 'Nov', month: 10 },
                            { label: 'Dec', month: 11 }
                          ].map(({ label, month }) => {
                            const isCurrentMonth = date.getMonth() === month;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); changeMonth(month); }}
                                style={{
                                  padding: '3px 6px',
                                  fontSize: '0.75rem',
                                  background: isCurrentMonth ? '#007bff' : '#f8f9fa',
                                  border: `1px solid ${isCurrentMonth ? '#007bff' : '#dee2e6'}`,
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  color: isCurrentMonth ? '#fff' : '#6c757d',
                                  fontWeight: isCurrentMonth ? '600' : '500',
                                  transition: 'all 0.2s',
                                  minWidth: '28px',
                                  textAlign: 'center',
                                  position: 'relative'
                                }}
                                onMouseOver={e => {
                                  if (!isCurrentMonth) {
                                    e.target.style.background = '#28a745';
                                    e.target.style.color = '#fff';
                                    e.target.style.borderColor = '#28a745';
                                  }
                                }}
                                onMouseOut={e => {
                                  if (!isCurrentMonth) {
                                    e.target.style.background = '#f8f9fa';
                                    e.target.style.color = '#6c757d';
                                    e.target.style.borderColor = '#dee2e6';
                                  }
                                }}
                              >
                                {label}
                                {isCurrentMonth && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    width: '6px',
                                    height: '6px',
                                    background: '#fff',
                                    borderRadius: '50%',
                                    border: '1px solid #007bff'
                                  }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </label>
              <label style={{ fontWeight: 700, fontSize: '1.08em', color: '#232323', marginBottom: 8 }}>
                Description
                <textarea
                  name="ticketDescription"
                  placeholder="Enter ticket description (optional)"
                  value={modalData?.description || ''}
                  onChange={e => setModalData(d => ({ ...d, description: e.target.value }))}
                  style={{ 
                    marginTop: 10, 
                    marginBottom: 10, 
                    width: '100%', 
                    padding: '16px 20px', 
                    borderRadius: 8, 
                    border: '1.5px solid #bdbdbd', 
                    fontSize: '1.08em', 
                    fontWeight: 700, 
                    background: darkMode ? '#23272e' : '#23232310', 
                    color: darkMode ? '#e3e3e3' : '#232323',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
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

      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: darkMode ? 'rgba(24,26,27,0.88)' : 'rgba(44,62,80,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: darkMode ? '#23272e' : '#fff', borderRadius: 18, boxShadow: darkMode ? '0 2px 24px #181a1b' : '0 2px 24px #ececec', padding: 36, minWidth: 320, maxWidth: 400, color: darkMode ? '#e3e3e3' : '#232323' }}>
            <div style={{ fontWeight: 800, fontSize: '1.15em', marginBottom: 18, color: '#c00' }}>Clear History?</div>
            <div style={{ fontSize: '1.08em', color: '#232323', marginBottom: 24 }}>Are you sure you want to clear all history entries? This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={handleClearHistory} style={{ background: '#c00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Clear</button>
              <button onClick={() => setClearHistoryModal(false)} style={{ background: '#eee', color: '#232323', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;
