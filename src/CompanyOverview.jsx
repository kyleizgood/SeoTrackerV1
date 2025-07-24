import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  getPackages,
  updatePackageCompanyStatus,
  markAsEOC,
  updateEOCDate
} from './firestoreHelpers';
import * as XLSX from 'xlsx';
import { getEOC } from './App.jsx';

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
  successToast: {
    position: 'fixed',
    top: '80px', // Changed from '24px' to '80px' to appear below the navbar
    right: '24px',
    padding: '12px 24px',
    background: '#ef5350',
    color: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out'
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  // Add new state variables at the top of the component
  const [editingEOCDate, setEditingEOCDate] = useState(false);
  const [newEOCDate, setNewEOCDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  // 1. Add a new state for the toast message
  const [toastMessage, setToastMessage] = useState('');

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
              eocDate: company.eocDate ? company.eocDate : (company.start ? getEOC(company.start) : 'N/A')
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
    fetchData();
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

  // 2. Update handleEOCDateUpdate to set the correct toast message and update the local state only for the edited row
  const handleEOCDateUpdate = async (row) => {
    try {
      if (!selectedDate) {
        alert('Please select a date');
        return;
      }
      
      const formattedDate = formatDate(selectedDate);
      await updateEOCDate(row.id, row.package, formattedDate);
      
      // Update local state
      setRows(prevRows => {
        const updatedRows = prevRows.map(r => 
          r.id === row.id ? { ...r, eocDate: formattedDate } : r
        );
        console.log('[CompanyOverview] Updated rows after EOC date change:', updatedRows);
        return updatedRows;
      });
      // Update selectedRow if it matches the edited row
      setSelectedRow(prev => prev && prev.id === row.id ? { ...prev, eocDate: formattedDate } : prev);
      
      setEditingEOCDate(false);
      setSelectedDate(null);
      setToastMessage('EOC date updated successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Error updating EOC date:', error);
      alert('Error updating EOC date');
    }
  };

  const isFinalEOC = (row) => {
    // Example logic: Only allow EOC if not on hold and has no extension
    // You can adjust this logic as needed
    return row.status !== 'OnHold' && (!row.extension || row.extension === 0);
  };

  // 3. Update updateStatus to set the correct toast message for EOC status change
  const updateStatus = async (row, fieldKey, value) => {
    try {
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
        const updatedCompany = await markAsEOC(row.id, row.package, finalEOCDate);
        console.log('Received updated company:', updatedCompany);
        setRows(prevRows => {
          const newRows = prevRows.map(r =>
            r.id === row.id ? {
              ...r,
              ...updatedCompany,
              eocDate: updatedCompany.eocDate || finalEOCDate
            } : r
          );
          console.log('Updated rows:', newRows);
          return newRows;
        });
        setToastMessage('Company moved to EOC accounts');
        await updatePackageCompanyStatus(row.id, row.package, fieldKey, value);
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
        setRows(allRows);
      } else {
        await updatePackageCompanyStatus(row.id, row.package, fieldKey, value);
        // Re-fetch packages to update UI
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
        setRows(allRows);
      }

      if (value === 'EOC') {
        setSelectedRow(null);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        setSelectedRow(prev => prev && prev.id === row.id && prev.package === row.package ? 
          { ...prev, [fieldKey]: value } : prev);
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
    <div style={{ padding: 24, background: darkMode ? '#181a1b' : '#f7f6f2', minHeight: '100vh' }}>
      <h2>Company Task Overview</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => exportToCSV(filteredRows)} style={{ padding: '6px 16px', borderRadius: 6, background: '#1976d2', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Export to CSV</button>
        <button onClick={() => exportToExcel(filteredRows)} style={{ padding: '6px 16px', borderRadius: 6, background: '#43a047', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Export to Excel</button>
        
        {/* Add new status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>Company Status:</label>
          {statusOptions}
        </div>

        <label>Task Status:</label>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="all">All Tasks</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="not_started">Not Started</option>
        </select>

        <label>Package:</label>
        <select value={packageFilter} onChange={e => { setPackageFilter(e.target.value); setPage(1); }}>
          <option value="all">All Packages</option>
          {PACKAGE_LIST.map(pkg => (
            <option key={pkg} value={pkg}>{pkg}</option>
          ))}
        </select>

        <div className="search-filter-wrapper">
          <span className="search-filter-icon" role="img" aria-label="Search">🔍</span>
          <input
            type="text"
            className="search-filter-input"
            placeholder="Search company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ minWidth: 180 }}
          />
        </div>
      </div>
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
      <div className="responsive-table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Company Name</th>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Package</th>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Start Date</th>
              <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>EOC Date</th>
              <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Status</th>
              {TASK_GROUPS.map(group => (
                <th key={group.key} style={{ border: '1px solid #ccc', padding: 8 }}>
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
              console.log('Rendering row:', row);
              return (
                <tr key={row.id + row.package} style={{ cursor: 'pointer' }} onClick={() => setSelectedRow(row)}>
                  <td style={{ padding: 12 }}>{row.name}</td>
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
                    {console.log('EOC date rendering:', { 
                      status: row.status, 
                      eocDate: row.eocDate, 
                      start: row.start,
                      calculatedEOC: row.start ? getEOC(row.start) : 'N/A'
                    })}
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
      {/* Pagination controls */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
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
              <ul className="company-details-list">
                <li><span className="company-details-label">Package:</span> <span className="package-badge" style={{
                  background: PACKAGE_COLORS[selectedRow.package] || '#eee',
                  color: '#fff',
                  padding: '2px 18px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: '1em',
                  border: PACKAGE_BORDERS[selectedRow.package] || 'none',
                  marginRight: 2,
                  letterSpacing: '0.03em',
                  boxShadow: '0 1px 4px #ececec',
                  display: 'inline-block',
                }}>{selectedRow.package}</span></li>
                <li><span className="company-details-label">Start Date:</span> {selectedRow.start || 'N/A'}</li>
                <li>
                  <span className="company-details-label">EOC Date:</span>
                  {editingEOCDate ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                      <DatePicker
                        selected={selectedDate}
                        onChange={date => setSelectedDate(date)}
                        dateFormat="MMMM d, yyyy"
                        placeholderText="Select date..."
                        className="react-datepicker__input"
                        popperPlacement="bottom-start"
                      />
                      <button
                        onClick={() => handleEOCDateUpdate(selectedRow)}
                        style={{
                          padding: '6px 12px',
                          background: '#4caf50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
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
                          padding: '6px 12px',
                          background: '#ef5350',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                      <span>{selectedRow.eocDate ? selectedRow.eocDate : (selectedRow.start ? getEOC(selectedRow.start) : 'N/A')}</span>
                      <button
                        onClick={() => {
                          setEditingEOCDate(true);
                          setSelectedDate(parseDate(selectedRow.eocDate || (selectedRow.start ? getEOC(selectedRow.start) : null)));
                        }}
                        style={{
                          padding: '4px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: darkMode ? '#90caf9' : '#1976d2',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          marginLeft: '4px'
                        }}
                        title="Edit EOC Date"
                      >
                        ✏️
                      </button>
                    </span>
                  )}
                </li>
                <li>
                  <span className="company-details-label">Status:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {statusSelect}
                    {renderStatusPill(selectedRow.status)}
                  </div>
                </li>
                <li><span className="company-details-label">ID:</span> {selectedRow.id || 'N/A'}</li>
              </ul>
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
                  // Reload data to ensure all UI is up to date
                  await reloadRows();
                }}
              >
                Mark as EOC
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