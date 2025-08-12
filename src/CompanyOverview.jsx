import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  getPackages,
  updatePackageCompanyStatus,
  markAsEOC,
  updateEOCDate,
  saveHistoryLog,
  loadHistoryLog,
  clearHistoryLog
} from './firestoreHelpers';
import * as XLSX from 'xlsx';
import { getEOC, getAdjustedEOC, getActiveDays } from './App.jsx';
import { toast } from 'sonner';
import { auth } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { addBackgroundOperation } from './optimisticUI.js';

const PACKAGE_COLORS = {
  'SEO - BASIC': '#4E342E',
  'SEO - PREMIUM': '#0097A7',
  'SEO - PRO': '#7B1FA2',
  'SEO - ULTIMATE': '#283593',
};

const PACKAGE_BORDERS = {
  'SEO - ULTIMATE': '2.5px solid #FFD600',
};

const TASK_GROUPS = [
  { key: 'report', label: 'Report', fields: [
    { key: 'reportI', label: 'I' },
    { key: 'reportII', label: 'II' },
  ] },
  { key: 'linkBuilding', label: 'Link Building', fields: [
    { key: 'linkBuildingStatus', label: '' },
  ] },
  { key: 'siteAudit', label: 'Site Audit', fields: [
    { key: 'siteAuditBStatus', label: 'B' },
    { key: 'siteAuditCStatus', label: 'C' },
  ] },
  { key: 'bookmarking', label: 'Bookmarking', fields: [
    { key: 'bmCreation', label: 'Creation' },
    { key: 'bmSubmission', label: 'Submission' },
  ] },
];

const STATUS_DISPLAY = {
  completed: { icon: '✅', color: '#43a047', label: 'Completed' },
  pending: { icon: '⏳', color: '#ffa726', label: 'Pending' },
  not_started: { icon: '❌', color: '#e53935', label: 'Not Started' },
  undefined: { icon: '❓', color: '#bdbdbd', label: 'Not set' },
};

const PACKAGE_LIST = [
  'SEO - BASIC',
  'SEO - PREMIUM',
  'SEO - PRO',
  'SEO - ULTIMATE',
];

function getStatusDisplay(status) {
  if (!status) return STATUS_DISPLAY.undefined;
  const normalized = typeof status === 'string' ? status.toLowerCase() : status;
  return STATUS_DISPLAY[normalized] || { icon: status, color: '#bdbdbd', label: status };
}

// Helper: Export to CSV
function exportToCSV(rows) {
  if (!rows.length) return;
  const headers = [
    'Company Name',
    'Package',
    'Report I',
    'Report II',
    'Link Building',
    'Site Audit B',
    'Site Audit C',
    'Bookmarking Creation',
    'Bookmarking Submission',
  ];
  const csvRows = [headers.join(',')];
  rows.forEach(row => {
    const lb = row.linkBuildingStatus ? row.linkBuildingStatus.toLowerCase() : '';
    csvRows.push([
      '"' + (row.name || '') + '"',
      '"' + (row.package || '') + '"',
      row.reportI || '',
      row.reportII || '',
      lb,
      row.siteAuditBStatus || '',
      row.siteAuditCStatus || '',
      row.bmCreation || '',
      row.bmSubmission || '',
    ].join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'company-overview.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Helper: Export to Excel
function exportToExcel(rows) {
  if (!rows.length) return;
  const wsData = [
    [
      'Company Name',
      'Package',
      'Report I',
      'Report II',
      'Link Building',
      'Site Audit B',
      'Site Audit C',
      'Bookmarking Creation',
      'Bookmarking Submission',
    ],
    ...rows.map(row => [
      row.name || '',
      row.package || '',
      row.reportI || '',
      row.reportII || '',
      row.linkBuildingStatus ? row.linkBuildingStatus.toLowerCase() : '',
      row.siteAuditBStatus || '',
      row.siteAuditCStatus || '',
      row.bmCreation || '',
      row.bmSubmission || '',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Company Overview');
  XLSX.writeFile(wb, 'company-overview.xlsx');
}

// Add styles object at the top of the component, before the function definition
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
    background: '#ef5350',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.95em',
    fontWeight: '500',
  },

  statusSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1.5px solid #e0e0e0',
    background: '#f8fafc',
    fontSize: '0.95em',
    minWidth: '120px',
    cursor: 'pointer',
    outline: 'none',
    marginLeft: '8px'
  },
  statusPill: (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '16px',
    fontWeight: '600',
    fontSize: '0.95em',
    background: status === 'Active' ? '#e8f5e9' : 
               status === 'OnHold' ? '#f3e5f5' : 
               status === 'EOC' ? '#ffebee' : '#f5f5f5',
    color: status === 'Active' ? '#2e7d32' : 
           status === 'OnHold' ? '#7b1fa2' : 
           status === 'EOC' ? '#c62828' : '#757575',
    border: `1.5px solid ${
      status === 'Active' ? '#66bb6a' : 
      status === 'OnHold' ? '#ba68c8' : 
      status === 'EOC' ? '#ef5350' : '#bdbdbd'
    }`,
  }),
  statusDot: (status) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: status === 'Active' ? '#43a047' : 
                status === 'OnHold' ? '#8e24aa' : 
                status === 'EOC' ? '#d32f2f' : '#bdbdbd',
  })
};

// Add this function to calculate EOC dates from packages data
const getEOCDatesFromPackages = async () => {
  try {
    const pkgs = await getPackages();
    const eocDates = {};
    
    Object.entries(pkgs).forEach(([pkg, companies]) => {
      companies.forEach(company => {
        // Calculate EOC date for each company based on start date
        if (company.start) {
          const startParts = company.start.match(/(\w+)\s+(\d+),\s+(\d+)/);
          if (startParts) {
            const [_, month, day, year] = startParts;
            const startDate = new Date(`${month} ${day}, ${year}`);
            const eocDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
            const months = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            eocDates[company.id] = `${months[eocDate.getMonth()]} ${eocDate.getDate()}, ${eocDate.getFullYear()}`;
          }
        }
      });
    });
    
    return eocDates;
  } catch (error) {
    console.error('Error fetching EOC dates:', error);
    return {};
  }
};

export default function CompanyOverview({ darkMode, setDarkMode }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);
  const [packageFilter, setPackageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');  // Add new state for status filter
  const PAGE_SIZE = 10;
  const GRID_COLUMNS = 2;
  const [confirmEOCModal, setConfirmEOCModal] = useState(null);

  // Add new state variables at the top of the component
  const [editingEOCDate, setEditingEOCDate] = useState(false);
  const [newEOCDate, setNewEOCDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);



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
      const field = historyEntry.field;
      const value = historyEntry.oldValue;
      
      // Update in packages
      await updatePackageCompanyStatus(historyEntry.companyId, historyEntry.packageName, field, value);
      
      // Reload rows to reflect the change
      await reloadRows();
      
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
      console.error('Error reverting change:', err);
      alert('Failed to revert change. Please try again.');
    }
  };

  const handleClearHistory = async () => {
    setHistory([]);
    await clearHistoryLog('companyoverview');
    setClearHistoryModal(false);
  };

  // Load history from Firestore on mount
  useEffect(() => {
    (async () => {
      const loaded = await loadHistoryLog('companyoverview');
      const historyArray = loaded?.log || loaded || [];
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    })();
  }, []);

  // Save history to Firestore on every change
  useEffect(() => {
    if (history && history.length > 0) {
      saveHistoryLog('companyoverview', history).catch(err => {
        console.error('Error saving history:', err);
      });
    }
  }, [history]);

  // Add function to format date to your required format
  const formatDate = (date) => {
    if (!date) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Add function to parse date string
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // 1. Update EOC date display logic everywhere to always use the stored eocDate if present
  // In the table row rendering:
  // In the details modal:
  // 2. In useEffect, when loading rows, never overwrite eocDate if it exists
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pkgs = await getPackages();
        const allRows = [];
        Object.entries(pkgs).forEach(([pkg, companies]) => {
          companies.forEach(company => {
            allRows.push({
              ...company,
              package: pkg,
              eocDate: company.eocDate ? company.eocDate : (company.start ? getAdjustedEOC(company) : 'N/A')
            });
          });
        });
        // Sort companies by name for consistent order (change this to sort by another field if needed)
        allRows.sort((a, b) => a.name.localeCompare(b.name));
        setRows(allRows);
        console.log('[CompanyOverview] Loaded rows:', allRows);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    // Initial data load
    fetchData();
    
    // Set up real-time listener for packages changes
    if (auth.currentUser) {
      const packagesDocRef = collection(db, 'users', auth.currentUser.uid, 'meta');
      let lastUpdate = 0;
      const THROTTLE_DELAY = 10000; // 10 seconds throttle to reduce Firestore operations
      
      const unsubscribe = onSnapshot(packagesDocRef, (snapshot) => {
        const now = Date.now();
        if (now - lastUpdate > THROTTLE_DELAY) {
          const pkgDoc = snapshot.docs.find(d => d.id === 'packages');
          if (pkgDoc) {
            const data = pkgDoc.data();
            if (data && data.packages) {
              // Refresh data when packages change
              fetchData();
              lastUpdate = now;
              console.log('Packages updated from Firestore (throttled)');
            }
          }
        }
      }, (error) => {
        console.error('CompanyOverview packages listener error:', error);
        // Don't break the app on permission errors during logout
        if (error.code === 'permission-denied' && !auth.currentUser) {
          console.log('CompanyOverview packages listener permission error during logout - ignoring');
          return;
        }
      });
      
      return () => unsubscribe();
    }
  }, []);

  // Updated filtering logic
  const filteredRows = rows.filter(row => {
    // Status filter (Active/OnHold)
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    
    // Package filter
    if (packageFilter !== 'all' && row.package !== packageFilter) return false;
    
    // Task status filter
    if (filter !== 'all') {
      const matches = TASK_GROUPS.some(group =>
        group.fields.some(field => {
          const val = row[field.key];
          if (!val) return false;
          return val.toLowerCase() === filter;
        })
      );
      if (!matches) return false;
    }
    
    // Search filter
    if (row.name && !row.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginatedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Add EOC to the status options in the status filter dropdown
  const statusOptions = (
    <select 
      value={statusFilter} 
      onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: '1.5px solid #e0e0e0',
        background: '#fff',
        minWidth: 120
      }}
    >
      <option value="all">All Status</option>
      <option value="Active">🟢 Active</option>
      <option value="OnHold">🟣 OnHold</option>
      <option value="EOC">🔴 EOC</option>
    </select>
  );

  // Update the handleStatusChange function
  const handleStatusChange = async (row, fieldKey, value) => {
    if (!row) return;

    if (fieldKey === 'status' && value === 'EOC') {
      setConfirmEOCModal(row);
      return;
    }

    try {
      await updateStatus(row, fieldKey, value);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Update handleEOCDateUpdate to use optimistic updates
  const handleEOCDateUpdate = async (row) => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }
    
    const formattedDate = formatDate(selectedDate);
    const oldValue = row.eocDate || 'N/A';
    
    // Optimistically update UI immediately
    setRows(prevRows => {
      const updatedRows = prevRows.map(r => 
        r.id === row.id ? { ...r, eocDate: formattedDate } : r
      );
      return updatedRows;
    });
    
    // Update selectedRow if it matches the edited row
    setSelectedRow(prev => prev && prev.id === row.id ? { ...prev, eocDate: formattedDate } : prev);
    
    // Add to history
    const historyEntry = createHistoryEntry(
      row.id,
      row.name,
      row.package,
      'EOC Date',
      oldValue,
      formattedDate
    );
    addToHistory(historyEntry);
    
    setEditingEOCDate(false);
    setSelectedDate(null);
    toast.success('EOC date updated successfully');
    
    // Background operation - save to Firestore
    addBackgroundOperation(async () => {
      try {
        await updateEOCDate(row.id, row.package, formattedDate);
      } catch (error) {
        console.error('Error updating EOC date:', error);
        toast.error('Failed to save EOC date - will retry');
      }
    });
  };

  const isFinalEOC = (row) => {
    // Example logic: Only allow EOC if not on hold and has no extension
    // You can adjust this logic as needed
    return row.status !== 'OnHold' && (!row.extension || row.extension === 0);
  };

  // Update updateStatus for EOC status change with optimistic updates
  const updateStatus = async (row, fieldKey, value) => {
    const oldValue = row[fieldKey] || 'N/A';
    
    if (fieldKey === 'status' && value === 'EOC') {
      // Only allow marking as EOC if the account is final
      if (!isFinalEOC(row)) {
        alert('Cannot mark as EOC: Account is not final (may be on hold or has extension).');
        return;
      }
      // Use the current eocDate as the final date
      const finalEOCDate = row.eocDate;
      if (!finalEOCDate) {
        alert('Cannot mark as EOC: EOC date must be set and final.');
        return;
      }
      
      // Optimistically update UI immediately
      setRows(prevRows => {
        const newRows = prevRows.map(r =>
          r.id === row.id ? {
            ...r,
            status: 'EOC',
            eocDate: finalEOCDate
          } : r
        );
        return newRows;
      });
      
      // Update selectedRow if it matches
      setSelectedRow(prev => prev && prev.id === row.id ? 
        { ...prev, status: 'EOC', eocDate: finalEOCDate } : prev);
      
      // Add to history
      const historyEntry = createHistoryEntry(
        row.id,
        row.name,
        row.package,
        'Status',
        oldValue,
        value
      );
      addToHistory(historyEntry);
      
      // Update alerts immediately
      if (window.fetchAlerts && !window.isThrottled?.('ALERT_UPDATE')) {
        window.fetchAlerts();
      }
      
      // Background operation - save to Firestore
      addBackgroundOperation(async () => {
        try {
          const updatedCompany = await markAsEOC(row.id, row.package, finalEOCDate);
          await updatePackageCompanyStatus(row.id, row.package, fieldKey, value);
          toast.success('Company moved to EOC accounts');
        } catch (error) {
          console.error('Error updating EOC status:', error);
          toast.error('Failed to save EOC status - will retry');
        }
      });
    } else {
      // For non-EOC status changes - Optimistic UI update
      setRows(prevRows => {
        const newRows = prevRows.map(r =>
          r.id === row.id ? { ...r, [fieldKey]: value } : r
        );
        return newRows;
      });
      
      // Update selectedRow if it matches
      setSelectedRow(prev => prev && prev.id === row.id && prev.package === row.package ? 
        { ...prev, [fieldKey]: value } : prev);
      
      // Add to history for all status changes
      const historyEntry = createHistoryEntry(
        row.id,
        row.name,
        row.package,
        fieldKey === 'status' ? 'Status' :
        fieldKey === 'reportI' ? 'Report I' : 
        fieldKey === 'reportII' ? 'Report II' : 
        fieldKey === 'linkBuildingStatus' ? 'Link Building' :
        fieldKey === 'siteAuditBStatus' ? 'Site Audit B' :
        fieldKey === 'siteAuditCStatus' ? 'Site Audit C' :
        fieldKey === 'bmCreation' ? 'Bookmarking Creation' :
        fieldKey === 'bmSubmission' ? 'Bookmarking Submission' : fieldKey,
        oldValue,
        value
      );
      addToHistory(historyEntry);
      
      // Update alerts immediately
      if (window.fetchAlerts && !window.isThrottled?.('ALERT_UPDATE')) {
        window.fetchAlerts();
      }
      
      // Background operation - save to Firestore
      addBackgroundOperation(async () => {
        try {
          await updatePackageCompanyStatus(row.id, row.package, fieldKey, value);
        } catch (error) {
          console.error('Error updating status:', error);
          toast.error('Failed to save status change - will retry');
        }
      });
    }
  };

  // Update the status cell in the table to include EOC styling
  const renderStatusCell = (status) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '16px',
      fontWeight: '600',
      fontSize: '0.95em',
      background: status === 'Active' ? '#e8f5e9' : 
                 status === 'OnHold' ? '#f3e5f5' : 
                 status === 'EOC' ? '#ffebee' : '#f5f5f5',
      color: status === 'Active' ? '#2e7d32' : 
             status === 'OnHold' ? '#7b1fa2' : 
             status === 'EOC' ? '#c62828' : '#757575',
      border: `1.5px solid ${
        status === 'Active' ? '#66bb6a' : 
        status === 'OnHold' ? '#ba68c8' : 
        status === 'EOC' ? '#ef5350' : '#bdbdbd'
      }`,
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: status === 'Active' ? '#43a047' : 
                   status === 'OnHold' ? '#8e24aa' : 
                   status === 'EOC' ? '#d32f2f' : '#bdbdbd',
      }} />
      {status || 'Not Set'}
    </span>
  );

  // Update the status select rendering in the modal
  const statusSelect = (
    <select
      value={selectedRow?.status || ''}
      onChange={e => handleStatusChange(selectedRow, 'status', e.target.value)}
      style={styles.statusSelect}
    >
      <option value="Active" style={{ background: '#e8f5e9', color: '#2e7d32' }}>🟢 Active</option>
      <option value="OnHold" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>🟣 OnHold</option>
      <option value="EOC" style={{ background: '#ffebee', color: '#c62828' }}>🔴 EOC</option>
    </select>
  );

  // Update the status display to use the styles object
  const renderStatusPill = (status) => (
    <span style={styles.statusPill(status)}>
      <span style={styles.statusDot(status)} />
      {status || 'Not Set'}
    </span>
  );

  const reloadRows = async () => {
    const pkgs = await getPackages();
    const allRows = [];
    Object.entries(pkgs).forEach(([pkg, companies]) => {
      companies.forEach(company => {
        allRows.push({
          ...company,
          package: pkg,
          eocDate: company.eocDate || (company.start ? getEOC(company.start) : 'N/A')
        });
      });
    });
    // Always sort by name for consistency
    allRows.sort((a, b) => a.name.localeCompare(b.name));
    setRows(allRows);
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      height: '100vh',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        height: 'calc(100vh - 4rem)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Top Section - Header and Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
          flexShrink: 0
        }}>
          <div>
            <h1 style={{
              fontSize: '2.2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
              letterSpacing: '0.02em'
            }}>
              Company Task Overview
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#6c757d',
              fontWeight: '500',
              margin: '0'
            }}>
              Comprehensive view of all company tasks and progress
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => exportToCSV(filteredRows)} 
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: '#fff', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📊 Export to CSV
            </button>
            <button 
              onClick={() => exportToExcel(filteredRows)} 
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)', 
                color: '#fff', 
                fontWeight: '600', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ✅ Export to Excel
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px 16px',
                background: showHistory ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.9)',
                color: showHistory ? '#ffffff' : '#495057',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📋 Show History ({history.length})
            </button>
          </div>
        </div>

        {/* Middle Section - Filter and Search Controls */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          {/* Company Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#495057', fontSize: '0.9rem' }}>Company Status:</label>
            {statusOptions}
          </div>

          {/* Task Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#495057', fontSize: '0.9rem' }}>Task Status:</label>
            <select 
              value={filter} 
              onChange={e => { setFilter(e.target.value); setPage(1); }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Tasks</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>

          {/* Package Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#495057', fontSize: '0.9rem' }}>Package:</label>
            <select 
              value={packageFilter} 
              onChange={e => { setPackageFilter(e.target.value); setPage(1); }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Packages</option>
              {PACKAGE_LIST.map(pkg => (
                <option key={pkg} value={pkg}>{pkg}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '6px',
            padding: '4px 10px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <span style={{ fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search company..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ 
                minWidth: 160,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            />
          </div>
        </div>
      
        {/* History Panel */}
        {showHistory && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              color: '#495057',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              📋 Activity History
            </h3>
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
                          color: entry.oldValue === 'Completed' ? '#28a745' : 
                                 entry.oldValue === 'Pending' ? '#dc3545' : 
                                 entry.oldValue === 'Active' ? '#28a745' :
                                 entry.oldValue === 'EOC' ? '#dc3545' :
                                 entry.oldValue === 'OnHold' ? '#6f42c1' : '#6c757d', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>{entry.oldValue}</span>
                        <span style={{ color: '#adb5bd', margin: '0 2px' }}>→</span>
                        <span style={{ 
                          color: entry.newValue === 'Completed' ? '#28a745' : 
                                 entry.newValue === 'Pending' ? '#dc3545' : 
                                 entry.newValue === 'Active' ? '#28a745' :
                                 entry.newValue === 'EOC' ? '#dc3545' :
                                 entry.newValue === 'OnHold' ? '#6f42c1' : '#6c757d', 
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
      
      <style>{`
.package-badge {
  transition: filter 0.18s, box-shadow 0.18s;
}
.package-badge:hover {
  filter: brightness(1.15);
  box-shadow: 0 2px 12px #bdbdbd;
}
.search-filter-wrapper {
  position: relative;
  display: inline-block;
}
.search-filter-input {
  padding: 8px 32px 8px 36px;
  border-radius: 20px;
  border: 1.5px solid #bdbdbd;
  font-size: 1em;
  box-shadow: 0 1px 4px #ececec;
  outline: none;
  transition: border 0.18s, box-shadow 0.18s;
  background: #fafbfc;
}
.search-filter-input:focus {
  border: 1.5px solid #1976d2;
  box-shadow: 0 2px 8px #b3c6e7;
  background: #fff;
}
.search-filter-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2em;
  color: #bdbdbd;
  pointer-events: none;
}
.company-details-card {
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 18px;
  box-shadow: 0 4px 24px #e0e7ef;
  padding: 28px 28px 20px 28px;
  max-width: 1000px;
  width: 90vw;
  margin: 0 auto;
  margin-top: 32px;
  font-size: 1.08em;
}
.company-details-title {
  font-size: 1.35em;
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: 0.01em;
}
.company-details-list {
  margin-bottom: 18px;
  padding-left: 0;
  list-style: none;
}
.company-details-list li {
  margin-bottom: 4px;
  font-size: 1em;
}
.company-details-section {
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececec;
}
.company-details-section:last-child {
  border-bottom: none;
}
.company-details-label {
  font-weight: 700;
  margin-right: 8px;
  color: #232323;
  min-width: 90px;
  display: inline-block;
}
.company-details-status {
  margin-left: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  font-size: 1em;
}
.status-completed { color: #43a047; }
.status-pending { color: #ffa726; }
.status-not_started { color: #e53935; }
.status-not_set { color: #bdbdbd; }
.company-details-select {
  border-radius: 12px;
  padding: 6px 18px 6px 10px;
  font-size: 1em;
  border: 1.5px solid #bdbdbd;
  background: #f7f7fa;
  font-weight: 600;
  margin-left: 8px;
  margin-right: 4px;
  outline: none;
  transition: border 0.18s, box-shadow 0.18s;
}
.company-details-select:focus {
  border: 1.5px solid #1976d2;
  box-shadow: 0 2px 8px #b3c6e7;
  background: #fff;
}
.company-details-close {
  margin-top: 18px;
  background: #232323;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 28px;
  font-size: 1.08em;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
  box-shadow: 0 1px 4px #ececec;
}
.company-details-close:hover {
  background: #1976d2;
}
.status-icon {
  margin-right: 4px;
  font-size: 1.1em;
}
.company-details-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(44, 62, 80, 0.32);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.company-details-modal {
  z-index: 1100;
  max-width: 1100px;
  width: 98vw;
  box-shadow: 0 8px 32px #23232333;
  border-radius: 18px;
  background: #fff;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.company-details-section-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececec;
}
.company-details-section-row:last-child {
  border-bottom: none;
}
.company-details-section-label {
  font-weight: 700;
  color: #232323;
  min-width: 110px;
  font-size: 1.08em;
  margin-right: 8px;
}
.company-details-status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}
.company-details-status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.company-details-section-grid {
  display: grid;
  grid-template-columns: 140px repeat(2, 1fr);
  align-items: center;
  gap: 0 18px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ececec;
}
.company-details-section-grid:last-child {
  border-bottom: none;
}
.company-details-grid-label {
  font-weight: 700;
  color: #232323;
  font-size: 1.08em;
  margin-right: 8px;
  grid-row: 1;
  grid-column: 1;
}
.company-details-grid-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.status-pill {
  display: inline-block;
  padding: 2px 16px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1em;
  margin: 0 2px;
  background: #e0e0e0;
  color: #232323;
  min-width: 80px;
  text-align: center;
  box-shadow: 0 1px 2px #ececec;
  vertical-align: middle;
  transition: background 0.18s, color 0.18s;
}
.status-pill.completed {
  background: #43a047;
  color: #fff;
}
.status-pill.pending {
  background: #ffa726;
  color: #fff;
}
.status-pill.not_set {
  background: #bdbdbd;
  color: #fff;
}
`}</style>
        {/* Table Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#495057',
            marginBottom: '1.5rem',
            textAlign: 'center',
            flexShrink: 0
          }}>
            📊 Company Data Table
          </h3>
          <div className="responsive-table-wrapper" style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255, 255, 255, 0.95)' }}>
            <tr>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.95)' }}>Company Name</th>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.95)' }}>Package</th>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.95)' }}>Start Date</th>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.95)' }}>EOC Date</th>
              <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.95)' }}>Status</th>
              {TASK_GROUPS.map(group => (
                <th key={group.key} style={{ border: '1px solid #ccc', padding: 8, background: 'rgba(255, 255, 255, 0.95)' }}>
                  {group.label}
                  {group.fields.length > 1 && (
                    <div style={{ fontSize: '0.8em', color: '#888' }}>
                      {group.fields.map(f => f.label).join(' / ')}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map(row => {
              return (
                <tr key={row.id + row.package} style={{ 
                  cursor: 'pointer',
                  background: row.status === 'OnHold' ? '#f8f9fa' : 'transparent',
                  opacity: row.status === 'OnHold' ? 0.8 : 1,
                  borderLeft: row.status === 'OnHold' ? '4px solid #ba68c8' : 'none'
                }} onClick={() => setSelectedRow(row)}>
                  <td style={{ 
                    padding: 12,
                    background: row.status === 'Active' ? '#e8f5e9' : 
                                row.status === 'OnHold' ? '#f3e5f5' : 'transparent',
                    borderRadius: '8px',
                    border: row.status === 'Active' ? '1px solid #c8e6c9' : 
                           row.status === 'OnHold' ? '1px solid #e1bee7' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{row.name}</span>
                      {row.status === 'OnHold' && (
                        <span style={{ fontSize: '0.8rem', color: '#ba68c8' }} title="Company is on hold">⏸️</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <span className="package-badge" style={{
                      background: PACKAGE_COLORS[row.package] || '#eee',
                      color: '#fff',
                      padding: '2px 18px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: '0.95em',
                      border: PACKAGE_BORDERS[row.package] || 'none',
                      display: 'inline-block'
                    }}>
                      {row.package}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{row.start || 'N/A'}</td>
                  <td style={{ padding: 12 }}>
                    {row.eocDate ? row.eocDate : (row.start ? getEOC(row.start) : 'N/A')}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {renderStatusPill(row.status)}
                  </td>
                  {TASK_GROUPS.map(group => (
                    <td key={group.key} style={{ border: '1px solid #ccc', padding: 8, textAlign: 'center' }}>
                      {group.fields.map((field, idx) => {
                        const status = getStatusDisplay(row[field.key]);
                        let pillClass = 'status-pill';
                        if (status.label === 'Completed') pillClass += ' completed';
                        else if (status.label === 'Pending') pillClass += ' pending';
                        else pillClass += ' not_set';
                        return (
                          <React.Fragment key={field.key}>
                            <span className={pillClass}>{status.label}</span>
                            {group.fields.length > 1 && idx < group.fields.length - 1 && <span style={{ color: '#232323', fontWeight: 700, margin: '0 2px' }}>/</span>}
                          </React.Fragment>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination controls */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            background: page === 1 ? '#f0f0f0' : 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
            color: page === 1 ? '#bbb' : '#fff',
            border: page === 1 ? '1.5px solid #e0e0e0' : 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '1em',
            padding: '0.5em 1.5em',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            opacity: page === 1 ? 0.7 : 1,
            transition: 'background 0.18s, color 0.18s',
          }}
        >Prev</button>
        <span>Page {page} of {pageCount || 1}</span>
        <button
          onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          disabled={page === pageCount || pageCount === 0}
          style={{
            background: (page === pageCount || pageCount === 0) ? '#f0f0f0' : 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
            color: (page === pageCount || pageCount === 0) ? '#bbb' : '#fff',
            border: (page === pageCount || pageCount === 0) ? '1.5px solid #e0e0e0' : 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '1em',
            padding: '0.5em 1.5em',
            cursor: (page === pageCount || pageCount === 0) ? 'not-allowed' : 'pointer',
            opacity: (page === pageCount || pageCount === 0) ? 0.7 : 1,
            transition: 'background 0.18s, color 0.18s',
          }}
        >Next</button>
      </div>
      {selectedRow && (
        <div className="company-details-modal-overlay" onClick={e => { if (e.target.classList.contains('company-details-modal-overlay')) setSelectedRow(null); }}>
          <div className="company-details-modal">
            <div className="company-details-card">
              <div className="company-details-title">Details for {selectedRow.name}</div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px', 
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="company-details-label" style={{ minWidth: '80px', fontWeight: '600' }}>Package:</span>
                  <span className="package-badge" style={{
                    background: PACKAGE_COLORS[selectedRow.package] || '#eee',
                    color: '#fff',
                    padding: '2px 12px',
                    borderRadius: 16,
                    fontWeight: 600,
                    fontSize: '0.85em',
                    border: PACKAGE_BORDERS[selectedRow.package] || 'none',
                    letterSpacing: '0.02em',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'inline-block',
                  }}>{selectedRow.package}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="company-details-label" style={{ minWidth: '80px', fontWeight: '600' }}>Start Date:</span>
                  <span style={{ fontSize: '0.9em' }}>{selectedRow.start || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="company-details-label" style={{ minWidth: '80px', fontWeight: '600' }}>EOC Date:</span>
                  {editingEOCDate ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <DatePicker
                        selected={selectedDate}
                        onChange={date => setSelectedDate(date)}
                        dateFormat="MMM d, yyyy"
                        placeholderText="MM/DD/YYYY"
                        className="react-datepicker__input"
                        popperPlacement="bottom-start"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={20}
                        scrollableYearDropdown
                        customInput={
                          <input
                            style={{
                              width: '120px',
                              padding: '6px 8px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              outline: 'none'
                            }}
                            placeholder="MM/DD/YYYY"
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
                                  onClick={() => changeYear(date.getFullYear() - 1)}
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
                                  onMouseOver={e => {
                                    e.target.style.background = '#007bff';
                                    e.target.style.color = '#fff';
                                  }}
                                  onMouseOut={e => {
                                    e.target.style.background = '#e9ecef';
                                    e.target.style.color = '#495057';
                                  }}
                                >
                                  ←
                                </button>
                                <span style={{ 
                                  fontSize: '1rem', 
                                  fontWeight: '600', 
                                  color: '#495057',
                                  minWidth: '60px',
                                  textAlign: 'center'
                                }}>
                                  {date.getFullYear()}
                                </span>
                                <button
                                  onClick={() => changeYear(date.getFullYear() + 1)}
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
                                  onMouseOver={e => {
                                    e.target.style.background = '#007bff';
                                    e.target.style.color = '#fff';
                                  }}
                                  onMouseOut={e => {
                                    e.target.style.background = '#e9ecef';
                                    e.target.style.color = '#495057';
                                  }}
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
                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: '#495057',
                                marginBottom: '4px'
                              }}>
                                Quick Months:
                              </div>
                              <div style={{
                                display: 'flex',
                                gap: '3px',
                                flexWrap: 'wrap'
                              }}>
                                {/* All months for current year */}
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
                                      onClick={() => changeMonth(month)}
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
                      <button
                        onClick={() => handleEOCDateUpdate(selectedRow)}
                        style={{
                          padding: '4px 8px',
                          background: '#4caf50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingEOCDate(false);
                          setSelectedDate(null);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#ef5350',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9em' }}>{selectedRow.eocDate ? selectedRow.eocDate : (selectedRow.start ? getEOC(selectedRow.start) : 'N/A')}</span>
                      <button
                        onClick={() => {
                          setEditingEOCDate(true);
                          setSelectedDate(parseDate(selectedRow.eocDate || (selectedRow.start ? getEOC(selectedRow.start) : null)));
                        }}
                        style={{
                          padding: '3px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: darkMode ? '#90caf9' : '#1976d2',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '3px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Edit EOC Date"
                      >
                        ✏️
                      </button>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="company-details-label" style={{ minWidth: '80px', fontWeight: '600' }}>Status:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {statusSelect}
                    {renderStatusPill(selectedRow.status)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="company-details-label" style={{ minWidth: '80px', fontWeight: '600' }}>ID:</span>
                  <span style={{ fontSize: '0.9em' }}>{selectedRow.id || 'N/A'}</span>
                </div>
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Report:</div>
                {TASK_GROUPS[0].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 24 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                        disabled={selectedRow.status === 'OnHold'}
                        style={{
                          opacity: selectedRow.status === 'OnHold' ? 0.5 : 1,
                          cursor: selectedRow.status === 'OnHold' ? 'not-allowed' : 'pointer',
                          background: selectedRow.status === 'OnHold' ? '#f5f5f5' : 'white'
                        }}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[0].fields.length }).map((_, idx) => (
                  <div key={`report-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Link Building:</div>
                {TASK_GROUPS[1].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  if (TASK_GROUPS[1].key === 'linkBuilding' && (!selectedRow[field.key] || status.label === 'Not set')) {
                    status = getStatusDisplay('pending');
                  }
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 24 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                        disabled={selectedRow.status === 'OnHold'}
                        style={{
                          opacity: selectedRow.status === 'OnHold' ? 0.5 : 1,
                          cursor: selectedRow.status === 'OnHold' ? 'not-allowed' : 'pointer',
                          background: selectedRow.status === 'OnHold' ? '#f5f5f5' : 'white'
                        }}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[1].fields.length }).map((_, idx) => (
                  <div key={`linkbuilding-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Site Audit:</div>
                {TASK_GROUPS[2].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 24 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                        disabled={selectedRow.status === 'OnHold'}
                        style={{
                          opacity: selectedRow.status === 'OnHold' ? 0.5 : 1,
                          cursor: selectedRow.status === 'OnHold' ? 'not-allowed' : 'pointer',
                          background: selectedRow.status === 'OnHold' ? '#f5f5f5' : 'white'
                        }}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[2].fields.length }).map((_, idx) => (
                  <div key={`siteaudit-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <div className="company-details-section-grid">
                <div className="company-details-grid-label">Bookmarking:</div>
                {TASK_GROUPS[3].fields.map((field, idx) => {
                  let status = getStatusDisplay(selectedRow[field.key]);
                  return (
                    <div key={field.key} className="company-details-grid-cell">
                      <span style={{ minWidth: 70 }}>{field.label}:</span>
                      <select
                        className="company-details-select"
                        value={selectedRow[field.key] || ''}
                        onChange={e => handleStatusChange(selectedRow, field.key, e.target.value)}
                        disabled={selectedRow.status === 'OnHold'}
                        style={{
                          opacity: selectedRow.status === 'OnHold' ? 0.5 : 1,
                          cursor: selectedRow.status === 'OnHold' ? 'not-allowed' : 'pointer',
                          background: selectedRow.status === 'OnHold' ? '#f5f5f5' : 'white'
                        }}
                      >
                        <option value="">Not set</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <span className={`company-details-status status-${(status.label || '').replace(/ /g, '_').toLowerCase()}`}>
                        <span className="status-icon">{status.icon}</span>{status.label}
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: GRID_COLUMNS - TASK_GROUPS[3].fields.length }).map((_, idx) => (
                  <div key={`bookmarking-empty-${idx}`} className="company-details-grid-cell" />
                ))}
              </div>
              <button className="company-details-close" onClick={() => setSelectedRow(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for EOC */}
      {confirmEOCModal && (
        <div style={styles.modalOverlay} onClick={() => setConfirmEOCModal(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Confirm EOC Status</div>
            <div style={styles.modalText}>
              Are you sure you want to mark <strong>{confirmEOCModal.name}</strong> as EOC?
              <div style={{ marginTop: '12px', fontSize: '0.95em', color: '#666' }}>
                <div>Start Date: {confirmEOCModal.start || 'N/A'}</div>
                <div>EOC Date: {selectedRow?.eocDate || confirmEOCModal.eocDate || (confirmEOCModal.start ? getEOC(confirmEOCModal.start) : 'Will be set to current date')}</div>
              </div>
              <div style={{ marginTop: '12px', padding: '8px', background: '#fff4e5', borderRadius: '6px', fontSize: '0.9em', color: '#b45309' }}>
                This will move the company to the EOC accounts page.
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.buttonCancel}
                onClick={() => setConfirmEOCModal(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.buttonConfirm}
                onClick={async () => {
                  // Always use the latest selectedRow for EOC date
                  await updateStatus({ ...confirmEOCModal, eocDate: selectedRow?.eocDate }, 'status', 'EOC');
                  setConfirmEOCModal(null);
                }}
              >
                Mark as EOC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
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
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Clear History Log?</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to clear the entire history log? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={handleClearHistory}
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
                Yes, Clear All
              </button>
              <button
                onClick={() => setClearHistoryModal(false)}
                style={{
                  padding: '10px 25px',
                  background: '#6c757d',
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
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <h3 style={{ marginBottom: 15, color: '#333' }}>Revert Change?</h3>
            <p style={{ marginBottom: 25, color: '#555', fontSize: '0.95em' }}>
              Are you sure you want to revert the change for <strong>{revertModal.companyName}</strong>?
              <br />
              <span style={{ color: '#666', fontSize: '0.9em' }}>
                {revertModal.field}: {revertModal.newValue} → {revertModal.oldValue}
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15 }}>
              <button
                onClick={confirmRevert}
                style={{
                  padding: '10px 25px',
                  background: '#ffc107',
                  color: '#000000',
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
                  background: '#6c757d',
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
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      </div>
    </div>
  );
} 