import React, { useState, useEffect } from 'react';
import './App.css';
import './Tickets.css';
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

function Tickets({ darkMode, setDarkMode, packages, setPackages, setCachedData, user, setIsUpdatingPackages, savePackages, toast }) {
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
          // Auto-switch to appropriate tab based on ticket status
          const targetTicket = fetched.find(t => t.id === ticketParam);
          if (targetTicket && (targetTicket.status || 'open') === 'closed') {
            setActiveTab('closed');
          } else {
            setActiveTab('open');
          }
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
          // Auto-switch to appropriate tab based on ticket status
          const targetTicket = cachedTickets.find(t => t.id === ticketParam);
          if (targetTicket && (targetTicket.status || 'open') === 'closed') {
            setActiveTab('closed');
          } else {
            setActiveTab('open');
          }
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
        if ((oldTicket.isBusinessProfileClaiming || oldTicket.taskType === 'businessProfileClaiming' || oldTicket.type === 'Business Profile Claiming') && 
            oldTicket.status !== ticketWithDefaults.status) {
          try {
            // Use the centralized sync function from ticketSyncUtils
            const { syncTicketWithPackage } = await import('./ticketSyncUtils');
            await syncTicketWithPackage(ticketWithDefaults, ticketWithDefaults.status, packages, setPackages, setCachedData, user, setIsUpdatingPackages, savePackages, toast);
          } catch (error) {
            console.error('Error syncing with packages:', error);
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
    <div className={`tickets-modern${darkMode ? ' dark' : ''}`}>
      {/* Sidebar */}
      <aside className="tickets-sidebar">
        {/* Tabs for Open/Closed */}
        <div className="tickets-tabs">
          <button
            className={`tickets-tab${activeTab === 'open' ? ' active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Open
          </button>
          <button
            className={`tickets-tab${activeTab === 'closed' ? ' active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            Closed
          </button>
        </div>
        
        <div className="tickets-sidebar-header">
          <span>{activeTab === 'open' ? 'All tickets' : 'Closed tickets'}</span>
          <button
            className="tickets-add-button"
            onClick={handleAdd}
            title="Add ticket"
          >
            +
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="tickets-search-container">
          <div className="tickets-search-wrapper">
            <span className="tickets-search-icon">🔍</span>
            <input
              type="text"
              name="ticketSearch"
              className="tickets-search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchFocused ? '' : 'Search tickets...'}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>
        
        {/* Ticket List */}
        <div className="tickets-list">
          {(activeTab === 'open' ? openTickets : closedTickets).length === 0 && (
            <div className="tickets-empty-state">No tickets found.</div>
          )}
          {(activeTab === 'open' ? openTickets : closedTickets).map(ticket => {
            // Determine follow-up status
            const isTodayFollowUp = isToday(ticket.followUpDate) && (ticket.status || 'open') !== 'closed';
            const isOverdueFollowUp = isOverdue(ticket.followUpDate) && (ticket.status || 'open') !== 'closed';
            return (
              <div
                key={ticket.id}
                className={`tickets-item${selectedId === ticket.id ? ' selected' : ''}`}
                onClick={() => setSelectedId(ticket.id)}
              >
                <div className="tickets-item-header">
                  <div className="tickets-item-title">{ticket.subject}</div>
                  {/* Business Profile Claiming indicator */}
                  {ticket.taskType === 'businessProfileClaiming' && (
                    <span className="tickets-badge bpc" title="Business Profile Claiming Task">
                      🏢 BPC
                    </span>
                  )}
                  {/* Alert icon for follow-up with text (only for open tickets) */}
                  {activeTab === 'open' && isTodayFollowUp && (
                    <span className="tickets-badge followup" title="Needs follow up today">
                      ⏰ Follow up
                    </span>
                  )}
                  {activeTab === 'open' && isOverdueFollowUp && (
                    <span className="tickets-badge overdue" title="Overdue follow up">
                      ⏰ Follow up
                    </span>
                  )}
                </div>
                <div className="tickets-item-company">{ticket.company}</div>
                {/* Only show follow up date for open tickets */}
                {activeTab === 'open' && ticket.followUpDate && (
                  <div className={`tickets-item-followup${isOverdue(ticket.followUpDate) ? ' overdue' : isTodayFollowUp ? ' today' : ''}`}>
                    ⏰ {formatDate(ticket.followUpDate)}
                  </div>
                )}
              </div>
            );
          })}
          {/* Load more button */}
          {hasMore && !loading && (
            <button 
              className="tickets-load-more"
              onClick={() => fetchTickets(true)} 
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more tickets'}
            </button>
          )}
        </div>
      </aside>
      
      {/* Main content */}
      <main className="tickets-main">
        {/* Alerts/notifications */}
        <div className="tickets-alerts">
          {overdueFollowUps.length > 0 && showAlert && (
            <div className="tickets-alert overdue">
              <span>⚠️ {`You have ${overdueFollowUps.length} ticket${overdueFollowUps.length > 1 ? 's' : ''} that needed follow up in previous days!`}</span>
              <button 
                className="tickets-alert-dismiss"
                onClick={() => setShowAlert(false)} 
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          {todayFollowUps.length > 0 && showAlert && (
            <div className="tickets-alert today">
              <span>⏰ {`You have ${todayFollowUps.length} ticket${todayFollowUps.length > 1 ? 's' : ''} that need${todayFollowUps.length > 1 ? '' : 's'} follow up today!`}</span>
              <button 
                className="tickets-alert-dismiss"
                onClick={() => setShowAlert(false)} 
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        {/* Header with History Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', width: '100%', maxWidth: '900px' }}>
          <button
            className={`tickets-history-button${showHistory ? ' active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
          </button>
        </div>
        
        {/* History Panel */}
        {showHistory && (
          <div className="tickets-history-panel">
            {/* Icon-only Clear History button in upper right */}
            <button
              className="tickets-history-clear"
              onClick={() => setClearHistoryModal(true)}
              title="Clear History"
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
              <h3 className="tickets-history-title">History Log</h3>
            </div>
            <div className="tickets-history-content">
              {history.length === 0 ? (
                <p className="tickets-history-empty">
                  No history entries yet
                </p>
              ) : (
                <div>
                  {history.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`tickets-history-entry${entry.action === 'reverted' ? ' reverted' : ''}`}
                    >
                      <div className="tickets-history-info">
                        <div className="tickets-history-header">
                          <span className="tickets-history-company">
                            {entry.company} - {entry.subject}
                          </span>
                          <span className="tickets-history-ticket-id">
                            {entry.ticketId}
                          </span>
                        </div>
                        <div className="tickets-history-changes">
                          <span>{entry.field}:</span>
                          <span className={`tickets-history-old-value${entry.oldValue === 'Closed' ? ' closed' : entry.oldValue === 'Open' ? ' open' : ''}`}>
                            {entry.oldValue}
                          </span>
                          <span className="tickets-history-arrow">→</span>
                          <span className={`tickets-history-new-value${entry.newValue === 'Closed' ? ' closed' : entry.newValue === 'Open' ? ' open' : ''}`}>
                            {entry.newValue}
                          </span>
                          {entry.action === 'reverted' && (
                            <span className="tickets-history-reverted">
                              <span>🔄</span> Reverted
                            </span>
                          )}
                        </div>
                        <div className="tickets-history-timestamp">
                          <span>🕒</span>
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      {entry.action !== 'reverted' && (
                        <button
                          className="tickets-history-revert-button"
                          onClick={() => revertChange(entry)}
                        >
                          <span>↩️</span>
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
          <div className="tickets-details">
            {/* Header row: subject, icons, status dropdown */}
            <div className="tickets-details-header">
              <div className="tickets-details-title">
                {selectedTicket.subject}
              </div>
              <div className="tickets-details-actions">
                <button 
                  className="tickets-action-button"
                  onClick={() => handleEdit(selectedTicket)} 
                  title="Edit ticket"
                >
                  ✏️
                </button>
                <button 
                  className="tickets-action-button delete"
                  onClick={() => handleDelete(selectedTicket.id)} 
                  title="Delete ticket"
                >
                  🗑️
                </button>
                                 <select
                   className="tickets-status-select"
                   value={selectedTicket.status || 'open'}
                   onChange={async (e) => {
                     const newStatus = e.target.value;
                     const oldStatus = selectedTicket.status || 'open';
                     setTickets(tickets => tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
                     try {
                       await saveTicket({ ...selectedTicket, status: newStatus, updatedAt: new Date().toISOString() });
                       
                       // Sync with packages if this is a Business Profile Claiming ticket and status changed
                       if ((selectedTicket.isBusinessProfileClaiming || selectedTicket.taskType === 'businessProfileClaiming' || selectedTicket.type === 'Business Profile Claiming') && 
                           oldStatus !== newStatus) {
                         try {
                           // Use the centralized sync function from ticketSyncUtils
                           const { syncTicketWithPackage } = await import('./ticketSyncUtils');
                           await syncTicketWithPackage(selectedTicket, newStatus, packages, setPackages, setCachedData, user, setIsUpdatingPackages, savePackages, toast);
                         } catch (error) {
                           console.error('Error syncing with packages:', error);
                           toast.error('Failed to sync with package task');
                         }
                       }
                       
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
                 >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            {/* Only show details if ticket is in the current tab */}
            {(activeTab === 'open' ? (selectedTicket.status !== 'closed') : (selectedTicket.status === 'closed')) && (
              <>
                <div className="tickets-details-content">
                  <div className="tickets-details-field">
                    <span className="tickets-details-label">Company:</span> {selectedTicket.company}
                  </div>
                  <div className="tickets-details-field">
                    <span className="tickets-details-label">Ticket ID:</span> {selectedTicket.ticketId}
                    <button
                      className="tickets-copy-button"
                                              onClick={() => {
                          navigator.clipboard.writeText(selectedTicket.ticketId);
                          toast.success('Ticket ID copied to clipboard!');
                        }}
                      title="Copy Ticket ID"
                    >
                      📋
                    </button>
                  </div>
                  {/* Show description if available */}
                  {selectedTicket.description && (
                    <div className="tickets-details-field">
                      <span className="tickets-details-label">Description:</span>
                      <div className="tickets-description-box">
                        {selectedTicket.description}
                      </div>
                    </div>
                  )}
                  {/* Only show follow up for open tickets */}
                  {activeTab === 'open' && (
                    <div className="tickets-details-field">
                      <span className="tickets-details-label">Follow Up:</span> {selectedTicket.followUpDate ? formatDate(selectedTicket.followUpDate) : 'N/A'}
                    </div>
                  )}
                  {/* Show status and date closed for closed tickets */}
                  {activeTab === 'closed' && (
                    <>
                      <div className="tickets-details-field">
                        <span className="tickets-details-label">Status:</span> Closed
                </div>
                      <div className="tickets-details-field">
                        <span className="tickets-details-label">Date Closed:</span> {selectedTicket.updatedAt ? formatDate(selectedTicket.updatedAt) : 'N/A'}
                      </div>
                    </>
                  )}
                </div>
                <div className="tickets-details-footer">
                  <div>Created: {formatDate(selectedTicket.createdAt)}</div>
                  <div>Updated: {formatDate(selectedTicket.updatedAt)}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="tickets-empty-details">Select a ticket to view details.</div>
        )}
      </main>
      
      {/* Modal for add/edit */}
      {showModal && (
        <div className="tickets-modal-overlay">
          <div className="tickets-modal">
            <div className="tickets-modal-title">{modalData?.id ? 'Edit' : 'Add'} Ticket</div>
            <div className="tickets-modal-form">
              <label className="tickets-form-label">
                Company
                <input
                  type="text"
                  name="ticketCompany"
                  className="tickets-form-input"
                  placeholder="Company"
                  value={modalData?.company || ''}
                  onChange={e => setModalData(d => ({ ...d, company: e.target.value }))}
                  autoFocus
                />
              </label>
              <label className="tickets-form-label">
                Subject
                <input
                  type="text"
                  name="ticketSubject"
                  className="tickets-form-input"
                  placeholder="Subject"
                  value={modalData?.subject || ''}
                  onChange={e => setModalData(d => ({ ...d, subject: e.target.value }))}
                />
              </label>
              <label className="tickets-form-label">
                Ticket ID
                <div className="tickets-form-row">
                  <input
                    type="text"
                    name="ticketId"
                    className="tickets-form-input"
                    placeholder="Ticket ID"
                    value={modalData?.ticketId || ''}
                    onChange={e => setModalData(d => ({ ...d, ticketId: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="tickets-form-copy-button"
                                          onClick={() => {
                        navigator.clipboard.writeText(modalData?.ticketId || '');
                        toast.success('Ticket ID copied to clipboard!');
                      }}
                    title="Copy Ticket ID"
                  >
                    📋
                  </button>
                </div>
              </label>
              <label className="tickets-form-label">
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
                      className="tickets-form-input"
                      placeholder="Follow Up Date"
                    />
                  }
                />
              </label>
              <label className="tickets-form-label">
                Description
                <textarea
                  name="ticketDescription"
                  className="tickets-form-textarea"
                  placeholder="Enter ticket description (optional)"
                  value={modalData?.description || ''}
                  onChange={e => setModalData(d => ({ ...d, description: e.target.value }))}
                />
              </label>
              <div className="tickets-modal-buttons">
                <button 
                  className="tickets-modal-save"
                  onClick={() => handleModalSave(modalData)}
                >
                  Save
                </button>
                <button 
                  className="tickets-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal for Delete */}
      {confirmDeleteId && (
        <div className="tickets-modal-overlay">
          <div className="tickets-confirm-modal">
            <div className="tickets-confirm-title">Delete Ticket?</div>
            <div className="tickets-confirm-desc">Are you sure you want to delete this ticket? This will move it to the trash.</div>
            <div className="tickets-confirm-buttons">
              <button 
                className="tickets-confirm-delete"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button 
                className="tickets-confirm-cancel"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div className="tickets-modal-overlay">
          <div className="tickets-confirm-modal">
            <div className="tickets-confirm-title">Clear History?</div>
            <div className="tickets-confirm-desc">Are you sure you want to clear all history entries? This action cannot be undone.</div>
            <div className="tickets-confirm-buttons">
              <button 
                className="tickets-confirm-delete"
                onClick={handleClearHistory}
              >
                Clear
              </button>
              <button 
                className="tickets-confirm-cancel"
                onClick={() => setClearHistoryModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;
