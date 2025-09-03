import React, { useState, useEffect } from 'react';
import { savePackages, saveHistoryLog, loadHistoryLog, clearHistoryLog } from './firestoreHelpers';
import { addBackgroundOperation } from './optimisticUI.js';
import { toast } from 'sonner';

const PACKAGE_KEY = 'company-package-pages';
const TRASH_KEY = 'company-trash';
const packageNames = ['SEO - BASIC', 'SEO - PREMIUM', 'SEO - PRO', 'SEO - ULTIMATE'];
const linksPerPackage = {
  'SEO - BASIC': '15 Links',
  'SEO - PREMIUM': '17 Links',
  'SEO - PRO': '20 Links',
  'SEO - ULTIMATE': '42 Links',
};

const packageColors = {
  'SEO - BASIC': '#4A3C31',
  'SEO - PREMIUM': '#00bcd4',
  'SEO - PRO': '#8E24AA',
  'SEO - ULTIMATE': '#1A237E',
};



export default function LinkBuildings({ packages, setPackages, darkMode, setDarkMode }) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const [status, setStatus] = useState({});
  // Remove confirmRemove state since we're removing X buttons
  const [search, setSearch] = useState({});
  const [statusFilter, setStatusFilter] = useState({});

  // Add per-package page state
  const [page, setPage] = useState({});
  const PAGE_SIZE = 10;

  // --- History Log State ---
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set());
  const [revertModal, setRevertModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);

  // History entry structure
  const createHistoryEntry = (companyId, companyName, packageName, field, oldValue, newValue, action = 'changed') => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    companyId,
    companyName,
    packageName,
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
      const field = 'linkBuildingStatus';
      const value = historyEntry.oldValue;
      // Update in packages
      const updatedPackages = { ...packages };
      updatedPackages[historyEntry.packageName] = (updatedPackages[historyEntry.packageName] || []).map(c =>
        c.id === historyEntry.companyId ? { ...c, [field]: value } : c
      );
      setPackages(updatedPackages);
      await savePackages(updatedPackages);
      // Add revert entry to history
      const revertEntry = createHistoryEntry(
        historyEntry.companyId,
        historyEntry.companyName,
        historyEntry.packageName,
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

  // Load history from Firestore on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('linkbuilding');
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  // Save history to Firestore on every change
  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('linkbuilding', history).catch(err => {
        // console.error('Error saving history:', err);
      });
    }
  }, [history]);

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('linkbuilding');
    setClearHistoryModal(false);
  };

  useEffect(() => {
    // Initialize status from company data if available
    const initialStatus = {};
    Object.values(packages).forEach(companies => {
      companies.forEach(c => {
        initialStatus[c.id] = c.linkBuildingStatus || 'Pending';
      });
    });
    setStatus(initialStatus);
  }, [packages]);

  // Handle status change for a company and persist in Firestore
  const handleStatusChange = async (pkg, companyId, value) => {
    const updatedPackages = { ...packages };
    updatedPackages[pkg] = (updatedPackages[pkg] || []).map(c => c.id === companyId ? { ...c, linkBuildingStatus: value } : c);
    
    // Apply optimistic updates immediately
    setPackages(updatedPackages);
    
    // Smart alert update - only if not throttled
    if (window.fetchAlerts && !window.isThrottled?.('ALERT_UPDATE')) {
      window.fetchAlerts();
    }
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        const { savePackagesOptimistic } = await import('./firestoreHelpers');
        await savePackagesOptimistic(updatedPackages);
      } catch (error) {
        console.error('Failed to save link building status change:', error);
        toast.error('Failed to save changes - will retry');
      }
    });
    
    // Add to history
    const company = (updatedPackages[pkg] || []).find(c => c.id === companyId);
    const oldValue = status[companyId] || 'Pending';
    const historyEntry = createHistoryEntry(
      companyId,
      company?.name || 'Unknown Company',
      pkg,
      'Link Building',
      oldValue,
      value
    );
    addToHistory(historyEntry);
  };

  // Dropdown style (reuse from Report page)
  const getDropdownStyle = value => ({
    borderRadius: 8,
    padding: '0.3em 1em',
    fontWeight: 600,
    fontSize: '1rem',
    background: value === 'Completed'
      ? 'linear-gradient(90deg, #eaffea 60%, #b6f5c3 100%)'
      : value === 'Pending'
      ? 'linear-gradient(90deg, #ffeaea 60%, #ffd6d6 100%)'
      : 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
    color: value === 'Completed' ? '#19744d' : value === 'Pending' ? '#c00' : '#232323',
    border: '1.5px solid #b6b6d8',
    outline: 'none',
    minWidth: 120,
    boxShadow: '0 1px 4px #ececec',
    transition: 'background 0.18s, color 0.18s',
  });

  const [selectedPackage, setSelectedPackage] = useState(packageNames[0]);

  return (
    <section className="company-tracker-page" style={{paddingTop: 12, marginTop: 0, background: darkMode ? '#181a1b' : '#f7f6f2'}}>
      {/* Header with History Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <h1 className="fancy-title">Link Building for {currentMonth}</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 16px',
            background: showHistory ? '#007bff' : '#f8f9fa',
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
      {/* Package Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {packageNames.map(pkg => (
          <button
            key={pkg}
            onClick={() => setSelectedPackage(pkg)}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: selectedPackage === pkg
                ? `2.5px solid ${packageColors[pkg]}`
                : `1.5px solid ${packageColors[pkg]}`,
              background: selectedPackage === pkg
                ? packageColors[pkg]
                : '#fff',
              color: selectedPackage === pkg ? '#fff' : packageColors[pkg],
              fontWeight: selectedPackage === pkg ? 700 : 500,
              fontSize: '1.08em',
              cursor: 'pointer',
              boxShadow: selectedPackage === pkg ? `0 2px 8px ${packageColors[pkg]}22` : '0 1px 4px #ececec',
              transition: 'all 0.18s',
              outline: 'none',
              minWidth: 120
            }}
          >
            {pkg.replace('SEO - ', '')}
          </button>
        ))}
      </div>
      <p className="hero-desc" style={{marginBottom: 10}}>All companies, grouped by SEO package for link building.</p>
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
          maxWidth: '1200px',
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
                      borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : 
                                 entry.packageName === 'SEO - BASIC' ? '4px solid #4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '4px solid #00897B' :
                                 entry.packageName === 'SEO - PRO' ? '4px solid #8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '4px solid #1A237E' : '4px solid #007bff',
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
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#495057',
                          fontWeight: '600'
                        }}>
                          {entry.companyName}
                        </span>
                        <span style={{ 
                          color: entry.packageName === 'SEO - BASIC' ? '#4A3C31' :
                                 entry.packageName === 'SEO - PREMIUM' ? '#00897B' :
                                 entry.packageName === 'SEO - PRO' ? '#8E24AA' :
                                 entry.packageName === 'SEO - ULTIMATE' ? '#1A237E' : '#6c757d',
                          fontWeight: '500', 
                          whiteSpace: 'nowrap',
                          opacity: 0.85
                        }}>
                          {entry.packageName}
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
      {/* Only render the selected package's table */}
      {(() => {
        const pkg = selectedPackage;
        const companies = (packages[pkg] || []).filter(c => c.status !== 'OnHold');
        const filteredCompanies = companies.filter(c => {
          const matchesSearch = !search[pkg] || c.name.toLowerCase().includes(search[pkg].toLowerCase());
          const matchesStatus = !statusFilter[pkg] || (status[c.id] || 'Pending') === statusFilter[pkg];
          return matchesSearch && matchesStatus;
        });
        // Pagination logic
        const currentPage = page[pkg] || 1;
        const pageCount = Math.ceil(filteredCompanies.length / PAGE_SIZE);
        const paginated = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        const pendingCount = filteredCompanies.filter(c => (status[c.id] || 'Pending') !== 'Completed').length;
        return (
          <div key={pkg} style={{ marginBottom: 32, width: '100%' }}>
            {/* Alert banner for pending link building */}
            {pendingCount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#ffeaea',
                color: '#c00',
                borderRadius: 999,
                padding: '0.5em 1.5em',
                fontWeight: 700,
                fontSize: '1.08em',
                border: '1.5px solid #ffd6d6',
                boxShadow: '0 1px 4px #ffeaea',
                marginBottom: 18,
                marginLeft: 2,
                letterSpacing: '0.03em',
              }}>
                <span style={{fontSize:'1.2em',marginRight:8}}>🔗</span>
                {pendingCount} compan{pendingCount === 1 ? 'y' : 'ies'} under the {pkg.replace('SEO - ', '').toUpperCase()} SEO package still need link building this month.
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 0}}>
              <div className="company-total-badge"><span className="total-icon" role="img" aria-label="Total">👥</span>Total: {filteredCompanies.length}</div>
              <h2 className="fancy-subtitle">{pkg}</h2>
              <input
                name={`companySearch_${pkg}`}
                type="text"
                className="package-search-input"
                style={{ minWidth: 180, marginLeft: 16, marginBottom: 0, fontSize: '1em' }}
                placeholder={`Search company...`}
                value={search[pkg] || ''}
                onChange={e => setSearch(s => ({ ...s, [pkg]: e.target.value }))}
              />
            </div>
            <div className="table-scroll-container table-responsive" style={{marginBottom: 0, height: 'auto', width: '100%'}}>
              <table className="company-table report-table" style={{marginBottom: 0, width: '100%', tableLayout: 'fixed'}}>
                <thead>
                  <tr>
                    <th className="company-col">Company Name</th>
                    <th className="package-col">SEO Package</th>
                    <th className="report-col">
                      <div style={{
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        gap:2,
                        background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                        border: '1.5px solid #b6b6d8',
                        borderRadius: 10,
                        padding: '0.3em 0.7em 0.5em 0.7em',
                        margin: '0 0 2px 0',
                        boxShadow: '0 2px 8px #ececec',
                        minWidth: 120
                      }}>
                        <span style={{fontWeight:700,letterSpacing:'0.01em',color:'#4e342e'}}>Link Building</span>
                        <select
                          value={statusFilter[pkg] || ''}
                          onChange={e => setStatusFilter(s => ({ ...s, [pkg]: e.target.value }))}
                          style={getDropdownStyle(statusFilter[pkg] || 'Pending')}
                        >
                          <option value="">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </th>
                    <th className="report-col" style={{minWidth:120}}>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>No companies in this package.</td></tr>
                  )}
                  {paginated.map(c => (
                    <tr key={c.id}>
                      <td className="company-name company-col">{c.name}</td>
                      <td className="package-col">
                        <span className={
                          c.package === 'SEO - BASIC' ? 'package-basic' :
                          c.package === 'SEO - PREMIUM' ? 'package-premium' :
                          c.package === 'SEO - PRO' ? 'package-pro' :
                          c.package === 'SEO - ULTIMATE' ? 'package-ultimate' : ''
                        }>
                          {c.package}
                        </span>
                      </td>
                      <td className="report-col">
                        <select
                          value={status[c.id] || 'Pending'}
                          onChange={e => handleStatusChange(pkg, c.id, e.target.value)}
                          style={getDropdownStyle(status[c.id] || 'Pending')}
                        >
                          <option value="Pending">🔴 Pending</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                      <td className="report-col" style={{textAlign:'center', fontWeight:500, fontSize:'1em'}}>
                        {c.start || '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredCompanies.length > PAGE_SIZE && filteredCompanies.slice(PAGE_SIZE).map((c, i) => (
                    <tr key={c.id} style={{display:'none'}}></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            {pageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 8 }}>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(pg => ({ ...pg, [pkg]: p }))}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      border: p === currentPage ? '2px solid #1976d2' : '1.5px solid #b6b6d8',
                      background: p === currentPage ? '#e3f2fd' : '#fff',
                      color: p === currentPage ? '#1976d2' : '#232323',
                      fontWeight: p === currentPage ? 700 : 500,
                      fontSize: '1em',
                      cursor: 'pointer',
                      boxShadow: p === currentPage ? '0 2px 8px #e3f2fd' : '0 1px 4px #ececec',
                      transition: 'all 0.18s',
                      outline: 'none',
                      minWidth: 40
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
} 