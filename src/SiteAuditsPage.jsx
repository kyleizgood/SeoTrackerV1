import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { updateCompanyAuditStatus, getPackages, savePackages, updatePackageCompanyStatus } from './firestoreHelpers';
import { getAdjustedEOC, getActiveDays } from './App.jsx';
import { addBackgroundOperation } from './optimisticUI.js';
import { toast } from 'sonner';

const AUDIT_STATUS_KEY = 'siteAuditStatus';
const PRE_EOC_STATUS_KEY = 'sitePreEOCStatus';

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

function parseDisplayDateToInput(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!match) return null;
  const [_, month, day, year] = match;
  const normalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return new Date(`${normalizedMonth} ${day}, ${year}`);
}

function getEOC(start) {
  if (!start) return '';
  const match = start.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!match) return '';
  const [_, month, day, year] = match;
  const normalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  const date = new Date(`${normalizedMonth} ${day}, ${year}`);
  if (isNaN(date)) return '';
  date.setFullYear(date.getFullYear() + 1);
  return `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
}

function daysBetween(date1, date2) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((date2 - date1) / ms);
}

function getPackageClass(pkg) {
  if (pkg === 'SEO - BASIC') return 'package-basic';
  if (pkg === 'SEO - PREMIUM') return 'package-premium';
  if (pkg === 'SEO - PRO') return 'package-pro';
  if (pkg === 'SEO - ULTIMATE') return 'package-ultimate';
  return '';
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function SiteAuditsPage({ packages, setPackages, darkMode, setDarkMode }) {
  const location = useLocation();
  const [auditStatus, setAuditStatus] = useState({}); // { [companyId]: 'Pending' | 'Completed' }
  const [preEOCStatus, setPreEOCStatus] = useState({}); // { [companyId]: 'Pending' | 'Completed' }
  const [history, setHistory] = useState([]); // Array of history entries
  const [showHistory, setShowHistory] = useState(false);
  const [recentChanges, setRecentChanges] = useState(new Set()); // Track recently changed companies
  const [confirmModal, setConfirmModal] = useState(null); // For confirmation modal
  const [revertModal, setRevertModal] = useState(null); // For revert confirmation modal

  useEffect(() => {
    const all = Object.values(packages).flat();
    // Build status maps from company fields
    const auditB = {};
    const auditC = {};
    all.forEach(c => {
      auditB[c.id] = c.siteAuditBStatus || 'Pending';
      auditC[c.id] = c.siteAuditCStatus || 'Pending';
    });
    setAuditStatus(auditB);
    setPreEOCStatus(auditC);
  }, [packages]);

  const today = new Date();
  const companies = Object.values(packages).flat();

  // Table 1: Half-year audit (183 active days, excluding OnHold periods)
  const table1 = companies.filter(c => {
    if (!c.start) return false;
    
    // Calculate active days (excluding OnHold periods)
    const activeDays = getActiveDays(c);
    
    // Site Audit B: 183 active days (6 months of active time)
    return activeDays >= 183 && (auditStatus[c.id] !== 'Completed');
  });

  // Helper to add onHold days to a date string
  function addOnHoldDays(dateStr, onholdDays) {
    const date = parseDisplayDateToInput(dateStr);
    if (!date) return null;
    return new Date(date.getTime() + (onholdDays * 24 * 60 * 60 * 1000));
  }

  // Table 2: Pre-EOC audit (EOC date within the past 30 days up to today)
  const table2 = companies.filter(c => {
    if (!c.start) return false;
    const today = new Date();
    // Default EOC (start + 1 year + onHoldDays)
    const defaultEOC = getEOC(c.start);
    const adjustedDefaultEOC = addOnHoldDays(defaultEOC, c.totalOnholdDays || 0);
    // Manual EOC
    const manualEOC = c.eocDate;
    // Collect EOC dates to check
    const eocDatesToCheck = [];
    if (adjustedDefaultEOC) eocDatesToCheck.push(adjustedDefaultEOC);
    if (manualEOC) {
      const manualDate = parseDisplayDateToInput(manualEOC);
      if (manualDate) eocDatesToCheck.push(manualDate);
    }
    // Check if any EOC date is within the window
    const inAuditCWindow = eocDatesToCheck.some(eocDate => {
      if (!eocDate) return false;
      const daysFromEOC = daysBetween(eocDate, today);
      return daysFromEOC >= 0 && daysFromEOC <= 30;
    });
    return inAuditCWindow && (preEOCStatus[c.id] !== 'Completed');
  });

  // Alert logic
  const showAuditBAlert = table1.length > 0;
  const showAuditCAlert = table2.length > 0;

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
    // Mark as recently changed
    setRecentChanges(prev => new Set([...prev, entry.companyId]));
    // Remove from recent changes after 5 seconds
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
    const field = historyEntry.field === 'Site Audit B' ? 'siteAuditBStatus' : 'siteAuditCStatus';
    const value = historyEntry.oldValue;
    
    // Optimistically update local state immediately
    const updatedPackages = { ...packages };
    let updated = false;
    Object.keys(updatedPackages).forEach(pkg => {
      updatedPackages[pkg] = updatedPackages[pkg].map(c => {
        if (c.id === historyEntry.companyId) {
          updated = true;
          return { ...c, [field]: value };
        }
        return c;
      });
    });
    
    if (updated) {
      setPackages(updatedPackages);
      
      // Update local status maps
      const all = Object.values(updatedPackages).flat();
      const auditB = {};
      const auditC = {};
      all.forEach(c => {
        auditB[c.id] = c.siteAuditBStatus || 'Pending';
        auditC[c.id] = c.siteAuditCStatus || 'Pending';
      });
      setAuditStatus(auditB);
      setPreEOCStatus(auditC);
    }
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        // Update in Firestore
        await updateCompanyAuditStatus(historyEntry.companyId, field, value);
        
        // Save packages to Firestore
        const { savePackagesOptimistic } = await import('./firestoreHelpers');
        await savePackagesOptimistic(updatedPackages);
        
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
      } catch (error) {
        console.error('Failed to revert change:', error);
        toast.error('Failed to revert change - will retry');
      }
    });
  };

  const handleAuditStatusChange = async (id, value) => {
    const oldValue = auditStatus[id] || 'Pending';
    const company = companies.find(c => c.id === id);
    
    if (value === 'Completed') {
      // Show confirmation modal for completing
      setConfirmModal({
        type: 'complete',
        company,
        field: 'Site Audit B',
        oldValue,
        newValue: value
      });
      return;
    }
    
    // For reverting to Pending, proceed directly
    await performStatusUpdate(id, 'siteAuditBStatus', value, company, oldValue, 'Site Audit B');
  };

  const handlePreEOCStatusChange = async (id, value) => {
    const oldValue = preEOCStatus[id] || 'Pending';
    const company = companies.find(c => c.id === id);
    
    if (value === 'Completed') {
      // Show confirmation modal for completing
      setConfirmModal({
        type: 'complete',
        company,
        field: 'Site Audit C',
        oldValue,
        newValue: value
      });
      return;
    }
    
    // For reverting to Pending, proceed directly
    await performStatusUpdate(id, 'siteAuditCStatus', value, company, oldValue, 'Site Audit C');
  };

  const performStatusUpdate = async (id, field, value, company, oldValue, fieldName) => {
    // Optimistically update local state immediately
    if (field === 'siteAuditBStatus') {
      setAuditStatus(prev => ({ ...prev, [id]: value }));
    } else {
      setPreEOCStatus(prev => ({ ...prev, [id]: value }));
    }
    
    // Also update packages state optimistically
    const updatedPackages = { ...packages };
    let updated = false;
    Object.keys(updatedPackages).forEach(pkg => {
      updatedPackages[pkg] = updatedPackages[pkg].map(c => {
        if (c.id === id) {
          updated = true;
          return { ...c, [field]: value };
        }
        return c;
      });
    });
    
    if (updated) {
      setPackages(updatedPackages);
    }
    
    // Smart alert update - only if not throttled
    if (window.fetchAlerts && !window.isThrottled?.('ALERT_UPDATE')) {
      window.fetchAlerts();
    }
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        // Update in Firestore (meta/packages structure)
        if (company && company.package) {
          await updatePackageCompanyStatus(id, company.package, field, value);
        }
        
        // Also update in meta/packages (UI state)
        const { savePackagesOptimistic } = await import('./firestoreHelpers');
        await savePackagesOptimistic(updatedPackages);
        
        // Update local status maps
        const all = Object.values(updatedPackages).flat();
        const auditB = {};
        const auditC = {};
        all.forEach(c => {
          auditB[c.id] = c.siteAuditBStatus || 'Pending';
          auditC[c.id] = c.siteAuditCStatus || 'Pending';
        });
        setAuditStatus(auditB);
        setPreEOCStatus(auditC);
        
        // Add to history
        const historyEntry = createHistoryEntry(
          id,
          company?.name || 'Unknown Company',
          company?.package || 'Unknown Package',
          fieldName,
          oldValue,
          value
        );
        addToHistory(historyEntry);
      } catch (error) {
        console.error('Failed to save audit status change:', error);
        toast.error('Failed to save changes - will retry');
        
        // Revert optimistic update on error
        if (field === 'siteAuditBStatus') {
          setAuditStatus(prev => ({ ...prev, [id]: oldValue }));
        } else {
          setPreEOCStatus(prev => ({ ...prev, [id]: oldValue }));
        }
      }
    });
  };

  const confirmStatusChange = async () => {
    const { company, field, newValue, oldValue } = confirmModal;
    const fieldKey = field === 'Site Audit B' ? 'siteAuditBStatus' : 'siteAuditCStatus';
    
    await performStatusUpdate(company.id, fieldKey, newValue, company, oldValue, field);
    setConfirmModal(null);
  };

  return (
    <section className="company-tracker-page" style={{ width: '100%', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2.5rem', paddingBottom: '3.5rem', marginTop: 0, background: darkMode ? '#181a1b' : '#f7f6f2' }}>
      {/* Alerts */}
      {showAuditBAlert && (
        <div style={{
          background: '#fffbe6',
          color: '#b26a00',
          borderRadius: 12,
          padding: '1em 2em',
          fontWeight: 700,
          fontSize: '1.08em',
          border: '1.5px solid #ffe082',
          boxShadow: '0 1px 4px #fffbe6',
          marginBottom: 18,
          marginLeft: 2,
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{fontSize:'1.2em',marginRight:8}}>⚠️</span>
          {table1.length} package{table1.length > 1 ? 's' : ''} need Site Audit B.
        </div>
      )}
      {showAuditCAlert && (
        <div style={{
          background: '#e3f2fd',
          color: '#1976d2',
          borderRadius: 12,
          padding: '1em 2em',
          fontWeight: 700,
          fontSize: '1.08em',
          border: '1.5px solid #90caf9',
          boxShadow: '0 1px 4px #e3f2fd',
          marginBottom: 18,
          marginLeft: 2,
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{fontSize:'1.2em',marginRight:8}}>🔔</span>
          {table2.length} package{table2.length > 1 ? 's' : ''} need Site Audit C.
        </div>
      )}
      
      {/* Header with History Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
      <h1 className="fancy-title" style={{ textAlign: 'center', marginBottom: 10, marginTop: 0 }}>Site Audits</h1>
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
      
      <p className="hero-desc" style={{ textAlign: 'center', marginBottom: 18, marginTop: 0 }}>Companies are automatically sorted into the tables below based on their package start and EOC dates.</p>
      
      {/* History Panel */}
      {showHistory && (
        <div style={{
          width: '100%',
          maxWidth: 1600,
          background: '#ffffff',
          borderRadius: 12,
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '1.1rem' }}>📋 Change History</h3>
          {history.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', fontStyle: 'italic' }}>No changes recorded yet.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    background: entry.action === 'reverted' ? '#fff3cd' : '#ffffff',
                    borderLeft: entry.action === 'reverted' ? '4px solid #ffc107' : '4px solid #007bff'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#495057', marginBottom: '4px' }}>
                      {entry.companyName} - {entry.packageName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                      {entry.field}: <span style={{ color: '#dc3545' }}>{entry.oldValue}</span> → <span style={{ color: '#28a745' }}>{entry.newValue}</span>
                      {entry.action === 'reverted' && <span style={{ color: '#ffc107', marginLeft: '8px' }}>🔄 Reverted</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#adb5bd', marginTop: '4px' }}>
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
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#e9ecef';
                        e.target.style.color = '#495057';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#f8f9fa';
                        e.target.style.color = '#6c757d';
                      }}
                    >
                      ↩️ Revert
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div
        className="site-audits-table-row"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '2vw',
          width: '100%',
          maxWidth: 1600,
          margin: '0 auto',
          padding: '0.5vw 0 2vw 0',
          boxSizing: 'border-box',
          background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
          borderRadius: 24,
          boxShadow: '0 2px 24px #ececec',
        }}
      >
        {/* Table 1 */}
        <div
          style={{
            flex: '0 1 48%',
            width: '48%',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 16px #ececec',
            padding: '2em 1.5em',
            margin: 0,
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.3em', marginBottom: 18, letterSpacing: '0.04em', color: '#b26a00' }}>Site Audit B</h2>
          <div className="responsive-table-wrapper">
            <table className="company-table report-table" style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', background: 'rgba(255,255,255,0.98)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px #ececec' }}>
              <thead>
                <tr style={{ background: '#f7f6f2' }}>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Company Name</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Package</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Start Date</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Days Since Start</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {table1.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies for half-year audit today.</td></tr>
                ) : table1.map(c => {
                  const startDate = parseDisplayDateToInput(c.start);
                  const daysSinceStart = startDate ? daysBetween(startDate, today) : 0;
                  const isRecentlyChanged = recentChanges.has(c.id);
                  
                  return (
                    <tr key={c.id} style={{ 
                      transition: 'background 0.18s',
                      background: isRecentlyChanged ? '#fff3cd' : 'transparent',
                      borderLeft: isRecentlyChanged ? '4px solid #ffc107' : 'none'
                    }}>
                      <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 700, background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #b26a00', letterSpacing: '0.02em', borderRadius: 8 }}>
                        {c.name}
                        {isRecentlyChanged && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#ffc107' }}>🔄</span>}
                      </td>
                      <td style={{ padding: '0.7em', textAlign: 'center' }}>
                        <span className={getPackageClass(c.package)}>{c.package}</span>
                      </td>
                      <td style={{ padding: '0.7em', textAlign: 'center' }}>{c.start}</td>
                      <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 600, color: '#b26a00' }}>{daysSinceStart}</td>
                      <td style={{ padding: '0.7em', textAlign: 'center' }}>
                        <select value={auditStatus[c.id] || 'Pending'} onChange={e => handleAuditStatusChange(c.id, e.target.value)} style={{ padding: '0.3em 1em', borderRadius: 8, fontWeight: 600, background: auditStatus[c.id] === 'Completed' ? '#eaffea' : '#ffeaea', color: auditStatus[c.id] === 'Completed' ? '#19744d' : '#c00', border: '1.5px solid #b6b6d8', minWidth: 120, boxShadow: '0 1px 4px #ececec', transition: 'background 0.18s, color 0.18s' }}>
                          <option value="Pending">🔴 Pending</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Table 2 */}
        <div
          style={{
            flex: '0 1 48%',
            width: '48%',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 16px #ececec',
            padding: '2em 1.5em',
            margin: 0,
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.3em', marginBottom: 18, letterSpacing: '0.04em', color: '#1976d2' }}>Site Audit C</h2>
          <div className="responsive-table-wrapper">
            <table className="company-table report-table" style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', background: 'rgba(255,255,255,0.98)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px #ececec' }}>
              <thead>
                <tr style={{ background: '#f7f6f2' }}>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Company Name</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Package</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Start Date</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Days Since Start</th>
                  <th style={{ padding: '0.7em', borderRadius: 8, fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {table2.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>No companies for pre-EOC audit today.</td></tr>
                ) : table2.map(c => {
                  const startDate = parseDisplayDateToInput(c.start);
                  const daysSinceStart = startDate ? daysBetween(startDate, today) : 0;
                  const isRecentlyChanged = recentChanges.has(c.id);
                  
                  return (
                    <tr key={c.id} style={{ 
                      transition: 'background 0.18s',
                      background: isRecentlyChanged ? '#fff3cd' : 'transparent',
                      borderLeft: isRecentlyChanged ? '4px solid #ffc107' : 'none'
                    }}>
                      <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 700, background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)', borderLeft: '4px solid #1976d2', letterSpacing: '0.02em', borderRadius: 8 }}>
                        {c.name}
                        {isRecentlyChanged && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#ffc107' }}>🔄</span>}
                      </td>
                      <td style={{ padding: '0.7em', textAlign: 'center' }}>
                        <span className={getPackageClass(c.package)}>{c.package}</span>
                      </td>
                      <td style={{ padding: '0.7em', textAlign: 'center' }}>{c.start}</td>
                      <td style={{ padding: '0.7em', textAlign: 'center', fontWeight: 600, color: '#1976d2' }}>{daysSinceStart}</td>
                      <td style={{ padding: '0.7em', textAlign: 'center' }}>
                        <select value={preEOCStatus[c.id] || 'Pending'} onChange={e => handlePreEOCStatusChange(c.id, e.target.value)} style={{ padding: '0.3em 1em', borderRadius: 8, fontWeight: 600, background: preEOCStatus[c.id] === 'Completed' ? '#eaffea' : '#ffeaea', color: preEOCStatus[c.id] === 'Completed' ? '#19744d' : '#c00', border: '1.5px solid #b6b6d8', minWidth: 120, boxShadow: '0 1px 4px #ececec', transition: 'background 0.18s, color 0.18s' }}>
                          <option value="Pending">🔴 Pending</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Confirm Action</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to mark "{confirmModal.company?.name} - {confirmModal.company?.package}" as "{confirmModal.newValue}"?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={() => {
                  confirmStatusChange();
                  setConfirmModal(null);
                }}
                style={{
                  padding: '10px 25px',
                  background: '#28a745',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Mark as {confirmModal.newValue}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {revertModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '30px',
            width: '90%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Confirm Revert</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to revert "{revertModal.companyName} - {revertModal.packageName}" {revertModal.field} from "{revertModal.newValue}" back to "{revertModal.oldValue}"?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={confirmRevert}
                style={{
                  padding: '10px 25px',
                  background: '#ffc107',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Yes, Revert
              </button>
              <button
                onClick={() => setRevertModal(null)}
                style={{
                  padding: '10px 25px',
                  background: '#dc3545',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SiteAuditsPage; 