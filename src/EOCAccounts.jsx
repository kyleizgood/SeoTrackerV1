import React, { useEffect, useState } from 'react';
import { getEOCAccounts, reactivateEOCAccount, updateEOCDate, saveHistoryLog, loadHistoryLog, clearHistoryLog } from './firestoreHelpers';
import * as XLSX from 'xlsx';

const PACKAGE_COLORS = {
  'SEO - BASIC': '#4E342E',
  'SEO - PREMIUM': '#0097A7',
  'SEO - PRO': '#7B1FA2',
  'SEO - ULTIMATE': '#283593',
};

const PACKAGE_BORDERS = {
  'SEO - ULTIMATE': '2.5px solid #FFD600',
};

export default function EOCAccounts({ darkMode }) {
  const [eocAccounts, setEocAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState(null); // For confirmation modal
  const [showSuccessToast, setShowSuccessToast] = useState(false); // For success message
  const [editModal, setEditModal] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const PAGE_SIZE = 10;

  // --- History Log State ---
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set());
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  // History entry structure
  const createHistoryEntry = (companyId, name, pkg, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    companyId,
    name,
    pkg,
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
    setRecentChanges(prev => new Set([...prev, entry.companyId]));
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.companyId);
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
      setEocAccounts(prev => prev.map(a => a.id === historyEntry.companyId ? { ...a, [field]: value } : a));
      await updateEOCDate(historyEntry.companyId, historyEntry.pkg, value);
      const revertEntry = createHistoryEntry(
        historyEntry.companyId,
        historyEntry.name,
        historyEntry.pkg,
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
      const loaded = await loadHistoryLog('eocaccounts');
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('eocaccounts', history).catch(err => {
        console.error('Error saving history:', err);
      });
    }
  }, [history]);

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('eocaccounts');
    setClearHistoryModal(false);
  };

  useEffect(() => {
    loadEOCAccounts();
  }, []);

  const loadEOCAccounts = async () => {
    const accounts = await getEOCAccounts();
    setEocAccounts(accounts);
  };

  // Update reactivation handling
  const handleReactivate = async (account) => {
    setConfirmModal(account);
  };

  // Handle actual reactivation
  const confirmReactivation = async () => {
    const account = confirmModal;
    try {
      await reactivateEOCAccount(account.id, account.package);
      await loadEOCAccounts();
      setConfirmModal(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error reactivating account:', error);
    }
  };

  // Handle EOC date edit
  const handleEditEOC = (account) => {
    setEditModal(account);
    setEditDate(account.eocDate || '');
  };

  // Handle date update
  const handleDateUpdate = async () => {
    try {
      if (!editDate) {
        alert('Please enter a valid date');
        return;
      }
      const oldValue = editModal.eocDate || '';
      await updateEOCDate(editModal.id, editModal.package, editDate);
      await loadEOCAccounts();
      setEditModal(null);
      setToastMessage('EOC date updated successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      // Add to history
      addToHistory(createHistoryEntry(editModal.id, editModal.name, editModal.package, 'eocDate', oldValue, editDate));
    } catch (error) {
      console.error('Error updating EOC date:', error);
      alert('Error updating EOC date');
    }
  };

  // Add styles for modal and toast
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: '#fff',
      padding: '24px',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '400px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    },
    modalTitle: {
      fontSize: '1.2em',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#1e293b',
    },
    modalText: {
      marginBottom: '24px',
      color: '#475569',
      lineHeight: '1.5',
    },
    modalButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    buttonCancel: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      background: '#fff',
      color: '#475569',
      cursor: 'pointer',
      fontSize: '0.95em',
      fontWeight: '500',
    },
    buttonConfirm: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      background: '#4caf50',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '0.95em',
      fontWeight: '500',
    },
    successToast: {
      position: 'fixed',
      top: '24px',
      right: '24px',
      padding: '12px 24px',
      background: '#4caf50',
      color: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
    },
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredAccounts.length) return;
    const wsData = [
      [
        'Company Name',
        'Package',
        'Start Date',
        'EOC Date',
        'Status'
      ],
      ...filteredAccounts.map(row => [
        row.name || '',
        row.package || '',
        row.start || '',
        row.eocDate || '',
        row.status || ''
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EOC Accounts');
    XLSX.writeFile(wb, 'eoc-accounts.xlsx');
  };

  // Filtering logic
  const filteredAccounts = eocAccounts.filter(account => {
    if (packageFilter !== 'all' && account.package !== packageFilter) return false;
    if (search && !account.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const pageCount = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const paginatedAccounts = filteredAccounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ 
      padding: 24, 
      background: darkMode ? '#181a1b' : '#f7f6f2', 
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header with History Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', width: '100%', maxWidth: '900px', margin: '0 auto 20px' }}>
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
                          {entry.name}
                        </span>
                        <span style={{ 
                          color: '#1976d2',
                          fontWeight: '500', 
                          whiteSpace: 'nowrap',
                          opacity: 0.85
                        }}>
                          {entry.pkg}
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
                          color: entry.oldValue === 'Completed' ? '#28a745' : entry.oldValue === 'Pending' ? '#dc3545' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.oldValue}</span>
                        <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                        <span style={{ 
                          color: entry.newValue === 'Completed' ? '#28a745' : entry.newValue === 'Pending' ? '#dc3545' : '#6c757d', 
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
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32,
        background: darkMode ? '#242628' : '#ffffff',
        padding: '20px 24px',
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.75rem',
          fontWeight: 600,
          color: darkMode ? '#e4e6eb' : '#1a202c'
        }}>EOC Accounts Archive</h2>
        <button 
          onClick={exportToExcel}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: '#43a047',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(67, 160, 71, 0.2)',
            ':hover': {
              background: '#388e3c',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(67, 160, 71, 0.2)'
            }
          }}
        >
          <span style={{ fontSize: '1.1em' }}>📊</span>
          Export to Excel
        </button>
      </div>

      {/* Filters Section */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24, 
        alignItems: 'center', 
        flexWrap: 'wrap',
        background: darkMode ? '#242628' : '#ffffff',
        padding: '16px 24px',
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ 
            fontWeight: 500,
            color: darkMode ? '#e4e6eb' : '#4a5568'
          }}>Package:</label>
          <select 
            value={packageFilter} 
            onChange={e => { setPackageFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              background: darkMode ? '#2d3033' : '#fff',
              color: darkMode ? '#e4e6eb' : '#1a202c',
              minWidth: 160,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px top 50%',
              backgroundSize: '10px auto',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="all">All Packages</option>
            {Object.keys(PACKAGE_COLORS).map(pkg => (
              <option key={pkg} value={pkg}>{pkg}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          position: 'relative',
          flex: 1,
          maxWidth: 400
        }}>
          <input
            type="text"
            placeholder="Search company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: 8,
              border: '1.5px solid #e2e8f0',
              background: darkMode ? '#2d3033' : '#fff',
              color: darkMode ? '#e4e6eb' : '#1a202c',
              fontSize: '0.95rem',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          />
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a0aec0',
            pointerEvents: 'none'
          }}>
            🔍
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ 
        background: darkMode ? '#242628' : '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div className="responsive-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: darkMode ? '#2d3033' : '#f8fafc' }}>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Company Name</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Package</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Start Date</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>EOC Date</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'center', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Status</th>
                <th style={{ 
                  padding: '16px 20px', 
                  textAlign: 'center', 
                  borderBottom: `2px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                  color: darkMode ? '#e4e6eb' : '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map(account => (
                <tr 
                  key={account.id} 
                  style={{ 
                    borderBottom: `1px solid ${darkMode ? '#3d4144' : '#e2e8f0'}`,
                    transition: 'background-color 0.2s ease',
                    ':hover': {
                      backgroundColor: darkMode ? '#2d3033' : '#f8fafc'
                    }
                  }}
                >
                  <td style={{ 
                    padding: '16px 20px',
                    color: darkMode ? '#e4e6eb' : '#1a202c',
                    fontSize: '0.95rem'
                  }}>{account.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="package-badge" style={{
                      background: PACKAGE_COLORS[account.package] || '#eee',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      border: PACKAGE_BORDERS[account.package] || 'none',
                      display: 'inline-block',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {account.package}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '16px 20px',
                    color: darkMode ? '#e4e6eb' : '#1a202c',
                    fontSize: '0.95rem'
                  }}>{account.start || 'N/A'}</td>
                  <td style={{ 
                    padding: '16px 20px',
                    color: darkMode ? '#e4e6eb' : '#1a202c',
                    fontSize: '0.95rem'
                  }}>{account.eocDate || 'N/A'}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      background: '#ef5350',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(239, 83, 80, 0.2)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#fff',
                      }} />
                      EOC
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleReactivate(account)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)',
                        ':hover': {
                          background: '#43a047',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 6px rgba(76, 175, 80, 0.2)'
                        }
                      }}
                    >
                      Reactivate
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedAccounts.length === 0 && (
                <tr>
                  <td 
                    colSpan={6} 
                    style={{ 
                      padding: 32, 
                      textAlign: 'center', 
                      color: darkMode ? '#a0aec0' : '#718096',
                      fontSize: '0.95rem'
                    }}
                  >
                    No EOC accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Section */}
      <div style={{ 
        marginTop: 24, 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 16, 
        alignItems: 'center',
        padding: '16px 24px',
        background: darkMode ? '#242628' : '#ffffff',
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: page === 1 ? (darkMode ? '#3d4144' : '#e2e8f0') : '#1976d2',
            color: page === 1 ? (darkMode ? '#a0aec0' : '#718096') : '#fff',
            border: 'none',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: page === 1 ? 'none' : '0 2px 4px rgba(25, 118, 210, 0.2)',
            ':hover': page !== 1 && {
              background: '#1565c0',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(25, 118, 210, 0.2)'
            }
          }}
        >
          Previous
        </button>
        <span style={{
          color: darkMode ? '#e4e6eb' : '#4a5568',
          fontSize: '0.95rem',
          fontWeight: 500
        }}>
          Page {page} of {pageCount || 1}
        </span>
        <button
          onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          disabled={page === pageCount || pageCount === 0}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: page === pageCount ? (darkMode ? '#3d4144' : '#e2e8f0') : '#1976d2',
            color: page === pageCount ? (darkMode ? '#a0aec0' : '#718096') : '#fff',
            border: 'none',
            cursor: page === pageCount ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: page === pageCount ? 'none' : '0 2px 4px rgba(25, 118, 210, 0.2)',
            ':hover': page !== pageCount && {
              background: '#1565c0',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(25, 118, 210, 0.2)'
            }
          }}
        >
          Next
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={styles.modalOverlay} onClick={() => setConfirmModal(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Confirm Reactivation</div>
            <div style={styles.modalText}>
              Are you sure you want to reactivate <strong>{confirmModal.name}</strong>? This will move the company back to active accounts.
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.buttonCancel}
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.buttonConfirm}
                onClick={confirmReactivation}
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit EOC Date Modal */}
      {editModal && (
        <div style={styles.modalOverlay} onClick={() => setEditModal(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Edit EOC Date</div>
            <div style={styles.modalText}>
              Update EOC date for <strong>{editModal.name}</strong>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                placeholder="e.g., January 1, 2025"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  color: '#1a202c'
                }}
              />
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#718096', 
                marginTop: '8px' 
              }}>
                Format: Month Day, Year (e.g., January 1, 2025)
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.buttonCancel}
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.buttonConfirm}
                onClick={handleDateUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div style={styles.successToast}>
          ✅ {toastMessage || 'Operation completed successfully'}
        </div>
      )}

      {/* Add CSS for animation */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
} 