import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { updateCompanyAuditStatus, getPackages, savePackages, updatePackageCompanyStatus } from './firestoreHelpers';
import { getAdjustedEOC, getActiveDays } from './App.jsx';
import { addBackgroundOperation } from './optimisticUI.js';
import { toast } from 'sonner';
import './SiteAuditsPage.css'; // New import for modern styles

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
    <div className={`site-audits-modern${darkMode ? ' dark' : ''}`}>
      {/* Header */}
      <div className="site-audits-header">
        <h1 className="site-audits-title">Site Audits</h1>
        <p className="site-audits-subtitle">
          Companies are automatically sorted into the tables below based on their package start and EOC dates.
        </p>
      </div>

      {/* Header Actions */}
      <div className="site-audits-header-actions">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`site-audits-history-button${showHistory ? ' active' : ''}`}
        >
          📋 {showHistory ? 'Hide History' : 'Show History'} ({history.length})
        </button>
      </div>

      {/* Alerts */}
      <div className="site-audits-alerts">
        {showAuditBAlert && (
          <div className="site-audits-alert warning">
            <span>⚠️</span>
            {table1.length} package{table1.length > 1 ? 's' : ''} need Site Audit B.
          </div>
        )}
        {showAuditCAlert && (
          <div className="site-audits-alert info">
            <span>🔔</span>
            {table2.length} package{table2.length > 1 ? 's' : ''} need Site Audit C.
          </div>
        )}
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="site-audits-history-panel">
          <h3 className="site-audits-history-title">📋 Change History</h3>
          {history.length === 0 ? (
            <p className="site-audits-history-empty">No changes recorded yet.</p>
          ) : (
            <div className="site-audits-history-content">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`site-audits-history-entry${entry.action === 'reverted' ? ' reverted' : ''}`}
                >
                  <div className="site-audits-history-info">
                    <div className="site-audits-history-header">
                      {entry.companyName} - {entry.packageName}
                    </div>
                    <div className="site-audits-history-changes">
                      {entry.field}: <span className="site-audits-history-old-value">{entry.oldValue}</span> → <span className="site-audits-history-new-value">{entry.newValue}</span>
                      {entry.action === 'reverted' && <span className="site-audits-history-reverted">🔄 Reverted</span>}
                    </div>
                    <div className="site-audits-history-timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                  {entry.action !== 'reverted' && (
                    <button
                      onClick={() => revertChange(entry)}
                      className="site-audits-history-revert-button"
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

      {/* Tables Container */}
      <div className="site-audits-tables-container">
        {/* Table 1 - Site Audit B */}
        <div className="site-audits-table-container">
          <h2 className="site-audits-table-title audit-b">Site Audit B</h2>
          <table className="site-audits-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Package</th>
                <th>Start Date</th>
                <th>Days Since Start</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {table1.length === 0 ? (
                <tr>
                  <td colSpan={5} className="site-audits-empty-message">
                    No companies for half-year audit today.
                  </td>
                </tr>
              ) : table1.map(c => {
                const startDate = parseDisplayDateToInput(c.start);
                const daysSinceStart = startDate ? daysBetween(startDate, today) : 0;
                const isRecentlyChanged = recentChanges.has(c.id);
                
                return (
                  <tr key={c.id} className={isRecentlyChanged ? 'recently-changed' : ''}>
                    <td className="site-audits-company-cell">
                      {c.name}
                      {isRecentlyChanged && <span>🔄</span>}
                    </td>
                    <td className="site-audits-package-cell">
                      <span className={getPackageClass(c.package)}>{c.package}</span>
                    </td>
                    <td className="site-audits-date-cell">{c.start}</td>
                    <td className="site-audits-days-cell audit-b">{daysSinceStart}</td>
                    <td className="site-audits-status-cell">
                      <select 
                        value={auditStatus[c.id] || 'Pending'} 
                        onChange={e => handleAuditStatusChange(c.id, e.target.value)}
                        className={`site-audits-status-select${auditStatus[c.id] === 'Completed' ? ' completed' : ''}`}
                      >
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

        {/* Table 2 - Site Audit C */}
        <div className="site-audits-table-container">
          <h2 className="site-audits-table-title audit-c">Site Audit C</h2>
          <table className="site-audits-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Package</th>
                <th>Start Date</th>
                <th>Days Since Start</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {table2.length === 0 ? (
                <tr>
                  <td colSpan={5} className="site-audits-empty-message">
                    No companies for pre-EOC audit today.
                  </td>
                </tr>
              ) : table2.map(c => {
                const startDate = parseDisplayDateToInput(c.start);
                const daysSinceStart = startDate ? daysBetween(startDate, today) : 0;
                const isRecentlyChanged = recentChanges.has(c.id);
                
                return (
                  <tr key={c.id} className={isRecentlyChanged ? 'recently-changed' : ''}>
                    <td className="site-audits-company-cell audit-c">
                      {c.name}
                      {isRecentlyChanged && <span>🔄</span>}
                    </td>
                    <td className="site-audits-package-cell">
                      <span className={getPackageClass(c.package)}>{c.package}</span>
                    </td>
                    <td className="site-audits-date-cell">{c.start}</td>
                    <td className="site-audits-days-cell audit-c">{daysSinceStart}</td>
                    <td className="site-audits-status-cell">
                      <select 
                        value={preEOCStatus[c.id] || 'Pending'} 
                        onChange={e => handlePreEOCStatusChange(c.id, e.target.value)}
                        className={`site-audits-status-select${preEOCStatus[c.id] === 'Completed' ? ' completed' : ''}`}
                      >
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="site-audits-modal-overlay">
          <div className="site-audits-modal">
            <div className="site-audits-modal-title">Confirm Action</div>
            <div className="site-audits-modal-desc">
              Are you sure you want to mark "{confirmModal.company?.name} - {confirmModal.company?.package}" as "{confirmModal.newValue}"?
              This action cannot be undone.
            </div>
            <div className="site-audits-modal-buttons">
              <button
                onClick={confirmStatusChange}
                className="site-audits-modal-btn confirm"
              >
                Yes, Mark as {confirmModal.newValue}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="site-audits-modal-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {revertModal && (
        <div className="site-audits-modal-overlay">
          <div className="site-audits-modal">
            <div className="site-audits-modal-title">Confirm Revert</div>
            <div className="site-audits-modal-desc">
              Are you sure you want to revert "{revertModal.companyName} - {revertModal.packageName}" {revertModal.field} from "{revertModal.newValue}" back to "{revertModal.oldValue}"?
              This action cannot be undone.
            </div>
            <div className="site-audits-modal-buttons">
              <button
                onClick={confirmRevert}
                className="site-audits-modal-btn revert"
              >
                Yes, Revert
              </button>
              <button
                onClick={() => setRevertModal(null)}
                className="site-audits-modal-btn cancel"
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

export default SiteAuditsPage; 